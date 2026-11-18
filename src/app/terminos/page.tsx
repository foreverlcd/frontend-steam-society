import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Reglas de uso de Steam Society: cuentas, reservas, videollamadas, conducta, pagos y responsabilidad.",
  alternates: { canonical: "/terminos" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "servicio",
    title: "Qué es Steam Society",
    body: (
      <p>
        Steam Society es una plataforma que conecta a mentees con mentoras de
        ciencia, tecnología, ingeniería, arte y matemáticas para conversar 1 a
        1. Facilitamos el encuentro, la agenda y la videollamada. Las mentoras
        comparten su experiencia personal: la mentoría no reemplaza la
        orientación profesional, psicológica, médica ni legal.
      </p>
    ),
  },
  {
    id: "cuenta",
    title: "Tu cuenta",
    body: (
      <ul>
        <li>
          Al crear una cuenta aceptas estos términos y la{" "}
          <Link href="/privacidad">política de privacidad</Link>.
        </li>
        <li>
          Si tienes menos de 14 años, necesitas la autorización de tu madre,
          padre o tutor.
        </li>
        <li>
          Los datos que nos das deben ser reales, empezando por tu fecha de
          nacimiento.
        </li>
        <li>
          Cada cuenta tiene un solo rol: mentee o mentora. Si quieres ambos, usa
          dos cuentas con correos distintos.
        </li>
        <li>
          Cuida tu contraseña. Eres responsable de lo que se haga con tu cuenta.
        </li>
      </ul>
    ),
  },
  {
    id: "mentoras",
    title: "Mentoras",
    body: (
      <ul>
        <li>
          El equipo revisa cada perfil antes de publicarlo y puede rechazarlo o
          suspenderlo si no cumple estas reglas.
        </li>
        <li>
          La información de tu perfil debe ser verdadera. No te presentes con
          títulos o experiencia que no tienes.
        </li>
        <li>
          Tú defines tus ofertas, su duración, si son gratuitas o de pago y tus
          horarios.
        </li>
      </ul>
    ),
  },
  {
    id: "reservas",
    title: "Reservas y sesiones",
    body: (
      <ul>
        <li>
          La mentee solicita un horario y la mentora lo acepta o lo rechaza. Si
          no responde en 48 horas, la solicitud vence.
        </li>
        <li>
          Cualquiera de las dos puede cancelar una reserva. Hazlo con tiempo.
        </li>
        <li>
          Las sesiones se hacen en la videollamada de Steam Society. No se
          graban y el chat no se guarda.
        </li>
        <li>
          No grabes ni compartas la sesión sin el permiso expreso de la otra
          persona.
        </li>
      </ul>
    ),
  },
  {
    id: "conducta",
    title: "Reglas de conducta",
    body: (
      <>
        <p>Está prohibido:</p>
        <ul>
          <li>Acosar, discriminar, amenazar o faltar el respeto.</li>
          <li>
            Contenido sexual de cualquier tipo, y en especial con menores de
            edad.
          </li>
          <li>
            Pedir u ofrecer dinero, regalos o datos personales fuera de la
            plataforma.
          </li>
          <li>Llevar a una menor de edad a otros canales de contacto.</li>
          <li>
            Suplantar a otra persona o usar la plataforma para fraudes o spam.
          </li>
          <li>Intentar vulnerar la seguridad de la plataforma.</li>
        </ul>
        <p>
          Si alguien rompe estas reglas, repórtalo. El equipo revisa cada
          reporte y puede advertir o suspender cuentas. Las conductas que puedan
          ser delito se comunican a las autoridades. Más en{" "}
          <Link href="/help">Ayuda y seguridad</Link>.
        </p>
      </>
    ),
  },
  {
    id: "pagos",
    title: "Pagos",
    body: (
      <p>
        Crear una cuenta es gratis. Algunas ofertas pueden tener precio; lo ves
        antes de reservar. Las condiciones de cobro, comisión, cancelación y
        reembolso se publicarán aquí antes de activar los pagos en línea.
      </p>
    ),
  },
  {
    id: "responsabilidad",
    title: "Responsabilidad",
    body: (
      <>
        <p>
          Hacemos lo posible para que la plataforma funcione bien y sea segura,
          pero puede tener fallas o interrupciones. Las decisiones que tomes
          después de una mentoría son tuyas.
        </p>
        <p>
          Nada en estos términos limita los derechos que te da el Código de
          Protección y Defensa del Consumidor del Perú.
        </p>
      </>
    ),
  },
  {
    id: "baja",
    title: "Suspensión y baja",
    body: (
      <p>
        Puedes eliminar tu cuenta cuando quieras desde{" "}
        <Link href="/account">tu cuenta</Link>. Podemos suspender una cuenta que
        incumpla estos términos; si pasa, te lo diremos.
      </p>
    ),
  },
  {
    id: "cambios",
    title: "Cambios y ley aplicable",
    body: (
      <p>
        Si cambiamos estos términos, te avisaremos antes de que apliquen. Se
        rigen por las leyes del Perú. [Datos del titular, domicilio y mecanismo
        de reclamos, incluido el Libro de Reclamaciones si corresponde, por
        completar.]
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos y condiciones"
      path="/terminos"
      intro={
        <p>
          Estas reglas existen para que Steam Society sea un lugar útil y seguro
          para todas. Léelas antes de crear tu cuenta.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
