export function createUsersClient() {
  return $fetch.create({
    baseURL: useRuntimeConfig().public.usersApiBase
  })
}

export function createSecurityClient() {
  return $fetch.create({
    baseURL: useRuntimeConfig().public.securityApiBase
  })
}

export function createPaymentsClient() {
  return $fetch.create({
    baseURL: useRuntimeConfig().public.paymentsApiBase
  })
}
