import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqList } from "@/components/marketing/faq-list";
import { Section, SectionHeading } from "@/components/marketing/section";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonClassName } from "@/components/ui/button";
import { HOME_FAQ } from "@/lib/marketing/faq";
import { faqPageSchema } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";
import { SUPPORT_EMAIL } from "@/lib/support";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    title: "Cuéntanos qué te interesa",
    body: "Crea tu cuenta gratis y responde unas preguntas sobre tus áreas, idiomas y lo que quieres lograr.",
  },
  {
    title: "Elige a tu mentora",
    body: "Te recomendamos mentoras y te decimos por qué encajan contigo. También puedes explorar el catálogo completo.",
  },
  {
    title: "Solicita un horario",
    body: "Escoge un horario libre. La mentora acepta tu solicitud y te avisamos por correo.",
  },
  {
    title: "Conversa 1 a 1",
    body: "La sesión es una videollamada dentro de Steam Society, con chat. No se graba.",
  },
];

const REASONS = [
  {
    kicker: "Referentes",
    title: "Es difícil ser lo que no ves",
    body: "Las mujeres son solo el 35 % de quienes estudian carreras STEM en la educación superior en el mundo.",
    source: {
      label: "UNESCO, 2017",
      href: "https://unesdoc.unesco.org/ark:/48223/pf0000253479",
    },
  },
  {
    kicker: "Decisiones",
    title: "Elegir sin guía da miedo",
    body: "Qué estudiar, cómo cambiar de área, dónde buscar becas o prácticas. Una conversación a tiempo ahorra años de dudas.",
  },
  {
    kicker: "Comunidad",
    title: "Nadie avanza sola",
    body: "Una red de mujeres que ya recorrieron el camino y quieren abrirlo para las que vienen.",
  },
];

const AREAS = [
  { letter: "S", name: "Ciencia" },
  { letter: "T", name: "Tecnología" },
  { letter: "E", name: "Ingeniería" },
  { letter: "A", name: "Arte" },
  { letter: "M", name: "Matemáticas" },
];

const SAFETY = [
  "Revisamos cada perfil de mentora antes de publicarlo.",
  "Reportar o bloquear a alguien toma un clic, y el equipo revisa cada reporte.",
  "La videollamada va directo entre ustedes dos: no se graba y el chat no se guarda.",
  "Si tienes menos de 14 años, pedimos la autorización de tu madre, padre o tutor.",
];

export default function HomePage() {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <JsonLd data={homeStructuredData()} />
      <PublicHeader />

      <main id="contenido">
        <section className="relative">
          <div
            aria-hidden="true"
            className="bg-brand-300/30 absolute top-10 -right-24 size-96 rounded-full blur-3xl"
          />
          <div
            aria-hidden="true"
            className="bg-accent-300/30 absolute bottom-0 -left-24 size-80 rounded-full blur-3xl"
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 pt-12 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-20 lg:pb-28">
            <div>
              <p className="border-brand-200 text-brand-700 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                <span className="bg-accent-500 size-1.5 rounded-full" />
                Mentorías STEAM · Perú y Latinoamérica
              </p>
              <h1 className="text-ink mt-6 text-4xl leading-[1.04] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.6rem]">
                Encuentra a la mentora STEAM que te ayude a{" "}
                <span className="from-brand-700 to-accent-600 bg-gradient-to-r bg-clip-text text-transparent">
                  tomar tu próxima decisión
                </span>
                .
              </h1>
              <p className="text-muted mt-6 max-w-xl text-base leading-7 sm:text-lg">
                Conversa 1 a 1 por videollamada con profesionales de ciencia,
                tecnología, ingeniería, arte y matemáticas. Para escolares,
                universitarias y mujeres que quieren dar el salto a STEAM.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className={buttonClassName({ size: "lg" })}
                >
                  Encuentra tu mentora
                </Link>
                <Link
                  href="/para-mentoras"
                  className={buttonClassName({
                    variant: "secondary",
                    size: "lg",
                  })}
                >
                  Quiero ser mentora
                </Link>
              </div>
              <p className="text-muted mt-4 text-sm">
                Registro gratuito ·{" "}
                <Link
                  href="/mentors"
                  className="text-ink font-medium underline"
                >
                  Mira las mentoras sin crear cuenta
                </Link>
              </p>
            </div>

            <HeroVisual />
          </div>
        </section>

        <div className="border-line border-y bg-white/70">
          <ul
            aria-label="Áreas STEAM"
            className="mx-auto flex w-full max-w-6xl flex-wrap justify-center gap-x-8 gap-y-3 px-5 py-6 sm:justify-between sm:px-8"
          >
            {AREAS.map((area) => (
              <li
                key={area.letter}
                className="text-ink flex items-center gap-2 text-sm font-medium"
              >
                <span
                  aria-hidden="true"
                  className="bg-brand-50 text-brand-700 grid size-8 place-items-center rounded-lg text-sm font-black"
                >
                  {area.letter}
                </span>
                {area.name}
              </li>
            ))}
          </ul>
        </div>

        <Section labelledBy="por-que">
          <SectionHeading
            id="por-que"
            eyebrow="Por qué existimos"
            title="Más mujeres en STEAM empieza con una buena conversación."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {REASONS.map((reason) => (
              <article
                key={reason.kicker}
                className="border-line flex flex-col rounded-3xl border bg-white p-6 sm:p-7"
              >
                <p className="text-accent-600 text-xs font-semibold tracking-[0.16em] uppercase">
                  {reason.kicker}
                </p>
                <h3 className="text-ink mt-3 text-xl font-semibold tracking-tight">
                  {reason.title}
                </h3>
                <p className="text-muted mt-3 text-sm leading-6">
                  {reason.body}
                </p>
                {reason.source ? (
                  <p className="text-muted mt-auto pt-4 text-xs">
                    Fuente:{" "}
                    <a
                      href={reason.source.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {reason.source.label}
                    </a>
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </Section>

        <Section
          tone="soft"
          labelledBy="como-funciona-title"
          id="como-funciona"
        >
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeading
              id="como-funciona-title"
              eyebrow="Cómo funciona"
              title="De la duda a la conversación en cuatro pasos."
              lead="Sin cursos ni contenido genérico: una sesión con alguien que ya pasó por donde estás."
            />
            <ol className="grid gap-4 sm:grid-cols-2">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="border-line bg-canvas rounded-3xl border p-6"
                >
                  <span className="text-brand-600 font-mono text-sm font-semibold">
                    0{index + 1}
                  </span>
                  <h3 className="text-ink mt-3 text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="text-muted mt-2 text-sm leading-6">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        <Section labelledBy="para-quien">
          <SectionHeading
            id="para-quien"
            eyebrow="Para quién"
            title="Dos lados de la misma comunidad."
            align="center"
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <AudienceCard
              href="/para-mentees"
              label="Para mentees"
              title="Busco orientación"
              body="Escolares, preuniversitarias, universitarias y profesionales que quieren entrar o crecer en STEAM."
              cta="Cómo funciona para mentees"
              accent="brand"
            />
            <AudienceCard
              href="/para-mentoras"
              label="Para mentoras"
              title="Quiero compartir lo que sé"
              body="Profesionales STEAM que quieren abrir camino. Tú defines tus horarios y si tu sesión es gratuita o de pago."
              cta="Cómo ser mentora"
              accent="accent"
            />
          </div>
        </Section>

        <Section tone="ink" labelledBy="seguridad">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <SectionHeading
              id="seguridad"
              eyebrow="Seguridad"
              title="Un espacio cuidado, también para menores de edad."
              lead="La confianza es la base de una mentoría. Por eso estas reglas no son opcionales."
              tone="light"
            />
            <ul className="space-y-3">
              {SAFETY.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/85"
                >
                  <CheckIcon />
                  {item}
                </li>
              ))}
              <li className="pt-2 text-sm">
                <Link
                  href="/help"
                  className="text-accent-300 font-semibold underline"
                >
                  Ayuda, reglas de la comunidad y emergencias
                </Link>
              </li>
            </ul>
          </div>
        </Section>

        <Section labelledBy="preguntas-title" id="preguntas">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeading
              id="preguntas-title"
              eyebrow="Preguntas frecuentes"
              title="Lo que más nos preguntan."
              lead={
                SUPPORT_EMAIL ? (
                  <>
                    ¿Otra duda? Escríbenos a{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-brand-700 underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                    .
                  </>
                ) : (
                  "¿Otra duda? Visita la página de ayuda."
                )
              }
            />
            <FaqList items={HOME_FAQ} />
          </div>
        </Section>

        <CtaBand
          title="¿Lista para tu primera conversación?"
          lead="Crear tu cuenta es gratis. Explora mentoras y reserva cuando estés lista."
          primary={{ href: "/register", label: "Crear mi cuenta" }}
          secondary={{ href: "/mentors", label: "Ver mentoras" }}
        />
      </main>

      <PublicFooter />
    </div>
  );
}

function HeroVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md">
      <div className="border-line shadow-brand-900/10 relative rotate-1 rounded-[2rem] border bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between">
          <span className="bg-brand-50 text-brand-700 rounded-full px-3 py-1 text-xs font-semibold">
            Recomendada para ti
          </span>
          <span className="text-muted text-xs">Videollamada · 45 min</span>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <span className="from-brand-500 to-accent-500 grid size-14 place-items-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white">
            M
          </span>
          <div>
            <p className="text-ink font-semibold">Mentora en ingeniería</p>
            <p className="text-muted text-sm">Software · Español e inglés</p>
          </div>
        </div>
        <p className="bg-canvas text-ink mt-5 rounded-2xl p-4 text-sm leading-6">
          <span className="text-brand-700 font-semibold">Por qué encaja: </span>
          comparten interés en tecnología y ella habla tu idioma.
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-medium">
          {["Lun 18:00", "Mié 19:00", "Sáb 10:00"].map((slot, index) => (
            <span
              key={slot}
              className={
                index === 1
                  ? "bg-brand-600 rounded-xl py-2 text-white"
                  : "border-line text-ink rounded-xl border py-2"
              }
            >
              {slot}
            </span>
          ))}
        </div>
      </div>
      <div className="border-line absolute -bottom-8 -left-4 flex -rotate-2 items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-xl sm:-left-10">
        <span className="bg-success-50 text-success-700 grid size-8 place-items-center rounded-full">
          <CheckIcon />
        </span>
        <div>
          <p className="text-ink text-sm font-semibold">Solicitud aceptada</p>
          <p className="text-muted text-xs">Te enviamos el enlace por correo</p>
        </div>
      </div>
    </div>
  );
}

function AudienceCard({
  href,
  label,
  title,
  body,
  cta,
  accent,
}: {
  href: string;
  label: string;
  title: string;
  body: string;
  cta: string;
  accent: "brand" | "accent";
}) {
  return (
    <Link
      href={href}
      className={
        "group focus-visible:ring-brand-500 relative flex flex-col overflow-hidden rounded-[2rem] border p-7 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:outline-none sm:p-9 " +
        (accent === "brand"
          ? "border-brand-200 bg-brand-50"
          : "border-accent-300/60 bg-accent-100/60")
      }
    >
      <span
        className={
          "text-xs font-semibold tracking-[0.16em] uppercase " +
          (accent === "brand" ? "text-brand-700" : "text-accent-600")
        }
      >
        {label}
      </span>
      <span className="text-ink mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </span>
      <span className="text-muted mt-3 max-w-md text-sm leading-6 sm:text-base">
        {body}
      </span>
      <span className="text-ink mt-8 inline-flex items-center gap-2 text-sm font-semibold">
        {cta}
        <span
          aria-hidden="true"
          className="transition group-hover:translate-x-1"
        >
          →
        </span>
      </span>
    </Link>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="text-accent-300 mt-0.5 size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 10.5 3 3 7-7" />
    </svg>
  );
}

function homeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/icon.svg"),
        description: SITE_DESCRIPTION,
        areaServed: [
          { "@type": "Country", name: "Perú" },
          { "@type": "Place", name: "Latinoamérica" },
        ],
        knowsAbout: [
          "Mentoría",
          "Ciencia",
          "Tecnología",
          "Ingeniería",
          "Arte",
          "Matemáticas",
          "Orientación vocacional",
        ],
        ...(SUPPORT_EMAIL
          ? {
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: SUPPORT_EMAIL,
                availableLanguage: ["es"],
              },
            }
          : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: absoluteUrl("/"),
        inLanguage: "es-PE",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Service",
        name: "Mentoría STEAM 1 a 1",
        serviceType: "Mentoría por videollamada",
        provider: { "@id": `${SITE_URL}/#organization` },
        audience: {
          "@type": "Audience",
          audienceType:
            "Mujeres y niñas interesadas en ciencia, tecnología, ingeniería, arte y matemáticas",
        },
        areaServed: "Latinoamérica",
        availableChannel: {
          "@type": "ServiceChannel",
          serviceUrl: absoluteUrl("/mentors"),
        },
      },
      faqPageSchema(HOME_FAQ),
    ],
  };
}
