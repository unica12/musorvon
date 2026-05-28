import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { orderId } = await req.json() as { orderId?: string }

    if (!orderId) return json({ error: 'orderId is required' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order } = await admin
      .from('orders')
      .select('payment_id, status, payment_status, amount, created_at')
      .eq('id', orderId)
      .maybeSingle()

    if (!order) return json({ error: 'Order not found' }, 404)

    // Already succeeded without YooKassa (package balance use)
    if (order.payment_status === 'succeeded') return json({ status: 'succeeded', orderId })

    // No payment_id yet — still creating
    if (!order.payment_id) return json({ status: 'pending' })

    const shopId = Deno.env.get('YOOKASSA_SHOP_ID')
    const secret = Deno.env.get('YOOKASSA_SECRET_KEY')

    const ykResponse = await fetch(
      `https://api.yookassa.ru/v3/payments/${order.payment_id}`,
      {
        headers: {
          'Authorization': 'Basic ' + btoa(`${shopId}:${secret}`),
          'Content-Type': 'application/json',
        },
      },
    )

    if (!ykResponse.ok) {
      console.error('YooKassa fetch error:', ykResponse.status, await ykResponse.text())
      return json({ error: 'YooKassa unavailable' }, 502)
    }

    const payment = await ykResponse.json() as { status: string }

    // Sync DB if status changed
    if (payment.status === 'succeeded' && order.payment_status !== 'succeeded') {
      await admin.from('orders').update({
        payment_status: 'succeeded',
        status: 'paid',
        updated_at: new Date().toISOString(),
      }).eq('id', orderId)
    } else if (payment.status === 'canceled' && order.payment_status !== 'cancelled') {
      await admin.from('orders').update({
        payment_status: 'cancelled',
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('id', orderId)
    }

    return json({ status: payment.status, orderId })
  } catch (e) {
    console.error('check-payment error:', e)
    return json({ error: (e as Error).message }, 500)
  }
})
