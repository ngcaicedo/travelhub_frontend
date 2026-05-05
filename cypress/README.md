# Cypress E2E — TravelHub Frontend

Suite end-to-end del portal Web. Cubre el flujo completo viajero + hotelero contra el backend real (`travelhub_miso`), sin mocks de microservicios excepto OTP. Reporte HTML via Mochawesome.

## Cobertura

| Spec | HU | Jira | Tests | Descripcion |
|------|-----|------|-------|-------------|
| `0_TravelerRegistration.cy.ts` | — | — | 3 | Registro de viajero + validaciones |
| `1_HotelPartnerRegistration.cy.ts` | — | — | 2 | Registro de partner hotel |
| `2_LoginWithOTP.cy.ts` | — | — | 4 | Login con OTP, escenarios feliz y error |
| `3_MPF21_Checkout.cy.ts` | HU013 | MPF-21 | 2 | Pantalla de checkout (mocked, legacy) |
| `4_MPF15_PaymentConfirmation.cy.ts` | HU015 | MPF-15 | 2 | Confirmacion de pago (mocked, legacy) |
| `5_PropertySearch.cy.ts` | HU base | — | 3 | Busqueda de hospedaje con filtros |
| `6_MPF12_SortSearchResults.cy.ts` | HU009 | MPF-12 | 3 | Ordenamiento de resultados |
| `7_MPF19_PropertyDetail.cy.ts` | HU015 | MPF-19 | 2 | Detalle de propiedad |
| `8_MPF28_ReservationsList.cy.ts` | HU021 | MPF-28 | 2 | Listado de reservas (viajero) |
| `9_MPF29_ReservationConfirmation.cy.ts` | HU022 | MPF-29 | 3 | Reserva end-to-end + escenarios `success`/`insufficient`/`declined` |
| `10_MPF31_ReservationSelfManagement.cy.ts` | HU023 | MPF-31 | 2 | Modificar y cancelar reserva (viajero) |
| `11_MPF35_HotelDashboard.cy.ts` | HU026 | MPF-35 | 1 | Dashboard de reservas (hotel) con KPIs y trends |
| `12_MPF37_HotelReservationDetail.cy.ts` | HU028 | MPF-37 | 1 | Detalle de reserva (hotel) |
| `13_MPF36_HotelConfirmCancel.cy.ts` | HU027 | MPF-36 | 2 | Confirmar y cancelar reservas desde el detalle (hotel) |

**Total: 32 tests / 14 specs.** Cubre las 8 HUs E2E exigidas por la Estrategia v2.0 + flujos base de busqueda y registro.

## Ejecutar

### Pre-requisitos

1. Backend levantado con seed demo:
   ```bash
   cd ../travelhub_miso
   docker compose down -v                     # DB limpia (recomendado)
   DEMO_SEED_ENABLED=true docker compose up -d
   ```
2. Frontend en `http://localhost:3000`:
   ```bash
   pnpm dev          # dev mode con HMR
   # O alternativamente
   pnpm build && node .output/server/index.mjs
   ```

### Comandos

```bash
pnpm exec cypress open                                                  # modo interactivo
pnpm exec cypress run                                                   # toda la suite (~3 min)
pnpm exec cypress run --spec "cypress/e2e/scenarios/9_MPF29_*"          # spec individual
```

Reporte HTML: `cypress/reports/index.html` (Mochawesome con screenshots embebidos).

## Estructura

```
cypress/
├── e2e/scenarios/          Specs numerados (orden de implementacion)
├── pages/                  Page Objects, uno por pantalla
├── steps/                  Given/When/Then reutilizables (BDD)
├── support/                Helpers transversales
│   ├── auth.ts             loginAs / loginAsTraveler / loginAsHotelPartner / seedUser
│   ├── demoData.ts         IDs y credenciales del seed demo
│   ├── uniqueDates.ts      Slots de fechas no-overlapping para reservas
│   └── screenshots.ts      Helper para capturas Mochawesome ordenadas
└── fixtures/responses/     Stubs JSON (solo OTP)
```

### Page Objects

Cada pantalla expone selectores `data-cy` y acciones de alto nivel. Toman screenshot via `screenshot.take()` para que el reporte muestre el flujo paso a paso.

Notas relevantes:
- `HotelDashboardPage.applyDateRange()` intercepta `host/me/metrics` y `host/me/revenue-trends`, espera ambas y un margen de 300ms para que ECharts pinte la serie antes del screenshot.
- `HotelReservationDetailPage.visit()` espera el atributo `data-cy-reservation-id` del root y la visibilidad del `data-cy=hotel-detail-reservation-number`, no solo la existencia del root (que envuelve tambien el spinner de loading).

## Decisiones de diseno

### Backend real, mocks minimos

Todos los specs ejercen los microservicios reales (`users`, `security`, `properties`, `reservations`, `search`, `payments`). La unica excepcion es `verify-otp`: Cypress no puede leer el correo, asi que se intercepta con `cy.intercept` + `fixtures/responses/otpSuccess.json` para los travelers. Los hoteles demo (`DEMO_HOTEL_A`, `DEMO_HOTEL_B`) usan el OTP real `000000` aceptado por el backend cuando `DEMO_SEED_ENABLED=true`.

### Sesion del usuario

`loginAs(user)` cachea con `cy.session([email, role], …)` y valida via cookie `auth_token`. El JWT inyectado en travelers es un token sin firmar con `sub` real (obtenido via `seedUser` → `POST /api/v1/users`); la UI solo decodifica el payload, asi que el backend lo acepta para endpoints autenticados.

### Datos: seeding y aislamiento

- **Usuarios:** `seedUser(buildTraveler())` crea uno con email `${prefix}.${Date.now()}.${rand}@example.com` para garantizar unicidad por run.
- **Reservas:** se crean via UI completa (search → reservar → checkout → pagar) en `before()` hooks. Para los flujos del lado hotel que solo necesitan reservas en `pending_payment` (phase 13 confirm/cancel), el seeding se detiene en checkout sin pagar.
- **Fechas (`uniqueDates.ts`):** el backend de search tiene 36 slots no-overlapping en 2026 (12 meses x 3 ranges 10-12, 12-14, 14-16). El widget cablea `id_room = property.id`, asi que cada propiedad solo tiene esos 36 slots libres. El helper expone `uniqueDateRange(testIndex)` que mapea `testIndex % futureSlots.length` a un slot. **Los testIndex usados por la suite (0..2, 10, 11, 20, 21, 30, 40, 41) son todos distintos mod 24** (24 = slots futuros desde mayo 2026), por lo que dentro de un run no hay colision.

> **Importante:** el mapeo es deterministico. Si se corre la suite dos veces sobre la misma DB, los slots se repiten y el backend devuelve `400 RoomNotAvailable`. Reiniciar la DB con `docker compose down -v` antes de cada run completo.

### Reportes Mochawesome

`cypress/support/screenshots.ts` numera las capturas (`001_…`, `002_…`) y las guarda dentro del directorio del test. El plugin `cypress-mochawesome-reporter` las embebe en el HTML final.

## Patrones BDD

Specs siguen Given-When-Then encapsulado en `steps/{Given,When,Then}Steps.ts`. Ejemplo:

```ts
// Given: hotel B autenticado en el detalle de la reserva
loginAs(demoHotelB)
whenSteps.whenIVisitHotelReservationDetail(reservationToConfirm)
thenSteps.thenIAmOnHotelReservationDetail(reservationToConfirm)
thenSteps.thenTheHotelReservationStatusIs(/^pending_payment$/)

// When: confirma la reserva desde el detalle
whenSteps.whenHotelConfirmsReservationFromDetail()

// Then: el detalle refleja el nuevo estado
thenSteps.thenISeeHotelReservationActionSuccess()
thenSteps.thenTheHotelReservationStatusIs(/^confirmed$/)
```

Cuando se necesita un selector nuevo, agregar `data-cy="…"` en el componente Vue antes que selectores frágiles por clase/Tailwind.

## Endpoints stub vs real

| Endpoint | Estrategia | Por que |
|----------|------------|---------|
| `POST /api/v1/auth/verify-otp` | Stub (fixture) para travelers | Cypress no puede leer correo |
| `POST /api/v1/auth/verify-otp` | Real para hoteles demo | Backend acepta OTP `000000` con `DEMO_SEED_ENABLED=true` |
| Resto (`users`, `properties`, `search`, `reservations`, `payments`, `notifications`) | Real | Cobertura E2E genuina |
| `cy.intercept(...).as(...)` con `cy.wait` | Sin stub, solo alias para sincronizar UI con backend | No altera el response |

## Troubleshooting

- **`400 RoomNotAvailable` o "Valida los datos de tu reserva":** la DB tiene reservas previas en los slots usados por la suite. Resetear: `docker compose down -v && DEMO_SEED_ENABLED=true docker compose up -d`.
- **Test de `payment-confirmation` timeout:** `thenIAmOnPaymentConfirmationPage` usa `timeout: 20000` por las latencias de fake_stripe + notificaciones. Si falla aun asi, revisar logs de `payments` y `notifications-worker`.
- **Screenshot de detalle vacio:** asegurar que `HotelReservationDetailPage.visit()` espere el `data-cy-reservation-id` poblado, no solo la existencia del root.
- **Codigo Vue no aplica:** si se sirve via `node .output/server/index.mjs`, hay que `pnpm build` y reiniciar el proceso. En `pnpm dev` el HMR aplica los cambios al instante.
