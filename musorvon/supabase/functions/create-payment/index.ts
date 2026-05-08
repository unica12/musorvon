import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const YOOKASSA_SHOP_ID = Deno.env.get('YOOKASSA_SHOP_ID')!
const YOOKASSA_SECRET_KEY = Deno.env.get('YOOKASSA_SECRET_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://musor-von.ru'
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

    const { apartmentId } = await req.json() as { apartmentId: string }

    // Verify apartment belongs to user
    const { data: apartment, error: aptError } = await supabase
      .from('apartments')
      .select('id')
      .eq('id', apartmentId)
      .eq('user_id', user.id)
      .single()

    if (aptError || !apartment) {
      return new Response(JSON.stringify({ error: 'Apartment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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
      throw new Error('Failed to create order')
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
      const errData = await paymentResponse.json()
      console.error('YooKassa error:', errData)
      // Clean up order on YooKassa failure
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error('Ошибка создания платежа в ЮКассе')
    }

    const payment = await paymentResponse.json() as {
      id: string
      confirmation: { confirmation_url: string }
    }

    // Save payment_id to order
    await supabase
      .from('orders')
      .update({ payment_id: payment.id })
      .eq('id', order.id)

    return new Response(
      JSON.stringify({
        orderId: order.id,
        confirmationUrl: payment.confirmation.confirmation_url,
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
