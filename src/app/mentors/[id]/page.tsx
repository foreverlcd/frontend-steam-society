import { MentorDetailView } from "@/components/catalog/mentor-detail-view";

// The session is resolved client-side from an HttpOnly cookie.
export const instant = false;

export default async function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <MentorDetailView mentorId={id} />;
}
