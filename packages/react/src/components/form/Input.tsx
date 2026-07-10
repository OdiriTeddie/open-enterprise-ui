import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Field } from "./Field";
import { getDescribedBy } from "./utils";
import type { TextInputSize } from "./types";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  error?: ReactNode;
  hint?: ReactNode;
  label?: ReactNode;
  onValueChange?: (value: string) => void;
  size?: TextInputSize;
};

const sizeClasses: Record<TextInputSize, string> = {
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-3 py-2 text-sm",
};

export function Input({
  className = "",
  disabled = false,
  error,
  hint,
  id,
  label,
  onChange,
  onValueChange,
  required = false,
  size = "md",
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field
      disabled={disabled}
      error={error}
      hint={hint}
      htmlFor={inputId}
      id={inputId}
      label={label}
      required={required}
    >
      <input
        {...props}
        aria-describedby={getDescribedBy({ error, hint, id: inputId })}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-md border bg-white text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${sizeClasses[size]} ${className}`}
        disabled={disabled}
        id={inputId}
        required={required}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.target.value);
        }}
      />
    </Field>
  );
}
