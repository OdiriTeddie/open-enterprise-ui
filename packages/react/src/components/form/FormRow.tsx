import type { HTMLAttributes, ReactNode } from "react";

export type FormRowProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
};

const columnClasses: Record<NonNullable<FormRowProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function FormRow({
  children,
  className = "",
  columns = 2,
  ...props
}: FormRowProps) {
  return (
    <div {...props} className={`grid gap-4 ${columnClasses[columns]} ${className}`}>
      {children}
    </div>
  );
}
