import { ApiError, isApiError } from "./client";

const CODE_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "Tu sesión expiró. Inicia sesión de nuevo.",
  EMAIL_TAKEN: "Ese correo ya está registrado.",
  INVALID_BIRTH_DATE: "La fecha de nacimiento no puede estar en el futuro.",
  INVALID_CREDENTIALS: "Correo o contraseña incorrectos.",
  INVALID_RESET_TOKEN:
    "El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.",
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
