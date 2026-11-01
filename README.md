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

## Catálogo, reservas y perfil

- `/mentors` es público: búsqueda por texto, área, idioma, país, solo gratuitas y precio máximo; paginación por cursor y estados de carga, vacío y error.
- `/mentors/[id]` muestra el perfil público, las ofertas activas y los horarios disponibles. Una mentorada autenticada con perfil puede solicitar una reserva 1:1 y dejar un mensaje.
- El dashboard de mentorada incluye recomendaciones calculadas por `GET /v1/me/recommendations` y accesos a catálogo, reservas y perfil.
- `/dashboard/bookings` lista reservas por estado. La mentora acepta (con enlace de sesión si es gratuita), rechaza, completa o marca no asistencia; la mentorada cancela solicitudes y reservas.
- `/dashboard/offerings` y `/dashboard/availability` permiten a la mentora crear/editar/archivar ofertas y reemplazar sus franjas semanales.
- `/dashboard/profile` edita el perfil de mentora o mentorada, sus áreas e idiomas, y permite enviar el perfil de mentora a revisión.
- Las reservas de pago quedan en `awaiting_payment`: la pasarela de pagos sigue pendiente (Hito 2). Las ofertas grupales se muestran, pero la reserva grupal aún no está disponible.

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
    (app)/           # zona autenticada: dashboard, onboarding, admin y programación
    mentors/         # catálogo público y detalle de mentora
  components/
    ui/              # átomos: botones, campos, badges, progress, alerts
    forms/           # moléculas: renderer de preguntas del onboarding
    auth/            # organismos de auth: guards y formularios
    onboarding/      # organismos del wizard y estado de completitud
    catalog/         # catálogo público y detalle con reserva
    dashboard/       # dashboard, recomendaciones, ofertas, disponibilidad, reservas y perfil
    admin/           # vista cliente del panel admin
    layout/          # plantillas pública y autenticada
    brand/           # logo
  lib/
    api/             # fetch, errores y módulos por recurso
    admin/           # etiquetas y formato de respuestas para revisión
    auth/            # contexto de sesión y roles
    catalog/         # formato de nombres, precios, áreas e idiomas
    onboarding/      # validación pura, payloads y hook de carga
  test/              # setup de Vitest
```

La organización sigue atomic design de forma pragmática: `ui` son átomos, `forms` son moléculas, y `auth`/`onboarding`/`dashboard` son organismos. La skill oficial de shadcn se usa como guía de composición, estados y accesibilidad; el proyecto mantiene sus primitivos propios para no mezclar dos sistemas visuales.

## Contrato de API cubierto

### Con UI

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `GET /me`
- `GET /me/onboarding`
- `PUT /me/onboarding`
- `GET|PUT /me/profile`
- `POST /me/profile/submit`
- `GET /mentors` (`q`, `areaId`, `language`, `country`, `isFree`, `maxPriceMinor`, `currency`, `limit`, `cursor`)
- `GET /mentors/:id`
- `GET /mentors/:id/slots?offeringId&from&to`
- `GET /me/recommendations?limit`
- `GET|POST /me/offerings`, `PATCH /me/offerings/:id`, `POST /me/offerings/:id/archive`
- `GET|PUT /me/availability`
- `POST /bookings`, `GET /bookings`, `GET /bookings/:id`
- `POST /bookings/:id/accept|decline|cancel|complete|no-show`
- `GET /admin/mentors` (`status`, `limit`, `cursor`)
- `GET /admin/mentors/:id`
- `POST /admin/mentors/:id/approve|reject|suspend|reactivate`

Los errores se normalizan en `ApiError` con `status`, `code`, `message` y `details`. Los formularios muestran mensajes de negocio a partir de `code` y dejan que la API sea la autoridad de validación.

## Próximos pasos

1. Pasarela de pagos (Hito 2): hoy una reserva de pago aceptada queda en `awaiting_payment` sin forma de confirmarla.
2. Reserva grupal: el backend solo permite crear reservas 1:1; la UI ya distingue las ofertas grupales.
3. Revisión senior de reservas y matching, y evaluación humana de recomendaciones.
4. Prueba de contrato real frontend-API con datos demo (catálogo, slots, reserva, aceptación y perfil).
