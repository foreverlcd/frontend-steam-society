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
- Componentes propios con Tailwind. No shadcn/ui, TanStack Query ni React Hook Form en esta etapa.
- `src/` y alias `@/*`. Server Components por defecto; `"use client"` solo cuando haga falta estado, efectos o APIs del navegador.

## Cómo levantar

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:3001
```

La API debe estar en `http://localhost:3000` y el backend ya permite `http://localhost:3001` por CORS. El valor por defecto de `NEXT_PUBLIC_API_URL` es `http://localhost:3000/v1`.

Comandos de verificación antes de cerrar una tarea:

```bash
pnpm build
pnpm lint
pnpm test
pnpm format:check
```

## Contrato con la API

- La base incluye `/v1`: `NEXT_PUBLIC_API_URL=http://localhost:3000/v1`.
- Sesión: cookie `sid` en desarrollo HTTP y `__Host-sid` en producción. Es `HttpOnly` y `SameSite=Lax`; el navegador la envía gracias a `credentials: "include"`.
- No intentes leer la cookie desde JavaScript ni desde `middleware`/`proxy`: es `HttpOnly`. El guard de sesión es client-side con `GET /v1/me`.
- Los errores de la API se normalizan en `ApiError` (`status`, `code`, `message`, `details`). Usa `code` para mensajes de negocio; `message` puede ser un array de validación.
- No inventes endpoints ni campos. Si falta un endpoint (por ejemplo, el detalle admin de una mentora), anótalo y pregunta.

### Endpoints ya usados

- `POST /auth/register`: `{ email, password, role, birthDate, firstName?, lastName? }`. No inicia sesión; el frontend hace login después.
- `POST /auth/login`: inicia sesión y devuelve el usuario.
- `POST /auth/logout`: cierra la sesión.
- `POST /auth/password/forgot`: responde `202` siempre, exista o no el correo.
- `POST /auth/password/reset`: `{ token, password }`.
- `GET /me`: usuario de la sesión; `401 AUTH_REQUIRED` si no hay sesión.

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
- NUNCA commitees en `main`, NUNCA hagas `git push`, NUNCA reescribas historia. El desarrollador revisa `git diff main...HEAD` y hace el merge.
- No toques el backend desde este repo. Si un cambio requiere backend, documéntalo y pide decisión.
- Antes de instalar una dependencia, justifícala (necesidad real, mantenimiento, licencia, tamaño).
- No leas, imprimas ni edites `.env.local` ni secretos. Usa `.env.example`.
- Sin datos reales de usuarias en tests, capturas o seeds.

## Tests

- Tests de lógica y API client con Vitest; componentes con Testing Library + jsdom.
- No testees detalles de implementación de Next. Testea comportamiento propio: normalización de errores, redirecciones por rol, validaciones de formulario.
- `pnpm test` debe quedar verde. Si un test necesita red, no es un test unitario.

## Definición de terminado

`pnpm build`, `pnpm lint`, `pnpm test` y `pnpm format:check` en verde; tests para lo nuevo; README/AGENTS actualizados si cambia cómo se levanta o se usa el proyecto; sin TODOs silenciosos (lo pendiente va al README o al PROGRESS del backend si afecta el contrato).
