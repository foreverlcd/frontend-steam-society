import { ApiError, isApiError } from "./client";

const CODE_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "Tu sesión expiró. Inicia sesión de nuevo.",
  EMAIL_TAKEN: "Ese correo ya está registrado.",
  INVALID_BIRTH_DATE: "La fecha de nacimiento no puede estar en el futuro.",
  INVALID_CREDENTIALS: "Correo o contraseña incorrectos.",
  INVALID_RESET_TOKEN:
    "El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.",
  INVALID_ONBOARDING_ANSWERS:
    "Revisa las respuestas marcadas e inténtalo de nuevo.",
  ONBOARDING_VERSION_MISMATCH:
    "Actualizamos el onboarding. Recarga la página para continuar.",
  INVALID_PRIMARY_AREA: "Elige un área principal válida.",
  INVALID_SUBAREA: "Las subáreas deben pertenecer al área principal.",
  INVALID_LANGUAGE: "Elige un idioma válido.",
  PRIMARY_AREA_REQUIRED: "Elige un área principal antes de las subáreas.",
  PRIMARY_AREA_REQUIRES_SUBAREAS:
    "Elige al menos una subárea para tu área principal.",
  ONBOARDING_INCOMPLETE: "Aún faltan respuestas obligatorias.",
  FORBIDDEN: "No tienes permisos para realizar esta acción.",
  MENTOR_ONLY: "Esta acción solo está disponible para mentoras.",
  MENTOR_PROFILE_NOT_FOUND:
    "No encontramos el perfil de mentora. Completa tu perfil antes de continuar.",
  MENTOR_NOT_APPROVED:
    "Tu perfil de mentora debe estar aprobado para hacer cambios.",
  MENTOR_STATUS_CONFLICT:
    "Otra persona actualizó este perfil. Recarga y vuelve a intentarlo.",
  INVALID_MENTOR_STATUS_TRANSITION:
    "El perfil ya no está en un estado que permita esta acción. Recarga la bandeja.",
  OFFERING_NOT_FOUND: "La oferta no existe o ya no está disponible.",
  OFFERING_ARCHIVED: "Esta oferta está archivada.",
  INVALID_OFFERING_PRICE:
    "Una oferta gratuita debe costar 0; una de pago debe tener un precio mayor a 0.",
  INVALID_CURRENCY: "La moneda debe ser un código ISO 4217 válido.",
  INVALID_TIMEZONE: "La zona horaria no es válida.",
  INVALID_AVAILABILITY_RANGE: "Revisa el rango de disponibilidad.",
  INVALID_SLOT_RANGE: "El rango de fechas no es válido.",
  SLOT_RANGE_TOO_LARGE: "Puedes consultar como máximo 90 días.",
  INVALID_AVAILABILITY_RULE: "Hay una regla de disponibilidad inválida.",
  NETWORK_ERROR:
    "No pudimos conectar con el servidor. Revisa que la API esté disponible.",
  HTTP_429: "Demasiados intentos. Espera un minuto y vuelve a intentarlo.",
};

export function getErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado. Inténtalo de nuevo.",
): string {
  if (!isApiError(error)) {
    return fallback;
  }

  const mapped = CODE_MESSAGES[error.code];

  if (mapped) {
    return mapped;
  }

  if (error.status === 400) {
    return "Revisa los datos ingresados e inténtalo de nuevo.";
  }

  if (error.status === 0) {
    return CODE_MESSAGES.NETWORK_ERROR;
  }

  return error.message || fallback;
}

export function isUnauthorized(error: unknown): error is ApiError {
  return isApiError(error) && error.status === 401;
}
