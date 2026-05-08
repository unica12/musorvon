import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Validate required secrets are configured
  const YOOKASSA_SHOP_ID = Deno.env.get('YOOKASSA_SHOP_ID')
  const YOOKASSA_SECRET_KEY = Deno.env.get('YOOKASSA_SECRET_KEY')
  const APP_URL = Deno.env.get('APP_URL') ?? 'https://musor-von.ru'
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    console.error('Missing YooKassa secrets: YOOKASSA_SHOP_ID or YOOKASSA_SECRET_KEY not set')
    return jsonResponse({ error: 'Payment service not configured' }, 500)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )

    if (authError || !user) {
      console.error('Auth error:', authError)
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body = await req.json() as { apartmentId?: string }
    const { apartmentId } = body

    if (!apartmentId) {
      return jsonResponse({ error: 'apartmentId is required' }, 400)
    }

    // Verify apartment belongs to user
    const { data: apartment, error: aptError } = await supabase
      .from('apartments')
      .select('id')
      .eq('id', apartmentId)
      .eq('user_id', user.id)
      .single()

    if (aptError || !apartment) {
      console.error('Apartment error:', aptError)
      return jsonResponse({ error: 'Apartment not found' }, 404)
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        apartment_id: apartmentId,
        status: 'pending',
        amount: 10000,
        payment_status: 'pending',
        payment_id: null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order insert error:', orderError)
      return jsonResponse({ error: 'Failed to create order' }, 500)
    }

    // Create YooKassa payment
    const credentials = btoa(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`)
    const paymentResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        amount: { value: '100.00', currency: 'RUB' },
        confirmation: {
          type: 'redirect',
          return_url: `${APP_URL}/payment/success?orderId=${order.id}`,
        },
        description: `МусорВон — вынос мусора, заказ #${order.id.slice(0, 8).toUpperCase()}`,
        metadata: { order_id: order.id },
        capture: true,
      }),
    })

    if (!paymentResponse.ok) {
      const errData = await paymentResponse.text()
      console.error('YooKassa error:', paymentResponse.status, errData)
      await supabase.from('orders').delete().eq('id', order.id)
      return jsonResponse({ error: 'YooKassa payment creation failed', detail: errData }, 502)
    }

    const payment = await paymentResponse.json() as {
      id: string
      confirmation: { confirmation_url: string }
    }

    await supabase
      .from('orders')
      .update({ payment_id: payment.id })
      .eq('id', order.id)

    return jsonResponse({
      orderId: order.id,
      confirmationUrl: payment.confirmation.confirmation_url,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
