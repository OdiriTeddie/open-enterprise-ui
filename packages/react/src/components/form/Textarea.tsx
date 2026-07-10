import { useId } from "react";
import type { ReactNode, TextareaHTMLAttributes } from "react";
import { Field } from "./Field";
import { getDescribedBy } from "./utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: ReactNode;
  hint?: ReactNode;
  label?: ReactNode;
  onValueChange?: (value: string) => void;
};

export function Textarea({
  className = "",
  disabled = false,
  error,
  hint,
  id,
  label,
  onChange,
  onValueChange,
  required = false,
  rows = 4,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <Field
      disabled={disabled}
      error={error}
      hint={hint}
      htmlFor={textareaId}
      id={textareaId}
      label={label}
      required={required}
    >
      <textarea
        {...props}
        aria-describedby={getDescribedBy({ error, hint, id: textareaId })}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
        disabled={disabled}
        id={textareaId}
        required={required}
        rows={rows}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.target.value);
        }}
      />
    </Field>
  );
}
