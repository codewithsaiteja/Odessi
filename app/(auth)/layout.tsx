export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages are standalone — no global nav or footer.
  return <>{children}</>;
}
