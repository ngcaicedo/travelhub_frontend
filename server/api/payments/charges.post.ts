export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  try {
    return await $fetch(`${config.public.paymentsApiBase}/api/v1/payments/charges`, {
      method: 'POST',
      timeout: 10000,
      body,
      headers: {
        'x-forwarded-proto': 'https'
      }
    })
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: 'Payments request failed',
      data: error?.response?._data || null
    })
  }
})
