import type { ReactNode } from "react";

export type FieldProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  error?: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  id?: string;
  label?: ReactNode;
  required?: boolean;
};

export type TextInputSize = "sm" | "md";

export type SelectOption = {
  disabled?: boolean;
  label: ReactNode;
  value: string;
};
