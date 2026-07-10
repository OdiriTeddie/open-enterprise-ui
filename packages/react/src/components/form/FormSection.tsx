import type { HTMLAttributes, ReactNode } from "react";

export type FormSectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  description?: ReactNode;
  title?: ReactNode;
};

export function FormSection({
  children,
  className = "",
  description,
  title,
  ...props
}: FormSectionProps) {
  return (
    <section {...props} className={`grid gap-4 ${className}`}>
      {title || description ? (
        <div className="grid gap-1 border-b border-gray-200 pb-3">
          {title ? (
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm text-gray-500">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-4">{children}</div>
    </section>
  );
}
