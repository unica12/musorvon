import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const YOOKASSA_SHOP_ID = Deno.env.get('YOOKASSA_SHOP_ID')!
const YOOKASSA_SECRET_KEY = Deno.env.get('YOOKASSA_SECRET_KEY')!
const YOOKASSA_RETURN_URL = Deno.env.get('YOOKASSA_RETURN_URL')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { order_id } = await req.json() as { order_id: string }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create YooKassa payment
    const idempotenceKey = crypto.randomUUID()
    const credentials = btoa(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`)

    const paymentResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify({
        amount: { value: (order.amount / 100).toFixed(2), currency: 'RUB' },
        confirmation: {
          type: 'redirect',
          return_url: `${YOOKASSA_RETURN_URL}/success?order_id=${order_id}`,
        },
        description: `МусорВон — вынос мусора, заказ #${order_id.slice(0, 8).toUpperCase()}`,
        metadata: { order_id },
        capture: true,
      }),
    })

    if (!paymentResponse.ok) {
      const errData = await paymentResponse.json()
      console.error('YooKassa error:', errData)
      throw new Error('Ошибка создания платежа в ЮКассе')
    }

    const payment = await paymentResponse.json() as {
      id: string
      confirmation: { confirmation_url: string }
    }

    // Update order with payment_id
    await supabase
      .from('orders')
      .update({ payment_id: payment.id, payment_status: 'pending' })
      .eq('id', order_id)

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        confirmation_url: payment.confirmation.confirmation_url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
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
