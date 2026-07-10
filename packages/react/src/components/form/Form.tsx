import type { FormHTMLAttributes, ReactNode } from "react";

export type FormProps = FormHTMLAttributes<HTMLFormElement> & {
  children: ReactNode;
  spacing?: "sm" | "md" | "lg";
};

const spacingClasses: Record<NonNullable<FormProps["spacing"]>, string> = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
};

export function Form({
  children,
  className = "",
  spacing = "md",
  ...props
}: FormProps) {
  return (
    <form {...props} className={`grid ${spacingClasses[spacing]} ${className}`}>
      {children}
    </form>
  );
}
