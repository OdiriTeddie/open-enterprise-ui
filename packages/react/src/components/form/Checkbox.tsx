import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { getDescribedBy } from "./utils";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  error?: ReactNode;
  hint?: ReactNode;
  label?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({
  className = "",
  disabled = false,
  error,
  hint,
  id,
  label,
  onChange,
  onCheckedChange,
  required = false,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  const hintId = `${checkboxId}-hint`;
  const errorId = `${checkboxId}-error`;

  return (
    <div className="space-y-1.5">
      <label
        className={`flex items-start gap-2 text-sm ${
          disabled ? "text-gray-400" : "text-gray-700"
        }`}
        htmlFor={checkboxId}
      >
        <input
          {...props}
          aria-describedby={getDescribedBy({ error, hint, id: checkboxId })}
          aria-invalid={error ? true : undefined}
          className={`mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 disabled:cursor-not-allowed ${className}`}
          disabled={disabled}
          id={checkboxId}
          required={required}
          type="checkbox"
          onChange={(event) => {
            onChange?.(event);
            onCheckedChange?.(event.target.checked);
          }}
        />
        <span>
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </span>
      </label>
      {hint && !error ? (
        <p className="pl-6 text-sm text-gray-500" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="pl-6 text-sm text-red-600" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
