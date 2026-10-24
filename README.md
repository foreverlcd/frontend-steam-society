# Steam Society · Web

Interfaz web de Steam Society, la plataforma de mentorías que acerca a más mujeres a carreras STEAM. Este repositorio contiene solo el frontend; la API vive en `../backend-steam-society`.

## Stack

- Next.js 16.4 (App Router, Turbopack, Cache Components)
- React 19.3
- TypeScript
- Tailwind CSS 4
- Vitest + Testing Library
- pnpm

## Requisitos

- Node.js 24 LTS
- pnpm
- La API NestJS corriendo en `http://localhost:3000`

## Puesta en marcha

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

La web queda en [http://localhost:3001](http://localhost:3001). El backend ya permite ese origen por CORS.

### Variables de entorno

| Variable              | Ejemplo                    | Descripción                                      |
| --------------------- | -------------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/v1` | URL base de la API, incluyendo el prefijo `/v1`. |

`NEXT_PUBLIC_*` se incrusta en el bundle del navegador: nunca pongas secretos ahí. En producción, frontend y API deben ser same-site por la cookie `SameSite=Lax`; si no, hace falta `SameSite=None; Secure` o un proxy same-origin.

## Scripts

```bash
pnpm dev           # desarrollo en http://localhost:3001
pnpm build         # build de producción
pnpm start         # servir el build en http://localhost:3001
pnpm lint          # ESLint
pnpm test          # Vitest
pnpm test:watch    # Vitest en watch
pnpm format        # Prettier
pnpm format:check  # comprobar formato
```

## Autenticación

La sesión es una cookie `HttpOnly` emitida por la API (`sid` en desarrollo HTTP, `__Host-sid` en producción). El navegador la envía con `credentials: "include"`; JavaScript no puede leerla.

- `AuthProvider` resuelve `GET /v1/me` al cargar la app.
- `RequireAuth` protege el grupo `(app)`.
- `RequireGuest` protege el grupo `(auth)` y redirige a la persona autenticada.
- Redirección por rol: `mentee`/`mentor` → `/dashboard`; `admin` → `/admin`.
- El registro público solo permite `mentee` y `mentor`. Después de registrar, el frontend inicia sesión automáticamente.

No hay BFF en v1: el navegador llama directamente a la API. Por eso la cookie debe funcionar same-site en producción.

## Estructura

```text
src/
  app/
    (auth)/          # login, registro, recuperación y reset
    (app)/           # zona autenticada: dashboard y admin
  components/
    auth/            # guards y formularios de auth
    brand/           # logo
    dashboard/       # vista cliente del dashboard
    admin/           # vista cliente del panel admin
    layout/          # cabecera de la app
    ui/              # botones, campos, alerts, spinner
  lib/
    api/             # fetch, errores y módulos por recurso
    auth/            # contexto de sesión y roles
  test/              # setup de Vitest
```

## Contrato de API usado

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `GET /me`

Los errores se normalizan en `ApiError` con `status`, `code`, `message` y `details`. Los formularios muestran mensajes de negocio a partir de `code` y dejan que la API sea la autoridad de validación.

## Próximos pasos

1. Wizard de onboarding config-driven (`GET|PUT /v1/me/onboarding`).
2. Perfil editable (`GET|PUT /v1/me/profile`, `POST /v1/me/profile/submit`).
3. Vista admin de mentoras (`GET /v1/admin/mentors`, aprobar/rechazar/suspender/reactivar).
4. Antes de la vista admin, añadir en backend `GET /v1/admin/mentors/:id` con onboarding completo.
