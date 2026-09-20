import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Sign In | Odessi.tfi",
  description: "Sign in to your Odessi.tfi account and continue your journey.",
  robots: { index: false, follow: false },
};
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
