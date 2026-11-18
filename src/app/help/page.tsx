import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { SUPPORT_EMAIL, whatsappLink } from "@/lib/support";

export const metadata: Metadata = {
  title: "Ayuda y seguridad",
};

export default function HelpPage() {
  const whatsapp = whatsappLink("Hola, necesito ayuda con Steam Society.");

  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main className="mx-auto max-w-2xl space-y-8 px-5 py-10 sm:px-8">
        <header>
          <h1 className="text-ink text-3xl font-semibold">Ayuda y seguridad</h1>
          <p className="text-muted mt-2">
            Steam Society debe ser un lugar seguro. Si algo no está bien,
            cuéntanos.
          </p>
        </header>

        <section className="border-danger-200 bg-danger-50 rounded-2xl border p-5">
          <h2 className="text-danger-700 font-semibold">
            ¿Estás en peligro ahora?
          </h2>
          <ul className="text-ink mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>
              Policía Nacional del Perú: <strong>105</strong>.
            </li>
            <li>
              Violencia contra la mujer o familiar: <strong>Línea 100</strong>{" "}
              (gratuita, todos los días).
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-ink text-lg font-semibold">
            Reportar o bloquear a alguien
          </h2>
          <p className="text-muted text-sm">
            En{" "}
            <Link
              href="/dashboard/bookings"
              className="text-brand-700 underline"
            >
              tus reservas
            </Link>
            , usa “Reportar o bloquear” junto a la sesión. El reporte lo lee
            solo el equipo y la otra persona no sabe quién lo hizo. Si bloqueas
            a alguien, se cancelan sus reservas abiertas contigo y no podrán
            volver a reservar entre ustedes. Puedes desbloquear desde{" "}
            <Link href="/account/security" className="text-brand-700 underline">
              tu cuenta
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-ink text-lg font-semibold">
            Reglas de la comunidad
          </h2>
          <ul className="text-muted list-disc space-y-1 pl-5 text-sm">
            <li>Trata a todas las personas con respeto.</li>
            <li>
              Las sesiones son para orientar: nunca pidas ni ofrezcas dinero,
              regalos ni datos personales fuera de la plataforma.
            </li>
            <li>
              Haz las sesiones en la videollamada de Steam Society; no compartas
              tu número ni tus redes si no quieres.
            </li>
            <li>Si no puedes asistir, cancela con tiempo.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-ink text-lg font-semibold">Contacto</h2>
          {SUPPORT_EMAIL || whatsapp ? (
            <ul className="text-muted space-y-1 text-sm">
              {SUPPORT_EMAIL ? (
                <li>
                  Correo:{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-brand-700 underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </li>
              ) : null}
              {whatsapp ? (
                <li>
                  WhatsApp:{" "}
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-700 underline"
                  >
                    escríbenos
                  </a>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="text-muted text-sm">
              Usa “Reportar o bloquear” en tus reservas y el equipo te
              responderá.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
