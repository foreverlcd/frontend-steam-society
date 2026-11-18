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
  "Cómo encontrar una mentora STEAM en Steam Society, reservar una sesión 1 a 1 por videollamada y aprovecharla al máximo.";

export const metadata: Metadata = {
  title: "Para mentees: encuentra tu mentora STEAM",
  description: DESCRIPTION,
  alternates: { canonical: "/para-mentees" },
};

const STAGES = [
  {
    tag: "Colegio",
    title: "Escolares",
    body: "Exploras opciones y quieres saber cómo es trabajar en ciencia, tecnología o arte.",
  },
  {
    tag: "Postulación",
    title: "Preuniversitarias",
    body: "Estás decidiendo qué estudiar o preparándote para postular.",
  },
  {
    tag: "Universidad",
    title: "Universitarias",
    body: "Buscas prácticas, una especialización o claridad sobre tu siguiente paso.",
  },
  {
    tag: "Trabajo",
    title: "Profesionales",
    body: "Quieres cambiar de área hacia STEAM o crecer en tu carrera.",
  },
];

const GOALS = [
  "Decidir qué carrera STEAM estudiar",
  "Pasar de otra área a tecnología",
  "Preparar una entrevista técnica",
  "Encontrar becas, prácticas y oportunidades",
  "Armar una ruta de aprendizaje",
  "Ganar confianza para dar el siguiente paso",
];

const STEPS = [
  {
    title: "Crea tu cuenta y cuéntanos de ti",
    body: "Respondes unas preguntas sobre tus intereses, áreas e idiomas. Toma pocos minutos y puedes cambiarlo después.",
  },
  {
    title: "Elige mentora y horario",
    body: "Ves tus recomendadas con el porqué de cada una, o exploras el catálogo. Eliges un horario libre y envías tu solicitud.",
  },
  {
    title: "Conversa por videollamada",
    body: "Cuando la mentora acepta, te avisamos por correo. El día de la sesión entras a la llamada desde tus reservas.",
  },
];

const PREPARE = [
  "Escribe en una línea qué quieres resolver en la sesión.",
  "Lleva dos o tres preguntas concretas.",
  "Prueba tu cámara y micrófono unos minutos antes.",
  "Busca un lugar tranquilo y con buena conexión.",
  "Al final, anota tu siguiente paso.",
  "Si no puedes asistir, cancela con tiempo desde tus reservas.",
];

const FAQ: FaqItem[] = [
  {
    question: "¿Cuánto cuesta una sesión?",
    answer:
      "Crear tu cuenta es gratis. Cada mentora indica en su perfil si su sesión es gratuita o tiene un precio, y lo ves antes de reservar.",
  },
  {
    question: "¿Qué pasa si la mentora no responde?",
    answer:
      "Si no acepta ni rechaza tu solicitud en 48 horas, la solicitud vence y puedes elegir otro horario u otra mentora.",
  },
  {
    question: "¿Necesito instalar algo para la videollamada?",
    answer:
      "No. La llamada funciona en el navegador, en computadora o celular. Solo tienes que permitir el uso de cámara y micrófono.",
  },
  {
    question: "Tengo menos de 14 años, ¿puedo registrarme?",
    answer:
      "Sí, con la autorización de tu madre, padre o tutor, que te pedimos al registrarte. Te recomendamos que una persona adulta de confianza sepa cuándo tienes una sesión.",
  },
];

export default function ParaMenteesPage() {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "HowTo",
              name: "Cómo reservar una mentoría STEAM en Steam Society",
              description: DESCRIPTION,
              step: STEPS.map((step, index) => ({
                "@type": "HowToStep",
                position: index + 1,
                name: step.title,
                text: step.body,
              })),
            },
            faqPageSchema(FAQ),
            breadcrumbSchema("Para mentees", "/para-mentees"),
          ],
        }}
      />
      <PublicHeader />
      <main id="contenido">
        <PageHero
          eyebrow="Para mentees"
          title="Tu camino en STEAM, con alguien que ya lo recorrió."
          lead="Conversa 1 a 1 con mentoras de ciencia, tecnología, ingeniería, arte y matemáticas. Decide con información, no con miedo."
          primary={{ href: "/register", label: "Encuentra tu mentora" }}
          secondary={{ href: "/mentors", label: "Ver mentoras" }}
        />

        <Section tone="soft" labelledBy="etapas">
          <SectionHeading
            id="etapas"
            eyebrow="¿Eres tú?"
            title="Para cualquier etapa del camino."
          />
          <div className="mt-10">
            <CardGrid items={STAGES} />
          </div>
        </Section>

        <Section labelledBy="objetivos">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <SectionHeading
              id="objetivos"
              eyebrow="Qué puedes lograr"
              title="Objetivos concretos, no consejos genéricos."
              lead="Cuéntale a tu mentora qué necesitas. Estas son algunas de las cosas que puedes trabajar en una sesión."
            />
            <CheckList items={GOALS} />
          </div>
        </Section>

        <Section tone="soft" labelledBy="pasos">
          <SectionHeading
            id="pasos"
            eyebrow="Cómo funciona"
            title="Tres pasos."
          />
          <div className="mt-10">
            <NumberedSteps steps={STEPS} />
          </div>
        </Section>

        <Section labelledBy="preparar">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <SectionHeading
              id="preparar"
              eyebrow="Antes de tu sesión"
              title="Cómo aprovecharla al máximo."
            />
            <CheckList items={PREPARE} />
          </div>
        </Section>

        <Section tone="soft" labelledBy="faq-mentees">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeading
              id="faq-mentees"
              eyebrow="Preguntas"
              title="Dudas frecuentes de mentees."
            />
            <FaqList items={FAQ} />
          </div>
        </Section>

        <div className="pt-20">
          <CtaBand
            title="¿Lista para dar el primer paso?"
            lead="Registrarte es gratis. Explora mentoras y reserva cuando estés lista."
            primary={{ href: "/register", label: "Crear mi cuenta" }}
            secondary={{ href: "/mentors", label: "Ver mentoras" }}
          />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
