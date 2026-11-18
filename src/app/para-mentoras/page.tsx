import type { Metadata } from "next";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqList } from "@/components/marketing/faq-list";
import {
  CardGrid,
  CheckList,
  NumberedSteps,
  PageHero,
} from "@/components/marketing/page-hero";
import { Section, SectionHeading } from "@/components/marketing/section";
import { JsonLd } from "@/components/seo/json-ld";
import type { FaqItem } from "@/lib/marketing/faq";
import { breadcrumbSchema, faqPageSchema } from "@/lib/seo";

const DESCRIPTION =
  "Sé mentora en Steam Society: comparte tu experiencia en ciencia, tecnología, ingeniería, arte o matemáticas con mujeres y niñas de Perú y Latinoamérica.";

export const metadata: Metadata = {
  title: "Para mentoras: comparte tu experiencia STEAM",
  description: DESCRIPTION,
  alternates: { canonical: "/para-mentoras" },
};

const BENEFITS = [
  {
    title: "Impacto real",
    body: "Una conversación tuya puede definir qué estudia o dónde postula otra mujer.",
  },
  {
    title: "Tus reglas",
    body: "Tú decides tus horarios semanales, la duración de cada sesión y con cuánta anticipación te pueden reservar.",
  },
  {
    title: "Gratis o de pago",
    body: "Cada oferta puede ser gratuita o tener precio. Los pagos en línea se están habilitando.",
  },
  {
    title: "Sin logística",
    body: "Agenda, avisos por correo y videollamada están en la plataforma. Tú solo te concentras en la conversación.",
  },
];

const STEPS = [
  {
    title: "Crea tu cuenta y tu perfil",
    body: "Regístrate como mentora y cuéntanos tu experiencia, áreas, idiomas y en qué puedes ayudar.",
  },
  {
    title: "Revisamos tu perfil",
    body: "El equipo revisa cada perfil antes de publicarlo. Si falta algo, te lo decimos.",
  },
  {
    title: "Publica y conversa",
    body: "Crea tus ofertas y horarios. Aceptas o rechazas cada solicitud y das la sesión por videollamada.",
  },
];

const LOOKING_FOR = [
  "Experiencia en un área STEAM, por trabajo o estudios avanzados",
  "Ganas de escuchar y orientar con empatía",
  "Respeto por las reglas de la comunidad",
  "Algunas horas al mes, cuando tú puedas",
  "Conexión a internet estable para videollamadas",
  "Disposición para acompañar también a menores de edad, con cuidado",
];

const FAQ: FaqItem[] = [
  {
    question: "¿Cuánto tiempo tengo que dedicar?",
    answer:
      "Lo que tú definas. Publicas tus horarios semanales y solo te pueden reservar en esos espacios. Puedes cambiarlos cuando quieras.",
  },
  {
    question: "¿Tengo que aceptar todas las solicitudes?",
    answer:
      "No. Cada solicitud la aceptas o la rechazas tú. Si no respondes en 48 horas, vence sola.",
  },
  {
    question: "¿Cómo cobro mis sesiones?",
    answer:
      "Puedes publicar ofertas gratuitas o con precio. El cobro en línea se está habilitando; mientras tanto te recomendamos empezar con sesiones gratuitas.",
  },
  {
    question: "¿Qué pasa si alguien no respeta las reglas?",
    answer:
      "Puedes bloquear a la persona, lo que cancela sus reservas abiertas contigo, y reportarla. El equipo revisa cada reporte y puede suspender la cuenta.",
  },
];

export default function ParaMentorasPage() {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            faqPageSchema(FAQ),
            breadcrumbSchema("Para mentoras", "/para-mentoras"),
          ],
        }}
      />
      <PublicHeader />
      <main id="contenido">
        <PageHero
          eyebrow="Para mentoras"
          title="Comparte tu experiencia y abre camino a otras mujeres."
          lead="Únete a una comunidad de profesionales STEAM que están cerrando la brecha de género, una conversación a la vez."
          primary={{ href: "/register", label: "Quiero ser mentora" }}
          secondary={{ href: "/mentors", label: "Ver mentoras actuales" }}
        />

        <Section tone="soft" labelledBy="beneficios">
          <SectionHeading
            id="beneficios"
            eyebrow="Por qué ser mentora"
            title="Tu experiencia vale más de lo que crees."
          />
          <div className="mt-10">
            <CardGrid items={BENEFITS} />
          </div>
        </Section>

        <Section labelledBy="pasos-mentoras">
          <SectionHeading
            id="pasos-mentoras"
            eyebrow="Cómo funciona"
            title="De tu perfil a tu primera sesión."
          />
          <div className="mt-10">
            <NumberedSteps steps={STEPS} />
          </div>
        </Section>

        <Section tone="soft" labelledBy="buscamos">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <SectionHeading
              id="buscamos"
              eyebrow="Lo que buscamos"
              title="No necesitas ser experta en todo."
              lead="Necesitas haber recorrido parte del camino y querer compartirlo."
            />
            <CheckList items={LOOKING_FOR} />
          </div>
        </Section>

        <Section labelledBy="faq-mentoras">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeading
              id="faq-mentoras"
              eyebrow="Preguntas"
              title="Dudas frecuentes de mentoras."
            />
            <FaqList items={FAQ} />
          </div>
        </Section>

        <CtaBand
          title="¿Te sumas como mentora?"
          lead="Crea tu cuenta, completa tu perfil y el equipo lo revisará."
          primary={{ href: "/register", label: "Postular como mentora" }}
          secondary={{ href: "/help", label: "Reglas de la comunidad" }}
        />
      </main>
      <PublicFooter />
    </div>
  );
}
