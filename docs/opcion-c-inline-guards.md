# Opción C: Guards inline con `onBeforeMount` / `onMounted`

## Problema

En Nuxt 4, las rutas generadas por el sistema de archivos se anidan cuando hay directorios. El `definePageMeta({ middleware })` del padre se hereda a los hijos vía `route.meta` fusionado de Vue Router.

Esto impide tener una ruta hija SIN middleware cuando el padre lo requiere.

## Solución: reemplazar `definePageMeta({ middleware })` por guards inline

En vez de declarar el middleware en `definePageMeta`, se declara directamente en el `<script setup>` de cada página usando `onMounted` o `onBeforeMount`.

### Estructura resultante (revertir Opción A)

```
app/pages/hotel/pricing/
  index.vue
  [propertyId].vue              ← guard inline
  [propertyId]/
    new.vue                      ← SIN guard (acceso público con rol hotel)
    [seasonalPriceId].vue        ← guard inline
```

### Ventajas

- Control granular: cada página decide si requiere auth o no
- Sin herencia de middleware entre rutas padre/hijo
- La URL se mantiene como `/hotel/pricing/:propertyId/new` (no cambia)
- El resto del sistema (enlaces, redirects) no requiere actualización

### Desventajas

- Código duplicado: el guard debe repetirse en cada página que requiera auth
- No usa el sistema de middleware declarativo de Nuxt
- El guard se ejecuta después del montaje del componente (no antes como el middleware de ruta)

## Código del guard inline

```ts
// Guard genérico para páginas hotel
// Copiar en cada página que requiera autenticación hotel

const authStore = useAuthStore()
const route = useRoute()

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (!authStore.isHotelUser) {
    await navigateTo('/properties')
    return
  }
  // Código normal de la página aquí
  await loadData()
})
```

## Uso en `definePageMeta`

Al usar guards inline, `definePageMeta` queda solo con el layout:

```ts
definePageMeta({
  layout: 'hotel',
  // Sin middleware — el control se hace inline
})
```

## Archivos a modificar

### 1. `app/pages/hotel/pricing/[propertyId].vue`

Eliminar `middleware: 'hotel-only'` de `definePageMeta` y agregar guard inline con la lógica de autenticación.

### 2. `app/pages/hotel/pricing/[propertyId]/[seasonalPriceId].vue`

Igual que `[propertyId].vue`: eliminar `middleware` de `definePageMeta` y agregar guard inline.

### 3. `app/pages/hotel/pricing/[propertyId]/new.vue`

NO requiere guard inline (es la página de creación, accesible con solo rol hotel). Mantener sin middleware.

### 4. `app/pages/hotel/pricing/index.vue`

Requiere guard inline. Contiene el listado de propiedades del hotel.

### 5. Otras páginas hotel (`dashboard.vue`, `reservations.vue`, `reservations/[id].vue`)

Aplicar el mismo patrón si se desea consistencia.

## Ejemplo completo

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'hotel',
})

const authStore = useAuthStore()
const route = useRoute()
const { t } = useI18n()

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    return navigateTo({ path: '/login', query: { redirect: route.fullPath } })
  }
  if (!authStore.isHotelUser) {
    return navigateTo('/properties')
  }
  await loadData()
})

// Resto del componente
</script>
```

## Nota sobre `onBeforeMount` vs `onMounted`

Usar `onBeforeMount` minimiza el parpadeo (el componente no se renderiza antes del redirect), pero ambas opciones funcionan. Nuxt middleware se ejecuta antes de la navegación; el inline mount se ejecuta después. La diferencia práctica es mínima.

## Referencia

Este patrón ya existe en el códigobase:

- `app/pages/hotel/reservations.vue:208-216`
- `app/pages/reservations/index.vue:137`
- `app/pages/reservations/[id].vue:160`
