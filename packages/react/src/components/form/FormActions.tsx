import type { HTMLAttributes, ReactNode } from "react";

export type FormActionsProps = HTMLAttributes<HTMLDivElement> & {
  align?: "left" | "right" | "between";
  children: ReactNode;
};

const alignClasses: Record<NonNullable<FormActionsProps["align"]>, string> = {
  between: "justify-between",
  left: "justify-start",
  right: "justify-end",
};

export function FormActions({
  align = "right",
  children,
  className = "",
  ...props
}: FormActionsProps) {
  return (
    <div
      {...props}
      className={`flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4 ${alignClasses[align]} ${className}`}
    >
      {children}
    </div>
  );
}
