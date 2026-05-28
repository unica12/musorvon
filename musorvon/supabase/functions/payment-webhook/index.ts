import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const YOOKASSA_SHOP_ID = Deno.env.get('YOOKASSA_SHOP_ID')!
const YOOKASSA_SECRET_KEY = Deno.env.get('YOOKASSA_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
}

async function verifyYooKassaSignature(
  body: string,
  shopId: string,
  secretKey: string,
): Promise<boolean> {
  // YooKassa uses HTTP Basic Auth in webhook — verify via re-fetch
  // In production use IP allowlist from YooKassa docs
  // Simple verification: check payment status directly from API
  const payload = JSON.parse(body) as { object?: { id?: string } }
  const paymentId = payload?.object?.id
  if (!paymentId) return false

  const credentials = btoa(`${shopId}:${secretKey}`)
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { 'Authorization': `Basic ${credentials}` },
  })
  return res.ok
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.text()

    console.log('[webhook] received event body length:', body.length)
    console.log('[webhook] body preview:', body.slice(0, 200))

    // Verify the webhook is from YooKassa
    const isValid = await verifyYooKassaSignature(body, YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)
    console.log('[webhook] isValid:', isValid)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const event = JSON.parse(body) as {
      event: string
      object: {
        id: string
        status: string
        metadata: { order_id: string }
      }
    }

    const { event: eventType, object: payment } = event
    const orderId = payment.metadata?.order_id

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'No order_id in metadata' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    if (eventType === 'payment.succeeded') {
      const { data: order } = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select('user_id, is_promo, package_id, apartment_id, amount')
        .single()

      if (order?.is_promo) {
        const { data: apt } = await supabase
          .from('apartments')
          .select('promo_orders_used, promo_started_at')
          .eq('id', order.apartment_id)
          .single()
        await supabase.from('apartments').update({
          promo_orders_used: (apt?.promo_orders_used ?? 0) + 1,
          promo_started_at: apt?.promo_started_at ?? new Date().toISOString(),
        }).eq('id', order.apartment_id)
      } else if (order?.package_id) {
        const { data: pkg } = await supabase
          .from('packages')
          .select('used_orders')
          .eq('id', order.package_id)
          .single()
        await supabase.from('packages').update({
          used_orders: (pkg?.used_orders ?? 0) + 1,
        }).eq('id', order.package_id)
      } else if (order) {
        const PACKAGE_ORDERS: Record<number, number> = { 100: 1, 400: 5, 700: 10 }
        const totalOrders = PACKAGE_ORDERS[order.amount] ?? 1
        await supabase.from('packages').insert({
          apartment_id: order.apartment_id,
          total_orders: totalOrders,
          used_orders: 1,
          amount_paid: order.amount,
        })
      }

      if (order?.user_id) {
        await sendPushNotification(
          supabase,
          order.user_id,
          'Оплата подтверждена! 🎉',
          'Курьер скоро будет у вас. Ожидайте 15–30 минут.',
        )
      }
    } else if (eventType === 'payment.canceled') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'cancelled',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

async function sendPushNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  body: string,
) {
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)

  if (!subscriptions?.length) return

  const payload = JSON.stringify({ title, body, icon: '/icon-192.png' })

  for (const row of subscriptions) {
    const sub = row.subscription as {
      endpoint: string
      keys: { p256dh: string; auth: string }
    }

    try {
      await sendWebPush(sub, payload)
    } catch (err) {
      console.error('Push send error:', err)
    }
  }
}

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
) {
  // Simple VAPID web push using fetch
  // In production use web-push npm package or Deno equivalent
  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '60',
    },
    body: payload,
  })

  if (!res.ok) {
    console.error('Push failed:', res.status, await res.text())
  }
}
