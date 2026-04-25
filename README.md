# TravelHub Frontend

Frontend de la plataforma de reservas hoteleras **TravelHub**, una empresa de tecnología de viajes con presencia en 6 países de Latinoamérica (Colombia, Perú, Ecuador, México, Chile y Argentina).

## Stack tecnológico

- **Framework:** Nuxt 4 (Vue 3, Composition API, TypeScript)
- **UI:** Nuxt UI + Tailwind CSS v4
- **Iconos:** Lucide (via `@iconify-json/lucide`)
- **Tipografía:** Plus Jakarta Sans (variable)
- **Internacionalización:** `@nuxtjs/i18n` — español (por defecto), inglés, portugués
- **Testing:** Vitest + `@nuxt/test-utils` + `@vue/test-utils` + Happy DOM
- **Linting:** ESLint con `@nuxt/eslint`
- **Package manager:** pnpm

## Estructura del proyecto

```
app/
├── assets/css/main.css        # Tokens de diseño (colores, tipografía)
├── components/
│   └── AppLogo.vue            # Logo de TravelHub (icono + texto)
├── layouts/
│   ├── default.vue            # Layout general con header
│   └── auth.vue               # Layout para login/registro (sin navegación, con selector de idioma)
├── pages/
│   ├── index.vue              # Redirige a /properties
│   └── login.vue              # Página de login (MPF-1)
├── app.vue                    # Root component
└── app.config.ts              # Tema de componentes Nuxt UI
i18n/
└── locales/
    ├── es.json                # Traducciones en español
    ├── en.json                # Traducciones en inglés
    └── pt.json                # Traducciones en portugués
tests/
├── components/                # Tests de componentes
├── layouts/                   # Tests de layouts
└── pages/                     # Tests de páginas
```

## Tokens de diseño

Los colores fueron  configurados como paletas en `main.css`:


| Paleta                | Color base | Uso                    |
| --------------------- | ---------- | ---------------------- |
| `travelhub` (primary) | `#135bec`  | Botones, links, CTAs   |
| `success`             | `#00c16a`  | Estados positivos      |
| `warning`             | `#efb100`  | Alertas, pendientes    |
| `error`               | `#fb2c36`  | Errores, destructivos  |
| `slate` (neutral)     | built-in   | Textos, bordes, fondos |


## Setup

```bash
pnpm install
```

## Comandos

```bash
# Servidor de desarrollo en http://localhost:3000
pnpm dev

# Build de producción
pnpm build

# Preview del build de producción
pnpm preview

# Ejecutar tests
pnpm test

# Tests en modo watch
pnpm test:watch

# Lint
pnpm lint

# Escaneo de seguridad del modulo de pagos
pnpm run security:scan

# Type checking
pnpm typecheck
```

## Modo de cumplimiento para pagos

El checkout soporta un modo de cumplimiento pensado para HU-ARQ-05:

- `NUXT_PUBLIC_PAYMENTS_COMPLIANCE_MODE=true`
- oculta completamente el formulario manual de tarjeta
- deja visible solo el flujo de Stripe Elements
- muestra una alerta si el backend no expone `stripe_test` como proveedor activo

Variables relevantes en `.env`:

```bash
NUXT_PUBLIC_USERS_API_BASE=
NUXT_PUBLIC_SECURITY_API_BASE=
NUXT_PUBLIC_PROPERTIES_API_BASE=
NUXT_PUBLIC_RESERVATIONS_API_BASE=
NUXT_PUBLIC_SEARCH_API_BASE=
NUXT_PUBLIC_PAYMENTS_API_BASE=
NUXT_PUBLIC_PAYMENTS_COMPLIANCE_MODE=false
```

## Evidencia de seguridad

- `pnpm run security:scan` revisa `app/` y `nuxt.config.ts` para detectar:
  - PAN hardcodeado
  - logs inseguros con referencias de tarjeta o token
  - patrones que contradigan el flujo token-only
- El workflow [`ci.yml`](.github/workflows/ci.yml) ejecuta `lint`, `security:scan`, `typecheck` y `test` en cada push.

