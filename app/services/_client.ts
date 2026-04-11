export function createUsersClient() {
  return $fetch.create({
    baseURL: useRuntimeConfig().public.usersApiUrl
  })
}

export function createSecurityClient() {
  return $fetch.create({
    baseURL: useRuntimeConfig().public.securityApiUrl
  })
}

export function createSearchClient() {
  return $fetch.create({
    baseURL: useRuntimeConfig().public.searchApiUrl
  })
}

export function createPaymentsClient() {
  return $fetch.create({
    baseURL: useRuntimeConfig().public.paymentsApiBase
  })
}
