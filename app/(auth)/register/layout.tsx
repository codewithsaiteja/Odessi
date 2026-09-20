import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Create Account | Odessi.tfi",
  description: "Join Odessi.tfi and wear the story. Create your account.",
  robots: { index: false, follow: false },
};
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
