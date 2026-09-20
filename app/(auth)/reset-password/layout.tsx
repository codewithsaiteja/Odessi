import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Reset Password | Odessi.tfi",
  description: "Create a new password for your Odessi.tfi account.",
  robots: { index: false, follow: false },
};
export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
