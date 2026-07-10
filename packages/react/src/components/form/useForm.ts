import { useMemo, useState } from "react";
import type { FormEvent } from "react";

export type FormErrors<TValues> = Partial<Record<keyof TValues, string>>;
export type FormTouched<TValues> = Partial<Record<keyof TValues, boolean>>;
export type FormValidator<TValues> = (values: TValues) => FormErrors<TValues>;

export type UseFormOptions<TValues extends Record<string, unknown>> = {
  initialValues: TValues;
  onSubmit?: (values: TValues) => void | Promise<void>;
  validate?: FormValidator<TValues>;
  validateOnChange?: boolean;
};

export function useForm<TValues extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  validate,
  validateOnChange = false,
}: UseFormOptions<TValues>) {
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<TValues>>({});
  const [touched, setTouched] = useState<FormTouched<TValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  function runValidation(nextValues = values) {
    const nextErrors = validate
      ? normalizeErrors(validate(nextValues))
      : {};

    setErrors(nextErrors);
    return nextErrors;
  }

  function setValue<TKey extends keyof TValues>(
    name: TKey,
    value: TValues[TKey],
  ) {
    const nextValues = {
      ...values,
      [name]: value,
    };

    setValues(nextValues);

    if (validateOnChange) {
      runValidation(nextValues);
    }
  }

  function setError<TKey extends keyof TValues>(name: TKey, error?: string) {
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      if (error) {
        nextErrors[name] = error;
      } else {
        delete nextErrors[name];
      }

      return nextErrors;
    });
  }

  function setFieldTouched<TKey extends keyof TValues>(
    name: TKey,
    isTouched = true,
  ) {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [name]: isTouched,
    }));
  }

  function reset(nextValues = initialValues) {
    setValues(nextValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const nextErrors = runValidation(values);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit?.(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  function getInputProps<TKey extends keyof TValues>(name: TKey) {
    return {
      error: errors[name],
      name: String(name),
      onBlur: () => setFieldTouched(name),
      onValueChange: (value: string) =>
        setValue(name, value as TValues[TKey]),
      value: String(values[name] ?? ""),
    };
  }

  function getCheckboxProps<TKey extends keyof TValues>(name: TKey) {
    return {
      checked: Boolean(values[name]),
      error: errors[name],
      name: String(name),
      onBlur: () => setFieldTouched(name),
      onCheckedChange: (checked: boolean) =>
        setValue(name, checked as TValues[TKey]),
    };
  }

  return {
    errors,
    getCheckboxProps,
    getInputProps,
    handleSubmit,
    isSubmitting,
    isValid,
    reset,
    runValidation,
    setError,
    setFieldTouched,
    setTouched,
    setValue,
    setValues,
    touched,
    values,
  };
}

function normalizeErrors<TValues>(errors: FormErrors<TValues>) {
  return Object.fromEntries(
    Object.entries(errors).filter(([, error]) => Boolean(error)),
  ) as FormErrors<TValues>;
}
