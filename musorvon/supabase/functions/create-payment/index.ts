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

const PACKAGE_AMOUNTS: Record<string, number> = { '1': 100, '5': 400, '10': 700 }
const PACKAGE_SIZES: Record<string, number>   = { '1': 1,   '5': 5,   '10': 10 }
const PROMO_LIMIT = 3

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const YOOKASSA_SHOP_ID      = Deno.env.get('YOOKASSA_SHOP_ID')
  const YOOKASSA_SECRET_KEY   = Deno.env.get('YOOKASSA_SECRET_KEY')
  const APP_URL               = Deno.env.get('APP_URL') ?? 'https://musor-von.ru'
  const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    return json({ error: 'Payment service not configured' }, 500)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const { data: { user }, error: authError } = await admin.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    const body = await req.json() as { apartmentId?: string; packageType?: string | null }
    const { apartmentId, packageType } = body

    if (!apartmentId) return json({ error: 'apartmentId is required' }, 400)

    // Fetch apartment (verifies ownership and gets promo status)
    const { data: apartment } = await admin
      .from('apartments')
      .select('*')
      .eq('id', apartmentId)
      .eq('user_id', user.id)
      .single()

    if (!apartment) return json({ error: 'Apartment not found' }, 404)

    console.log('[create-payment] apartment.promo_orders_used:', apartment.promo_orders_used)
    console.log('[create-payment] promoUsed:', apartment.promo_orders_used ?? 0)
    console.log('[create-payment] isPromo:', (apartment.promo_orders_used ?? 0) < PROMO_LIMIT)
    console.log('[create-payment] packageType received:', packageType)
    console.log('[create-payment] amount will be:', (apartment.promo_orders_used ?? 0) < PROMO_LIMIT ? 1 : 'paid')

    // Working hours check (Moscow time)
    const moscowTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }))
    const moscowHour = moscowTime.getHours()
    if (moscowHour < 9 || moscowHour >= 19) {
      return json({
        error: 'outside_hours',
        message: 'Приём заказов с 9:00 до 19:00 по московскому времени',
      }, 400)
    }

    // Auto-cancel stale pending orders older than 10 minutes
    await admin
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('apartment_id', apartmentId)
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

    // 3-hour cooldown check
    const { data: recentOrder } = await admin
      .from('orders')
      .select('created_at')
      .eq('apartment_id', apartmentId)
      .in('status', ['pending', 'paid', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentOrder) {
      const diffMs = Date.now() - new Date(recentOrder.created_at).getTime()
      const THREE_HOURS = 10 * 60 * 1000 // 10 минут
      if (diffMs < THREE_HOURS) {
        const rem = THREE_HOURS - diffMs
        const h = Math.floor(rem / 3600000)
        const m = Math.floor((rem % 3600000) / 60000)
        return json({
          error: 'cooldown',
          message: `Следующий вынос доступен через ${h} ч ${m} мин`,
        }, 400)
      }
    }

    // Determine amount, isPromo, packageId
    const promoUsed = apartment.promo_orders_used ?? 0
    const isPromo = promoUsed < PROMO_LIMIT
    let amount: number
    let packageId: string | null = null
    let activePackage: { id: string; used_orders: number } | null = null

    if (packageType && PACKAGE_AMOUNTS[packageType]) {
      // User explicitly chose a package — use package price regardless of promo
      amount = PACKAGE_AMOUNTS[packageType]
    } else if (isPromo) {
      // No package selected — use promo
      amount = 1
    } else {
      // Use existing package balance
      const { data: pkg } = await admin
        .from('packages')
        .select('*')
        .eq('apartment_id', apartmentId)
        .filter('used_orders', 'lt', 'total_orders')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!pkg) return json({ error: 'No active package' }, 400)
      activePackage = pkg as { id: string; used_orders: number }
      packageId = pkg.id
      amount = 0
    }

    // Create order record
    console.log('[create-payment] inserting order:', {
      user_id: user.id,
      apartment_id: apartmentId,
      amount,
      is_promo: isPromo,
      package_id: packageId,
    })

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: user.id,
        apartment_id: apartmentId,
        status: 'pending',
        amount,
        payment_status: 'pending',
        payment_id: null,
        is_promo: isPromo,
        package_id: packageId,
      })
      .select()
      .single()

    console.log('[create-payment] order insert result:', { order, orderError })

    if (orderError || !order) {
      console.error('Order insert error:', orderError)
      return json({ error: 'Failed to create order' }, 500)
    }

    // Package balance — no YooKassa needed, instant success
    if (amount === 0 && activePackage) {
      await admin.from('orders').update({
        status: 'paid',
        payment_status: 'succeeded',
        updated_at: new Date().toISOString(),
      }).eq('id', order.id)

      await admin.from('packages').update({
        used_orders: activePackage.used_orders + 1,
      }).eq('id', activePackage.id)

      return json({
        orderId: order.id,
        confirmationUrl: `${APP_URL}/payment/success?orderId=${order.id}`,
      })
    }

    // Create YooKassa payment
    const credentials = btoa(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`)
    const description = isPromo
      ? `МусорВон — промо вынос, заказ #${order.id.slice(0, 8).toUpperCase()}`
      : `МусорВон — пакет ${PACKAGE_SIZES[packageType!] ?? 1} выносов`

    const paymentResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        amount: { value: amount.toFixed(2), currency: 'RUB' },
        confirmation: {
          type: 'redirect',
          return_url: `${APP_URL}/payment/success?orderId=${order.id}`,
        },
        description,
        metadata: { order_id: order.id, is_promo: isPromo, package_type: packageType ?? null },
        capture: true,
      }),
    })

    if (!paymentResponse.ok) {
      const errData = await paymentResponse.text()
      console.error('YooKassa error:', paymentResponse.status, errData)
      await admin.from('orders').delete().eq('id', order.id)
      return json({ error: 'YooKassa payment creation failed', detail: errData }, 502)
    }

    const payment = await paymentResponse.json() as {
      id: string
      confirmation: { confirmation_url: string }
    }

    await admin.from('orders').update({ payment_id: payment.id }).eq('id', order.id)

    return json({
      orderId: order.id,
      confirmationUrl: payment.confirmation.confirmation_url,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
