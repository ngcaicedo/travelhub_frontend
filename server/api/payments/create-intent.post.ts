export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  try {
    return await $fetch(`${config.public.paymentsApiBase}/api/v1/payments/create-intent`, {
      method: 'POST',
      timeout: 10000,
      body,
      headers: {
        'x-forwarded-proto': 'https'
      }
    })
  } catch (error: unknown) {
    const response = (error as { response?: { status?: number, _data?: unknown } } | null)?.response

    throw createError({
      statusCode: response?.status || 500,
      statusMessage: 'Create intent request failed',
      data: response?._data || null
    })
  }
})
