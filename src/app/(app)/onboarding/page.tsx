import type { Metadata } from "next";
import { OnboardingView } from "@/components/onboarding/onboarding-view";

export const metadata: Metadata = {
  title: "Onboarding",
};

// The session and onboarding state are resolved client-side from the API.
export const instant = false;

export default function OnboardingPage() {
  return <OnboardingView />;
}
