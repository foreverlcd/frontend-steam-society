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

## Onboarding

El wizard se arma con la configuración que devuelve `GET /v1/me/onboarding`: pasos, preguntas, opciones, áreas e idiomas. El frontend no hardcodea preguntas ni opciones.

- Cada paso se guarda con `PUT /v1/me/onboarding` al continuar. La API acepta respuestas parciales y devuelve el estado actualizado.
- La completitud sale de `completion.missing`; no se recalcula con reglas duplicadas.
- Las áreas se eligen en dos niveles: un área principal raíz y subáreas hijas. El idioma se guarda como un array de exactamente un código.
- La API no permite borrar una respuesta ya guardada (los campos son `optional` pero no `nullable`). El wizard evita enviar valores vacíos y solo permite cambiar un área principal junto con sus nuevas subáreas.
- El dashboard muestra el progreso y el CTA para continuar o revisar el onboarding.

## Panel admin

`/admin` está protegido por rol `admin` y consume la bandeja de mentoras:

- La lista se filtra por estado (`draft`, `pending_review`, `approved`, `rejected`, `suspended` o todas) y pagina con cursor.
- El detalle muestra perfil, áreas, idiomas, antelación mínima, ventana máxima y todas las respuestas del onboarding con su completitud.
- Las acciones disponibles dependen del estado: aprobar o rechazar en `pending_review`, suspender en `approved` y reactivar en `suspended`. El rechazo exige un motivo.
- Un `401` refresca la sesión; un `403` o un error de estado se muestra con el mensaje de negocio de la API.

## Estructura

```text
src/
  app/
    (auth)/          # login, registro, recuperación y reset
    (app)/           # zona autenticada: dashboard, onboarding y admin
  components/
    ui/              # átomos: botones, campos, badges, progress, alerts
    forms/           # moléculas: renderer de preguntas del onboarding
    auth/            # organismos de auth: guards y formularios
    onboarding/      # organismos del wizard y estado de completitud
    dashboard/       # vista cliente del dashboard
    admin/           # vista cliente del panel admin
    layout/          # plantilla de la app autenticada
    brand/           # logo
  lib/
    api/             # fetch, errores y módulos por recurso
    admin/           # etiquetas y formato de respuestas para revisión
    auth/            # contexto de sesión y roles
    onboarding/      # validación pura, payloads y hook de carga
  test/              # setup de Vitest
```

La organización sigue atomic design de forma pragmática: `ui` son átomos, `forms` son moléculas, y `auth`/`onboarding`/`dashboard` son organismos. La skill oficial de shadcn se usa como guía de composición, estados y accesibilidad; el proyecto mantiene sus primitivos propios para no mezclar dos sistemas visuales.

## Contrato de API usado

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `GET /me`
- `GET /me/onboarding`
- `PUT /me/onboarding`
- `GET /admin/mentors` (`status`, `limit`, `cursor`)
- `GET /admin/mentors/:id`
- `POST /admin/mentors/:id/approve|reject|suspend|reactivate`

Los errores se normalizan en `ApiError` con `status`, `code`, `message` y `details`. Los formularios muestran mensajes de negocio a partir de `code` y dejan que la API sea la autoridad de validación.

## Próximos pasos

1. Perfil editable (`GET|PUT /v1/me/profile`, `POST /v1/me/profile/submit`).
2. UI de ofertas, disponibilidad y slots sobre el cliente de 1.4.
3. Reservas y sesiones (1.5); depende de decisiones pendientes del backend.
