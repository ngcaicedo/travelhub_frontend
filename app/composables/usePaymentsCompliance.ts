export function usePaymentsCompliance() {
  const runtimeConfig = useRuntimeConfig()

  return computed(() => {
    return String(runtimeConfig.public.paymentsComplianceMode).toLowerCase() === 'true'
  })
}
