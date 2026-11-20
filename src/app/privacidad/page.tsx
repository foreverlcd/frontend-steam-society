import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { SUPPORT_EMAIL } from "@/lib/support";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Qué datos personales trata Steam Society, para qué, con quién los compartimos, cuánto tiempo los guardamos y cómo ejercer tus derechos según la Ley 29733 del Perú.",
  alternates: { canonical: "/privacidad" },
};

function Contact() {
  return SUPPORT_EMAIL ? (
    <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
  ) : (
    <Link href="/help">la página de ayuda</Link>
  );
}

const SECTIONS: LegalSection[] = [
  {
    id: "responsable",
    title: "Quién es responsable de tus datos",
    body: (
      <>
        <p>
          El responsable del tratamiento es Steam Society [razón social, RUC y
          domicilio por completar]. Puedes escribirnos a <Contact /> para
          cualquier tema de privacidad.
        </p>
        <p>
          Tratamos tus datos según la Ley N.º 29733, Ley de Protección de Datos
          Personales del Perú, y su Reglamento (Decreto Supremo N.º
          016-2024-JUS).
        </p>
      </>
    ),
  },
  {
    id: "datos",
    title: "Qué datos tratamos",
    body: (
      <table>
        <thead>
          <tr>
            <th scope="col">Dato</th>
            <th scope="col">De dónde sale</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Correo, contraseña (guardada cifrada con Argon2id), rol y fecha de
              nacimiento
            </td>
            <td>Los das al registrarte</td>
          </tr>
          <tr>
            <td>
              Nombre, apellido y datos de tu perfil (áreas, idiomas, intereses,
              experiencia)
            </td>
            <td>Los das en tu perfil y en el cuestionario inicial</td>
          </tr>
          <tr>
            <td>
              Reservas: horarios, estado, mensaje de la solicitud y enlace de la
              sesión
            </td>
            <td>Se generan al usar la plataforma</td>
          </tr>
          <tr>
            <td>Reportes y bloqueos</td>
            <td>Los creas tú o alguien que te reporta</td>
          </tr>
          <tr>
            <td>
              Datos técnicos y de seguridad: cookie de sesión, intentos de
              inicio de sesión, verificación en dos pasos y registro de acciones
              importantes
            </td>
            <td>Se generan al usar la plataforma</td>
          </tr>
          <tr>
            <td>
              Constancia de que aceptaste esta política y los términos (fecha y
              versión) y, si tienes menos de 14 años, el correo de tu madre,
              padre o tutor y la fecha en que autorizó tu cuenta
            </td>
            <td>
              Al registrarte; la fecha de la autorización, cuando tu madre,
              padre o tutor la da
            </td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    id: "finalidades",
    title: "Para qué los usamos",
    body: (
      <ul>
        <li>Crear y proteger tu cuenta.</li>
        <li>
          Mostrar tu perfil (si eres mentora aprobada) y recomendarte mentoras
          según tus intereses. Las recomendaciones salen de reglas simples y
          explicables; no tomamos decisiones automáticas con efectos legales
          sobre ti.
        </li>
        <li>Gestionar solicitudes, reservas y videollamadas.</li>
        <li>
          Enviarte correos necesarios: verificación, avisos de reservas y
          seguridad.
        </li>
        <li>Cuidar a la comunidad: revisar perfiles, reportes y bloqueos.</li>
        <li>Cumplir obligaciones legales y defender nuestros derechos.</li>
      </ul>
    ),
  },
  {
    id: "no-hacemos",
    title: "Lo que no hacemos",
    body: (
      <ul>
        <li>No vendemos ni alquilamos tus datos.</li>
        <li>No usamos publicidad ni herramientas de analítica de terceros.</li>
        <li>No grabamos las videollamadas.</li>
        <li>
          No guardamos el chat de la videollamada: va directo entre las dos
          personas y desaparece al cerrar la llamada. Por eso el equipo no puede
          revisarlo si haces un reporte.
        </li>
      </ul>
    ),
  },
  {
    id: "consentimiento",
    title: "Base legal y consentimiento",
    body: (
      <p>
        Tratamos tus datos con tu consentimiento, que das al crear tu cuenta, y
        porque son necesarios para darte el servicio que pides. Puedes retirar
        tu consentimiento en cualquier momento eliminando tu cuenta.
      </p>
    ),
  },
  {
    id: "menores",
    title: "Menores de edad",
    body: (
      <>
        <p>
          Steam Society no tiene una edad mínima. Si tienes menos de 14 años, la
          ley exige que tu madre, padre o tutor autorice el tratamiento de tus
          datos. Al registrarte nos das su correo y le enviamos un enlace para
          que lea esta política y autorice tu cuenta. Hasta que lo haga, no
          puedes reservar sesiones. Si eres madre, padre o tutor y crees que una
          persona menor de 14 años se registró sin tu autorización, escríbenos a{" "}
          <Contact /> y eliminaremos la cuenta.
        </p>
        <p>
          A las personas de 14 a 17 años les pedimos solo los datos necesarios y
          les recomendamos que una persona adulta de confianza sepa cuándo
          tienen una sesión.
        </p>
      </>
    ),
  },
  {
    id: "compartir",
    title: "Con quién compartimos tus datos",
    body: (
      <>
        <ul>
          <li>
            <strong>Con la otra persona de tu reserva:</strong> tu nombre, el
            horario y el mensaje de la solicitud. El perfil público de una
            mentora aprobada lo puede ver cualquier visitante.
          </li>
          <li>
            <strong>Durante la videollamada:</strong> para conectar la llamada,
            tu navegador comparte tu dirección IP con la otra persona y con
            servidores de conexión (STUN/TURN).
          </li>
          <li>
            <strong>Proveedores que trabajan para nosotros:</strong> servidores
            y base de datos en la nube, y envío de correos (Brevo). Solo reciben
            lo necesario para su tarea. [Lista completa de proveedores y países
            por completar.]
          </li>
          <li>
            <strong>Autoridades:</strong> solo cuando la ley lo exija.
          </li>
        </ul>
        <p>
          Algunos proveedores están fuera del Perú, así que puede haber
          transferencia internacional de datos. Solo trabajamos con proveedores
          que ofrecen un nivel adecuado de protección.
        </p>
      </>
    ),
  },
  {
    id: "conservacion",
    title: "Cuánto tiempo los guardamos",
    body: (
      <>
        <p>
          Mientras tengas una cuenta. Si la eliminas, borramos o anonimizamos
          tus datos personales: tu correo se reemplaza, se borran tu contraseña,
          tus nombres, tu perfil, tus respuestas y tus horarios.
        </p>
        <p>
          Conservamos sin tus datos de contacto lo que también le pertenece a
          otra persona o necesitamos por seguridad: el historial de reservas, el
          registro de acciones importantes y los reportes (sin su texto).
          [Plazos definitivos por confirmar.]
        </p>
      </>
    ),
  },
  {
    id: "derechos",
    title: "Tus derechos",
    body: (
      <>
        <p>
          Tienes derecho a acceder a tus datos, rectificarlos, cancelarlos,
          oponerte a su tratamiento y pedir su portabilidad. La mayoría puedes
          ejercerlos tú misma desde <Link href="/account">tu cuenta</Link>:
        </p>
        <ul>
          <li>Editar tu perfil y tus datos.</li>
          <li>Descargar una copia de tus datos.</li>
          <li>Eliminar tu cuenta.</li>
        </ul>
        <p>
          Para cualquier otro pedido, escríbenos a <Contact />. Respondemos en
          los plazos que fija la ley. Si no estás conforme con la respuesta,
          puedes acudir a la Autoridad Nacional de Protección de Datos
          Personales del Ministerio de Justicia y Derechos Humanos.
        </p>
      </>
    ),
  },
  {
    id: "seguridad",
    title: "Cómo protegemos tus datos",
    body: (
      <ul>
        <li>
          Conexiones cifradas (HTTPS) y contraseñas guardadas con Argon2id.
        </li>
        <li>
          Cookie de sesión protegida, inaccesible para el código de la página.
        </li>
        <li>
          Verificación en dos pasos obligatoria para las cuentas del equipo.
        </li>
        <li>
          Acceso a los datos solo para quien lo necesita, con registro de
          acciones.
        </li>
      </ul>
    ),
  },
  {
    id: "cambios",
    title: "Cambios a esta política",
    body: (
      <p>
        Si cambiamos algo importante, te avisaremos por correo o en la
        plataforma antes de que aplique, y te pediremos de nuevo tu
        consentimiento cuando la ley lo exija.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      path="/privacidad"
      intro={
        <p>
          En Steam Society cuidamos tus datos como cuidamos la comunidad: solo
          pedimos lo necesario, no los vendemos y puedes llevártelos o borrarlos
          cuando quieras.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
