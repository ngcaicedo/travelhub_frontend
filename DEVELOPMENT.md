# 🚀 Guía de Desarrollo - TravelHub Frontend

## Acceso Rápido a Pantallas de Demostración

Este documento te ayuda a visualizar las pantallas en modo desarrollo sin necesidad de estar autenticado.

### 📱 URLs para Testing

#### 1. Página de Detalle de Propiedad (con Reserva)
```
http://localhost:3000/properties/22222222-2222-2222-2222-222222222222
```

**Características:**
- ✅ Galería de fotos interactiva
- ✅ Información de propiedad (4 habitaciones, 4.5 baños, 12 huéspedes)
- ✅ Descripción expandible
- ✅ Lista de amenidades (8 items)
- ✅ Reseñas con calificación
- ✅ Mapa de ubicación
- ✅ **Widget de reserva funcional** (formulario con validaciones)

**Datos Mock:**
```json
{
  "name": "Renaissance Estate & Private Vineyard",
  "location": "Fiesole, Florence",
  "price_per_night": 1240,
  "currency": "COP",
  "rating": 4.98,
  "bedrooms": 4,
  "bathrooms": 4.5,
  "max_guests": 12
}
```

#### 2. Página de Confirmación de Reserva
```
http://localhost:3000/reservations/cualquier-id-aqui
```

**Características:**
- ✅ Resumen de reserva
- ✅ Status de reserva (Pending Payment)
- ✅ Fechas de check-in/out
- ✅ Total a pagar
- ✅ Botón para imprimir confirmación

**Datos Mock:**
- Status: `pending_payment`
- Total: `3720 COP`
- Check-in: `+7 días desde hoy`
- Check-out: `+10 días desde hoy`

---

## 🔧 Cómo Modificar URLs para Testing

### Opción 1: Editar `app/pages/index.vue`
```typescript
// Descomentar esta línea para ir directamente a property detail:
navigateTo('/properties/22222222-2222-2222-2222-222222222222')

// O comentar navigateTo('/login') y usar la URL manual
```

### Opción 2: Acceso Directo por URL
Simplemente navega manualmente a las URLs en tu navegador.

### Opción 3: Crear Script de Testing
```bash
# En el navegador console:
window.location.href = '/properties/22222222-2222-2222-2222-222222222222'
```

---

## 🔄 Datos Mock vs API Real

### Actualmente (MVP):
- ✅ **Propiedades**: Mock data en `useProperty.ts`
- ✅ **Reservas**: Mock data en `pages/reservations/[id].vue`
- ✅ **Crear Reserva**: Llamada real a API (endpoint `POST /api/v1/reservations`)

### TODOs - Reemplazar con API Real:
```typescript
// En: app/features/properties/composables/useProperty.ts (línea ~58)
// TODO: Reemplazar con llamado GET real cuando backend esté disponible:
// const response = await $fetch<Property>(
//   `/api/v1/properties/${propertyId}`,
//   { baseURL: usersApiUrl }
// )

// En: app/pages/reservations/[id].vue (línea ~37)
// TODO: Reemplazar con llamado GET real cuando backend esté disponible:
// reservation.value = await getReservation(reservationId)
```

---

## 🛠️ Stack Técnico

- **Framework**: Nuxt 4
- **UI**: @nuxt/ui + Tailwind CSS
- **Validaciones**: Funciones en `shared/utils/validation.ts`
- **i18n**: Soporte multiidioma (ES, EN, PT)
- **HTTP Client**: `$fetch` con Nuxt

---

## 📝 Variables de Entorno

```env
# .env (crear si no existe)
USERS_API_URL=http://localhost:8000
SECURITY_API_URL=http://localhost:8001
RESERVATIONS_API_URL=http://localhost:8002
```

---

## ✅ Hacer Testing de Reserva

1. **Ir a la página de propiedad:**
   ```
   http://localhost:3000/properties/22222222-2222-2222-2222-222222222222
   ```

2. **Completar formulario:**
   - Selecciona Check-in (ej: 10 de abril)
   - Selecciona Check-out (ej: 13 de abril)
   - Huéspedes: ingresa un número entre 1 y 12

3. **Validaciones que se ejecutarán:**
   - ✅ Check-out > Check-in
   - ✅ No fechas pasadas
   - ✅ Huéspedes ≤ max_guests
   - ✅ Cálculo automático de total

4. **Al hacer click en "Confirmar reserva":**
   - Se hace POST a la API real
   - Se navega a página de confirmación con el ID retornado
   - Se muestra resumen de reserva

---

## 🐛 Troubleshooting

### "No puedo ver la propiedad"
→ Verifica que accedas a `/properties/22222222-2222-2222-2222-222222222222`

### "El formulario de reserva no funciona"
→ Asegúrate de que el servicio `reservations` en backend está corriendo en `http://localhost:8002`

### "Las fechas no se validan"
→ El navegador debe permitir el input de tipo `date`. Prueba con Chrome/Edge modernos.

---

## 📚 Archivos Principales

```
app/
├── features/
│   ├── properties/
│   │   ├── components/       ← Componentes de UI
│   │   └── composables/
│   │       └── useProperty.ts ← TODO: Agregar GET real
│   └── reservations/
│       └── composables/
│           └── useReservations.ts ← Llamadas API
├── shared/
│   ├── types/api.ts          ← Definiciones de tipos
│   ├── composables/useApi.ts ← Cliente HTTP
│   └── utils/validation.ts   ← Funciones de validación
└── pages/
    ├── properties/[id].vue   ← Detalle de propiedad
    └── reservations/[id].vue ← Confirmación de reserva (TODO: GET real)
```

---

**Última actualización:** 2 de abril de 2026
