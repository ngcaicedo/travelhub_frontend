export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const paymentId = getRouterParam(event, 'paymentId')

  try {
    return await $fetch(`${config.public.paymentsApiBase}/api/v1/payments/${paymentId}`, {
      timeout: 10000
    })
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: 'Payment lookup failed',
      data: error?.response?._data || null
    })
  }
})
