import { useId } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { Field } from "./Field";
import { getDescribedBy } from "./utils";
import type { SelectOption } from "./types";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: ReactNode;
  hint?: ReactNode;
  label?: ReactNode;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
};

export function Select({
  className = "",
  disabled = false,
  error,
  hint,
  id,
  label,
  onChange,
  onValueChange,
  options,
  placeholder,
  required = false,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field
      disabled={disabled}
      error={error}
      hint={hint}
      htmlFor={selectId}
      id={selectId}
      label={label}
      required={required}
    >
      <select
        {...props}
        aria-describedby={getDescribedBy({ error, hint, id: selectId })}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
        disabled={disabled}
        id={selectId}
        required={required}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.target.value);
        }}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option
            key={option.value}
            disabled={option.disabled}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
