import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/catalog-view";

export const metadata: Metadata = {
  title: "Mentoras · Steam Society",
  description:
    "Explora mentoras aprobadas, filtra por área, idioma y precio, y reserva una sesión.",
};

export default function MentorsPage() {
  return <CatalogView />;
}
