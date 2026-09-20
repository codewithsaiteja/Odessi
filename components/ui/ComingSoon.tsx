import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-[var(--color-odessi-warmwhite)] flex flex-col">
      {/* Minimal header */}
      <header className="px-6 py-5 border-b border-[var(--color-odessi-smoke)]">
        <Link href="/">
          <Image
            src="/logo1.png"
            alt="Odessi.tfi"
            width={100}
            height={34}
            className="h-7 w-auto object-contain"
          />
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="type-caption text-[var(--color-odessi-stone)] mb-4">Coming Soon</p>
          <span className="divider mx-auto block mb-6" aria-hidden="true" />
          <h1
            className="text-[var(--color-odessi-black)] mb-5"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 300,
              lineHeight: 1.05,
            }}
          >
            {title}
          </h1>
          {description && (
            <p className="type-body text-[var(--color-odessi-stone)] mb-10">
              {description}
            </p>
          )}
          <p className="type-body-sm text-[var(--color-odessi-silver)] mb-10">
            This page is currently being built. The full experience will be available soon.
          </p>
          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft size={13} strokeWidth={2} />
            BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
