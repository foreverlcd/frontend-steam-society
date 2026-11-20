<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Steam Society: web (Next.js 16)

Interfaz web de Steam Society, una plataforma de mentorías para acercar a más mujeres a carreras STEAM (Perú primero, luego Latinoamérica). Este repo es SOLO el frontend; la API NestJS vive en `../backend-steam-society`.

Responde siempre en español. Código, identificadores y mensajes de commit van en inglés.

## Stack (cerrado; no propongas alternativas)

- TypeScript, Node 24 LTS, pnpm.
- Next.js 16.4 con App Router, React 19.3, Tailwind CSS 4.
- Vitest + Testing Library para tests; Prettier + ESLint para estilo.
- Fetch directo del navegador a la API con `credentials: "include"`. Sin BFF/proxy en v1.
- Componentes propios con Tailwind, organizados con atomic design pragmático: `ui` (átomos), `forms` (moléculas) y carpetas de dominio (organismos). No shadcn/ui, TanStack Query ni React Hook Form en esta etapa; la skill oficial de shadcn se usa como guía de composición y accesibilidad.
- `src/` y alias `@/*`. Server Components por defecto; `"use client"` solo cuando haga falta estado, efectos o APIs del navegador.

## Cómo levantar

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:3001
```

La API debe estar en `http://localhost:3000` y el backend ya permite `http://localhost:3001` por CORS. El valor por defecto de `NEXT_PUBLIC_API_URL` es `http://localhost:3000/v1`.

Verificación antes de cerrar una tarea (un solo comando, salida corta):

```bash
scripts/gate.sh   # límites de arquitectura, lint, format, tests, build y secretos
```

## Arnés de agentes

El arnés completo está en `../backend-steam-society/docs/HARNESS.md`: roles, delegación, planes (`docs/exec-plans/`), principios de oro y bitácora. Además:

- `pnpm lint` incluye `scripts/check-boundaries.mjs`: solo `src/lib/api/client.ts` hace `fetch`, `lib/` no importa UI, `components/ui` no conoce la API ni el dominio, y los componentes no importan rutas. El mensaje de error dice cómo corregir.
- **Ver la app:** con la API y la web levantadas, `DEMO_PASSWORD=... pnpm ui:shots scripts/ui-plans/smoke.json` guarda capturas, texto de cada pantalla y errores de consola en `.shots/<plan>/`. Para un cambio visual, crea un plan con las pantallas afectadas (escritorio 1280×800 y móvil 390×844) y revisa las capturas antes de darlo por terminado.
- El mapa visual del sistema está en `../backend-steam-society/docs/FLOWS.md`.

## Contrato con la API

- La base incluye `/v1`: `NEXT_PUBLIC_API_URL=http://localhost:3000/v1`.
- Sesión: cookie `sid` en desarrollo HTTP y `__Host-sid` en producción. Es `HttpOnly` y `SameSite=Lax`; el navegador la envía gracias a `credentials: "include"`.
- No intentes leer la cookie desde JavaScript ni desde `middleware`/`proxy`: es `HttpOnly`. El guard de sesión es client-side con `GET /v1/me`.
- Los errores de la API se normalizan en `ApiError` (`status`, `code`, `message`, `details`). Usa `code` para mensajes de negocio; `message` puede ser un array de validación.
- No inventes endpoints ni campos. Si falta un endpoint, anótalo y pregunta.

### Endpoints ya usados

- `POST /auth/register`: `{ email, password, role, birthDate, firstName?, lastName?, acceptTerms: true, guardianConsent? }`. No inicia sesión; el frontend hace login después. Menores de 14 sin `guardianConsent: true` → `400 GUARDIAN_CONSENT_REQUIRED`.
- `POST /auth/login`: inicia sesión y devuelve el usuario.
- `POST /auth/logout`: cierra la sesión.
- `POST /auth/password/forgot`: responde `202` siempre, exista o no el correo.
- `POST /auth/password/reset`: `{ token, password }`.
- `GET /me`: usuario de la sesión; `401 AUTH_REQUIRED` si no hay sesión.
- `GET /me/onboarding`: configuración de pasos, respuestas, completitud y opciones de áreas/idiomas.
- `PUT /me/onboarding`: `{ version, answers }`; acepta respuestas parciales y devuelve el estado actualizado.
- `GET|PUT /me/profile` y `POST /me/profile/submit`.
- `GET /mentors`: catálogo público; filtros `q`, `areaId`, `language`, `country`, `isFree`, `maxPriceMinor`, `currency`, `limit` y `cursor`.
- `GET /mentors/:id`: perfil público con ofertas activas; `404 MENTOR_NOT_FOUND` si no es pública.
- `GET /mentors/:id/slots?offeringId&from&to`: slots disponibles (público, máximo 90 días).
- `GET /me/recommendations?limit`: recomendaciones de mentorada (máximo 10, por defecto 3).
- `GET|POST /me/offerings`, `PATCH /me/offerings/:id`, `POST /me/offerings/:id/archive`.
- `GET|PUT /me/availability`: franjas semanales de la mentora.
- `POST /bookings`, `GET /bookings`, `GET /bookings/:id`.
- `POST /bookings/:id/accept|decline|cancel|complete|no-show`.
- `GET /me/mfa`, `POST /me/mfa/totp/setup` (`{ password }`: la contraseña otra vez, para que una sesión robada no pueda atar otra app), `POST /me/mfa/totp/confirm` (`{ code }`; avisa por correo), `POST /me/mfa/recovery-codes` y `POST /me/mfa/disable` (`{ password, code }`).
- `GET /admin/mentors`: bandeja paginada por cursor; filtros `status`, `limit` y `cursor`.
- `GET /admin/mentors/:id`: `{ mentor, onboarding }` con perfil, `minNoticeHours`, `maxAdvanceDays`, áreas, idiomas y onboarding completo.
- `POST /admin/mentors/:id/approve|reject|suspend|reactivate`: acciones de revisión; `reject` exige `{ reason }`.
- `GET /admin/overview`: números del piloto para el Resumen (cuentas por rol/estado, reservas de 30 días, reportes abiertos, correos).
- `GET /admin/users?q&role&status&limit&cursor`, `GET /admin/users/:id`: personas con conteos e historial.
- `POST /admin/users/:id/suspend` (`{ reason }`, 3..500) y `POST /admin/users/:id/reactivate`.
- `GET /admin/bookings?status&userId&from&to&limit&cursor` y `POST /admin/bookings/:id/cancel` (`{ reason }`, 3..500; avisa a ambas personas).
- `GET /admin/reports?status&limit&cursor`, `GET /admin/reports/:id` y `POST /admin/reports/:id/resolve` (`{ action: dismiss|warn|suspend, note }`).
- `GET /payments/config`: `{ enabled, provider }`; si `enabled` es `false` no se muestra el botón Pagar.
- `POST /payments/checkout`: `{ bookingId }` → `{ checkoutUrl, … }`; el navegador redirige a `checkoutUrl`.
- `POST /payments/webhooks/fake`: solo desarrollo (`PAYMENTS_PROVIDER=fake`); lo usa `/payments/fake-checkout`.

### Sitio público, legal y SEO/GEO

- Páginas públicas (Server Components, sin sesión): `/`, `/para-mentees`, `/para-mentoras`, `/help`, `/privacidad`, `/terminos` y `/cookies`. Los textos legales son borradores pendientes de revisión legal (DA-01/DA-04); su versión vive en `src/lib/site.ts` (`LEGAL_VERSION`) y debe coincidir con `LEGAL_TERMS_VERSION` de la API.
- `NEXT_PUBLIC_SITE_URL` (origen público, sin `/` final) alimenta canonical, `sitemap.xml`, `robots.txt`, `llms.txt`, JSON-LD y la tarjeta social `/og`. Las páginas a indexar se listan en `PUBLIC_ROUTES` (`src/lib/site.ts`).
- `robots.ts` permite los crawlers de IA en lo público y bloquea la zona privada; `(app)` y `(auth)` declaran `noindex` (salvo `/register`).
- La FAQ visible y su `FAQPage` salen de los mismos datos (`src/lib/marketing/faq.ts`). No escribas en ellas nada que la plataforma no haga hoy.
- La tarjeta social es la ruta `/og`, no `opengraph-image`: la convención se aplicaría también a rutas dinámicas privadas y rompe su prerender. Tampoco pongas `openGraph.url` relativo en el layout raíz por la misma razón.
- Solo existe la cookie de sesión de la API; el aviso de cookies es informativo y guarda su cierre en `localStorage`.

### Pantallas que consumen el contrato

- `/mentors` y `/mentors/[id]`: catálogo, detalle, slots y solicitud de reserva.
- `/dashboard`: onboarding, recomendaciones y accesos rápidos por rol.
- `/dashboard/offerings`, `/dashboard/availability`, `/dashboard/bookings` y `/dashboard/profile`: programación, reservas y perfil.
- `/admin`: Resumen con las colas que requieren atención.
- `/admin/reports`, `/admin/mentors`, `/admin/people` y `/admin/bookings`: moderación de reportes, revisión de mentoras, personas (suspender/reactivar) y reservas (cancelar).

Las reservas de pago quedan en `awaiting_payment` hasta que el módulo de pagos acredita el cobro. Con `PAYMENTS_PROVIDER=disabled` (piloto) no hay botón Pagar; con `fake` el pago se simula en `/payments/fake-checkout`. La reserva grupal aún no está disponible en el backend. `noShowParty` es la persona ausente; el enlace de sesión debe ser `https://`.

## Autenticación y autorización

- `AuthProvider` vive en el layout raíz y resuelve `GET /v1/me` al montar.
- `RequireAuth` protege el grupo `(app)`; `RequireGuest` protege `(auth)`.
- Los roles son `mentee`, `mentor` y `admin`. El registro público solo permite `mentee` y `mentor`; nunca `admin`.
- Redirección por rol: mentee/mentor → `/dashboard`; admin → `/admin`.
- La sesión puede expirar. Ante `401`, limpia el estado y manda a `/login`. No muestres datos privados antes de confirmar la sesión.
- En producción frontend y API deben ser same-site por `SameSite=Lax`. Si se separan, hace falta `SameSite=None; Secure` o un proxy same-origin; no lo cambies sin decisión del desarrollador.

## UI

- Español para todo el texto visible. Tono cercano, claro y profesional; nada de copy que prometa funciones que aún no existen.
- Mobile-first. Usa los tokens de `src/app/globals.css` (`brand`, `accent`, `canvas`, `ink`, `muted`, `line`) antes de inventar colores.
- Atomic design pragmático: los primitivos van en `components/ui`; las moléculas de formulario en `components/forms`; los organismos de cada dominio en `components/<dominio>`. No muevas componentes existentes solo por estética.
- Accesibilidad mínima obligatoria: labels asociados, foco visible, `aria-invalid`/`aria-describedby` en errores, botones con texto, contraste suficiente.
- Formularios: validación client-side simple + mensajes de error de la API. No dupliques reglas de negocio complejas; la API es la autoridad.
- No cargues datos privados en Server Components sin sesión; en v1 todo lo autenticado es client-side.

## Next.js 16.4: cosas que cambian

- `cacheComponents: true` y `partialPrefetching: true` vienen activados en este template. No los desactives sin medir el impacto.
- Las rutas de auth y la zona `(app)` declaran `export const instant = false` porque la sesión se resuelve en el cliente con `GET /v1/me`. No lo quites sin mover la sesión al servidor; si no, `next dev` avisa de que la navegación no puede validarse como instantánea.
- `useSearchParams()` debe ir dentro de un `<Suspense>`; por eso `/reset-password` lo hace.
- `next dev` y `next build` usan Turbopack. La configuración de Tailwind está en `next.config.ts`.
- `next-env.d.ts` y `.next/` no se versionan. `AGENTS.md` incluye un bloque que `next dev` reescribe; no lo borres.
- Antes de usar una API nueva de Next, lee la guía local en `node_modules/next/dist/docs/`.

## Git y alcance

- Una rama por slice (`feat/<tema>`). Commits pequeños en inglés con Conventional Commits.
- Política autónoma (decisión del desarrollador, 2026-11-16), igual que el backend: trabaja en `feat/*`; antes de fusionar crea `git tag backup/pre-merge-<rama>` (local), fusiona en `main` con `--no-ff` solo con build, lint, test y format verdes y publica con `git push origin <rama>`. Nunca force, nunca borrar ramas remotas, nunca tags remotos, nunca reescribir historia.
- No toques el backend desde este repo. Si un cambio requiere backend, documéntalo y pide decisión.
- Antes de instalar una dependencia, justifícala (necesidad real, mantenimiento, licencia, tamaño).
- No leas, imprimas ni edites `.env.local` ni secretos. Usa `.env.example`.
- Sin datos reales de usuarias en tests, capturas o seeds.

## Tests

- Tests de lógica y API client con Vitest; componentes con Testing Library + jsdom.
- No testees detalles de implementación de Next. Testea comportamiento propio: normalización de errores, redirecciones por rol, validaciones de formulario.
- `pnpm test` debe quedar verde. Si un test necesita red, no es un test unitario.

## Definición de terminado

`scripts/gate.sh` en verde; capturas revisadas si cambió la UI; tests para lo nuevo; README/AGENTS actualizados si cambia cómo se levanta o se usa el proyecto; sin TODOs silenciosos (lo pendiente va al README o al PROGRESS del backend si afecta el contrato).
