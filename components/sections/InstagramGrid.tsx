import Image from "next/image";
import Link from "next/link";
import IconInstagram from "@/components/ui/IconInstagram";
import { siteConfig } from "@/config/site";

export default function InstagramGrid() {
  const { instagram } = siteConfig;

  return (
    <section
      aria-labelledby="instagram-heading"
      className="section-py bg-[var(--color-odessi-offwhite)]"
    >
      <div className="container-odessi">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 lg:mb-14">
          <p className="type-caption text-[var(--color-odessi-stone)] mb-4">
            Follow The World
          </p>
          <span className="divider mx-auto mb-5" aria-hidden="true" />
          <h2
            id="instagram-heading"
            className="type-h2 text-[var(--color-odessi-black)] mb-4"
          >
            {instagram.headline.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>
          <Link
            href={instagram.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 type-caption text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)] transition-colors"
          >
            <IconInstagram size={14} strokeWidth={1.5} />
            {instagram.handle}
          </Link>
        </div>

        {/* Grid — 6 images: 2 rows × 3 cols on mobile, 1 row × 6 on lg */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5"
          role="list"
          aria-label="Instagram posts from @odessi.tfi"
        >
          {instagram.images.map((src, i) => (
            <Link
              key={i}
              href={instagram.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              role="listitem"
              aria-label={`View post ${i + 1} on Instagram`}
              className="group relative block overflow-hidden aspect-square bg-[var(--color-odessi-smoke)]"
            >
              <Image
                src={src}
                alt={`Odessi.tfi Instagram post ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                className="object-cover transition-transform duration-600 ease-out group-hover:scale-[1.06] select-none"
              />
              {/* Hover overlay */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center"
              >
              <IconInstagram
                  size={24}
                  strokeWidth={1.5}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Follow button */}
        <div className="flex justify-center mt-10">
          <Link
            href={instagram.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-3"
          >
            <IconInstagram size={14} strokeWidth={2} />
            FOLLOW {instagram.handle}
          </Link>
        </div>
      </div>
    </section>
  );
}
