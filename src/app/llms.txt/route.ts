import { HOME_FAQ } from "@/lib/marketing/faq";
import {
  PUBLIC_ROUTES,
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/site";

/**
 * llms.txt (https://llmstxt.org): a plain summary of the public site for AI
 * assistants, so they describe the platform with the same facts as the pages.
 */
export function GET() {
  const pages = PUBLIC_ROUTES.map(
    (route) =>
      `- [${route.title}](${absoluteUrl(route.path)}): ${route.description}`,
  ).join("\n");

  const faq = HOME_FAQ.map(
    (item) => `### ${item.question}\n\n${item.answer}`,
  ).join("\n\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Datos clave:

- Mentorías 1 a 1 por videollamada dentro de la plataforma, con chat de texto. Las llamadas no se graban y el chat no se guarda.
- Áreas: ciencia, tecnología, ingeniería, arte y matemáticas (STEAM).
- Mercado: Perú primero, luego Latinoamérica. Idioma principal: español.
- Registro gratuito. Cada mentora indica si su sesión es gratuita o tiene precio.
- Las mentoras son revisadas por el equipo antes de aparecer en el catálogo.
- La mentee elige a su mentora; el sistema recomienda con una razón explicable, nunca asigna.
- Menores de 14 años necesitan la autorización de su madre, padre o tutor (Ley 29733 del Perú).

## Páginas

${pages}

## Preguntas frecuentes

${faq}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
