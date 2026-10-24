import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClassName } from "@/components/ui/button";

const FEATURES = [
  {
    title: "Mentoría con propósito",
    description:
      "Conversaciones uno a uno con mujeres que ya recorrieron el camino STEM.",
  },
  {
    title: "Tu ritmo, tus metas",
    description:
      "Elige el área que quieres explorar y avanza con acompañamiento real.",
  },
  {
    title: "Comunidad que suma",
    description:
      "Una red que acerca a más mujeres a ciencia, tecnología, ingeniería, arte y matemáticas.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh overflow-hidden">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="focus-visible:ring-brand-500 focus-visible:ring-offset-canvas rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-ink hover:bg-brand-50 rounded-xl px-3 py-2 text-sm font-semibold transition"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className={buttonClassName({
              size: "sm",
              className: "hidden sm:inline-flex",
            })}
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
          <div className="relative z-10">
            <p className="border-brand-200 bg-brand-50 text-brand-700 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              Mentorías STEAM · Perú y LatAm
            </p>
            <h1 className="text-ink mt-6 max-w-2xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Más mujeres en STEAM, con acompañamiento que abre puertas.
            </h1>
            <p className="text-muted mt-6 max-w-xl text-base leading-7 sm:text-lg">
              Steam Society conecta a mentoradas con mentoras que comparten su
              experiencia, su red y una forma más cercana de crecer en ciencia y
              tecnología.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className={buttonClassName({
                  size: "lg",
                  className: "sm:w-auto",
                })}
              >
                Crear mi cuenta
              </Link>
              <Link
                href="/login"
                className={buttonClassName({
                  variant: "secondary",
                  size: "lg",
                  className: "sm:w-auto",
                })}
              >
                Ya tengo cuenta
              </Link>
            </div>
            <p className="text-muted mt-4 text-xs">
              Registro gratuito. Para mentoradas y mentoras.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              aria-hidden="true"
              className="bg-accent-300/40 absolute -top-10 -right-8 size-40 rounded-full blur-2xl"
            />
            <div
              aria-hidden="true"
              className="bg-brand-300/40 absolute -bottom-12 -left-10 size-48 rounded-full blur-3xl"
            />
            <div className="border-line shadow-brand-900/5 relative rounded-[2rem] border bg-white/80 p-6 shadow-xl backdrop-blur sm:p-8">
              <div className="flex items-center justify-between">
                <span className="bg-brand-50 text-brand-700 rounded-full px-3 py-1 text-xs font-semibold">
                  Tu próximo paso
                </span>
                <span className="text-muted text-xs">1:1</span>
              </div>
              <div className="mt-8 space-y-5">
                <div className="bg-canvas rounded-2xl p-4">
                  <p className="text-ink text-sm font-semibold">
                    “Quiero sentir que mi experiencia también puede abrir
                    caminos.”
                  </p>
                  <p className="text-muted mt-2 text-xs">
                    Mentora · Ingeniería de software
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["Ciencia", "Tecnología", "Arte"].map((area) => (
                    <span
                      key={area}
                      className="border-line text-muted rounded-xl border bg-white px-2 py-2 text-center text-xs font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
                <div className="border-brand-100 bg-brand-50/70 flex items-center gap-3 rounded-2xl border p-3">
                  <span className="bg-brand-600 grid size-9 place-items-center rounded-full text-xs font-bold text-white">
                    S
                  </span>
                  <div>
                    <p className="text-ink text-sm font-semibold">
                      Una conversación puede cambiarlo todo.
                    </p>
                    <p className="text-muted text-xs">Empieza por conocerte.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-line border-y bg-white/60">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 sm:px-8 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="space-y-2">
                <h2 className="text-ink text-sm font-semibold">
                  {feature.title}
                </h2>
                <p className="text-muted text-sm leading-6">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="text-muted mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-8 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>Steam Society · Mentorías para acercar más mujeres a STEAM.</p>
        <p>Hecho con cuidado para Perú y Latinoamérica.</p>
      </footer>
    </div>
  );
}
