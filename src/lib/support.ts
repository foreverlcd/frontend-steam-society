/** Support contacts (ADR-026 §11: e-mail + a personal WhatsApp, configurable). */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";

/** International number without "+" or spaces, e.g. 51987654321. */
export const SUPPORT_WHATSAPP = (
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? ""
).replace(/\D/g, "");

export function whatsappLink(text?: string): string | null {
  if (!SUPPORT_WHATSAPP) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${SUPPORT_WHATSAPP}${query}`;
}
