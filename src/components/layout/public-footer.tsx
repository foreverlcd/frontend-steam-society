import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SUPPORT_EMAIL } from "@/lib/support";

const COLUMNS = [
  {
    title: "Plataforma",
    links: [
      { href: "/para-mentees", label: "Para mentees" },
      { href: "/para-mentoras", label: "Para mentoras" },
      { href: "/mentors", label: "Mentoras" },
      { href: "/register", label: "Crear cuenta" },
    ],
  },
  {
    title: "Seguridad",
    links: [
      { href: "/help", label: "Ayuda y seguridad" },
      { href: "/help#reportar", label: "Reportar a alguien" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacidad", label: "Privacidad" },
      { href: "/terminos", label: "Términos" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-line border-t bg-white/60">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Logo />
          <p className="text-muted max-w-xs text-sm leading-6">
            Mentorías 1 a 1 para acercar a más mujeres a carreras STEAM. Desde
            Perú para Latinoamérica.
          </p>
          {SUPPORT_EMAIL ? (
            <p className="text-sm">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-brand-700 font-medium hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          ) : null}
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-ink text-sm font-semibold">{column.title}</h2>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-ink text-sm transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-line text-muted mx-auto flex w-full max-w-6xl flex-col gap-2 border-t px-5 py-6 text-xs sm:flex-row sm:justify-between sm:px-8">
        <p>© 2026 Steam Society.</p>
        <p>Usamos una sola cookie, necesaria para tu sesión.</p>
      </div>
    </footer>
  );
}
