import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/catalog-view";

export const metadata: Metadata = {
  title: "Mentoras STEAM",
  description:
    "Explora mentoras STEAM aprobadas, filtra por área, idioma y precio, y reserva una sesión 1 a 1.",
  alternates: { canonical: "/mentors" },
};

export default function MentorsPage() {
  return <CatalogView />;
}
