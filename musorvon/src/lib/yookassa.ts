// TODO: replace with real ЮКасса integration

export interface CreatePaymentResult {
  payment_id: string
  confirmation_url: string
}

/** Mock stub — simulates a successful payment after a short delay. */
export async function createPayment(orderId: string): Promise<CreatePaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return {
    payment_id: `mock_${orderId}_${Date.now()}`,
    confirmation_url: '',
  }
}
