import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  headline: string;
  subHeadline?: string;
  align?: "left" | "center" | "right";
  light?: boolean; // true = white text (for dark backgrounds)
  className?: string;
  headlineClassName?: string;
  id?: string;
}

export default function SectionHeading({
  eyebrow,
  headline,
  subHeadline,
  align = "left",
  light = false,
  className,
  headlineClassName,
  id,
}: SectionHeadingProps) {
  const alignClass =
    align === "center"
      ? "text-center items-center"
      : align === "right"
      ? "text-right items-end"
      : "text-left items-start";

  const textColor = light
    ? "text-[var(--color-odessi-white)]"
    : "text-[var(--color-odessi-black)]";

  const subColor = light
    ? "text-[var(--color-odessi-silver)]"
    : "text-[var(--color-odessi-stone)]";

  const dividerColor = light
    ? "bg-[var(--color-odessi-white)]"
    : "bg-[var(--color-odessi-black)]";

  return (
    <div className={cn("flex flex-col gap-3", alignClass, className)}>
      {eyebrow && (
        <p className={cn("type-caption", light ? "text-[var(--color-odessi-silver)]" : "text-[var(--color-odessi-stone)]")}>
          {eyebrow}
        </p>
      )}

      <span className={cn("divider", dividerColor, align === "center" && "mx-auto")} aria-hidden="true" />

      <h2 className={cn("type-h2", textColor, headlineClassName)} id={id}>
        {headline}
      </h2>

      {subHeadline && (
        <p className={cn("type-body max-w-xl mt-1", subColor)}>
          {subHeadline}
        </p>
      )}
    </div>
  );
}
