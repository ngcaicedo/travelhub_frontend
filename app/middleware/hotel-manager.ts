export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (!auth.isAuthenticated) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
  const managerRoles = ['hotel_admin', 'hotel_manager']
  if (!auth.role || !managerRoles.includes(auth.role)) {
    return navigateTo('/hotel/dashboard')
  }
})
