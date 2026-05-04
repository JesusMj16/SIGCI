import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  action,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-2xl bg-secondary/10 p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-2xl font-semibold text-secondary">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-primary">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
