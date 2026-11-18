export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Answers describe only what the platform does today. They feed the visible
 * FAQ and the FAQPage structured data, so both always say the same thing.
 */
export const HOME_FAQ: FaqItem[] = [
  {
    question: "¿Qué es Steam Society?",
    answer:
      "Es una plataforma de mentorías 1 a 1 que conecta a mujeres y niñas con mentoras de ciencia, tecnología, ingeniería, arte y matemáticas (STEAM). Empezamos en Perú y queremos llegar a toda Latinoamérica. No vendemos cursos: facilitamos conversaciones con alguien que ya recorrió el camino.",
  },
  {
    question: "¿Cómo elijo a mi mentora?",
    answer:
      "Al crear tu cuenta respondes unas preguntas sobre tus intereses, áreas e idiomas. Con eso te recomendamos mentoras y te mostramos por qué cada una encaja contigo. También puedes explorar el catálogo y filtrar por área, idioma y precio. La decisión siempre es tuya: el sistema recomienda, nunca asigna.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "Crear una cuenta es gratis. Cada mentora indica en su perfil si su sesión es gratuita o tiene un precio, y lo ves antes de reservar.",
  },
  {
    question: "¿Cómo es una sesión?",
    answer:
      "Eliges un horario libre de la mentora y le envías una solicitud. Ella la acepta o la rechaza; si no responde en 48 horas, la solicitud vence. La sesión es una videollamada dentro de Steam Society, con chat de texto. La llamada va directo entre las dos personas, no se graba y el chat no se guarda.",
  },
  {
    question: "¿Quién puede ser mentora?",
    answer:
      "Una profesional o estudiante avanzada de un área STEAM con ganas de acompañar a otras mujeres. Crea su cuenta como mentora, completa su perfil y el equipo de Steam Society lo revisa. Solo los perfiles aprobados aparecen en el catálogo.",
  },
  {
    question: "¿Es seguro?",
    answer:
      "Revisamos cada perfil de mentora antes de publicarlo. Puedes reportar o bloquear a cualquier persona desde su perfil o desde una reserva, y el equipo revisa cada reporte. Las cuentas del equipo usan verificación en dos pasos. Si estás en peligro, llama al 105 o a la Línea 100.",
  },
  {
    question: "¿Puedo usar Steam Society si soy menor de edad?",
    answer:
      "Sí. Si tienes menos de 14 años, la ley peruana exige que tu madre, padre o tutor autorice el uso de tus datos, y te lo pedimos al registrarte. Recomendamos que una persona adulta de confianza sepa cuándo tienes una sesión.",
  },
  {
    question: "¿Qué pasa con mis datos?",
    answer:
      "Usamos tus datos solo para que la plataforma funcione: tu cuenta, tu perfil, tus reservas y los avisos por correo. No vendemos datos ni usamos publicidad. Desde tu cuenta puedes descargar tus datos o eliminar tu cuenta.",
  },
];
