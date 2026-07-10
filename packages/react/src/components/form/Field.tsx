import type { FieldProps } from "./types";

export function Field({
  children,
  className = "",
  disabled = false,
  error,
  hint,
  htmlFor,
  id,
  label,
  required = false,
}: FieldProps) {
  const hintId = id ? `${id}-hint` : undefined;
  const errorId = id ? `${id}-error` : undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label ? (
        <label
          className={`block text-sm font-medium ${
            disabled ? "text-gray-400" : "text-gray-700"
          }`}
          htmlFor={htmlFor}
        >
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? (
        <p className="text-sm text-gray-500" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

