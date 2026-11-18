import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Política de cookies",
  description:
    "Steam Society usa una sola cookie, necesaria para mantener tu sesión. Sin publicidad, sin analítica y sin cookies de terceros.",
  alternates: { canonical: "/cookies" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "que-usamos",
    title: "Qué cookies usamos",
    body: (
      <table>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Para qué</th>
            <th scope="col">Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>__Host-sid</code> (en pruebas locales, <code>sid</code>)
            </td>
            <td>
              Mantener tu sesión iniciada. Es estrictamente necesaria: sin ella
              no puedes entrar a tu cuenta.
            </td>
            <td>Hasta 7 días, o hasta que cierres sesión</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    id: "no-usamos",
    title: "Lo que no usamos",
    body: (
      <ul>
        <li>Cookies de publicidad.</li>
        <li>Cookies de analítica o medición.</li>
        <li>Cookies de redes sociales o de otros sitios.</li>
      </ul>
    ),
  },
  {
    id: "consentimiento",
    title: "Por qué no te pedimos aceptar",
    body: (
      <p>
        Las cookies estrictamente necesarias no requieren consentimiento, porque
        sin ellas el servicio que pides no funciona. Si algún día agregamos otra
        cookie, te pediremos permiso antes y podrás rechazarla.
      </p>
    ),
  },
  {
    id: "almacenamiento",
    title: "Almacenamiento en tu navegador",
    body: (
      <p>
        Para no mostrarte otra vez el aviso de cookies, tu navegador guarda la
        marca <code>ss-cookie-notice</code> en su almacenamiento local. No
        contiene datos personales y no se envía a nuestros servidores.
      </p>
    ),
  },
  {
    id: "control",
    title: "Cómo controlarlas",
    body: (
      <p>
        Puedes borrar las cookies desde la configuración de tu navegador. Si
        borras la de sesión, solo tendrás que volver a iniciar sesión.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Política de cookies"
      path="/cookies"
      intro={
        <p>
          Corto y claro: usamos una sola cookie, la necesaria para que puedas
          iniciar sesión.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
