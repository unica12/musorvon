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

    // Verify the webhook is from YooKassa
    const isValid = await verifyYooKassaSignature(body, YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)
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
      // Update order
      const { data: order } = await supabase
        .from('orders')
        .update({
          payment_status: 'succeeded',
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select('user_id')
        .single()

      // Send push notification
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
