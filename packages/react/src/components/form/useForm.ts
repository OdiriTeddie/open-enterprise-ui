import { useMemo, useState } from "react";
import type { FormEvent } from "react";

export type FormErrors<TValues> = Partial<Record<keyof TValues, string>>;
export type FormTouched<TValues> = Partial<Record<keyof TValues, boolean>>;
export type FormValidator<TValues> = (values: TValues) => FormErrors<TValues>;
export type FieldValidator<TValues, TKey extends keyof TValues> = (
  value: TValues[TKey],
  values: TValues,
) => string | undefined;
export type FieldValidators<TValues> = Partial<{
  [TKey in keyof TValues]: FieldValidator<TValues, TKey>;
}>;
export type ServerFormError<TValues> = {
  field?: keyof TValues;
  message: string;
};

export type UseFormOptions<TValues extends Record<string, unknown>> = {
  initialValues: TValues;
  onSubmit?: (values: TValues) => void | Promise<void>;
  validate?: FormValidator<TValues>;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  validators?: FieldValidators<TValues>;
};

export function useForm<TValues extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  validate,
  validateOnBlur = false,
  validateOnChange = false,
  validators = {},
}: UseFormOptions<TValues>) {
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrorsState] = useState<FormErrors<TValues>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [touched, setTouched] = useState<FormTouched<TValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(
    () => !formError && Object.keys(errors).length === 0,
    [errors, formError],
  );

  function getValidationErrors(nextValues = values) {
    const formLevelErrors = validate ? validate(nextValues) : {};
    const fieldLevelErrors = getFieldValidationErrors(nextValues, validators);

    return normalizeErrors({
      ...fieldLevelErrors,
      ...formLevelErrors,
    });
  }

  function runValidation(nextValues = values) {
    const nextErrors = getValidationErrors(nextValues);

    setErrorsState(nextErrors);
    return nextErrors;
  }

  function validateField<TKey extends keyof TValues>(name: TKey) {
    const validator = validators[name];
    const nextError = validator ? validator(values[name], values) : undefined;

    setError(name, nextError);
    return nextError;
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
      setErrorsState(getValidationErrors(nextValues));
    }
  }

  function setError<TKey extends keyof TValues>(name: TKey, error?: string) {
    setErrorsState((currentErrors) => {
      const nextErrors = { ...currentErrors };

      if (error) {
        nextErrors[name] = error;
      } else {
        delete nextErrors[name];
      }

      return nextErrors;
    });
  }

  function setErrors(nextErrors: FormErrors<TValues>) {
    setErrorsState(normalizeErrors(nextErrors));
  }

  function clearErrors(names?: Array<keyof TValues>) {
    if (!names) {
      setErrorsState({});
      setFormError(undefined);
      return;
    }

    setErrorsState((currentErrors) => {
      const nextErrors = { ...currentErrors };

      names.forEach((name) => {
        delete nextErrors[name];
      });

      return nextErrors;
    });
  }

  function setServerErrors(serverErrors: Array<ServerFormError<TValues>>) {
    const nextErrors: FormErrors<TValues> = {};
    const formMessages: string[] = [];

    serverErrors.forEach((error) => {
      if (error.field) {
        nextErrors[error.field] = error.message;
      } else {
        formMessages.push(error.message);
      }
    });

    setErrors(nextErrors);
    setFormError(formMessages[0]);
  }

  function setFieldTouched<TKey extends keyof TValues>(
    name: TKey,
    isTouched = true,
  ) {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [name]: isTouched,
    }));

    if (isTouched && validateOnBlur) {
      validateField(name);
    }
  }

  function reset(nextValues = initialValues) {
    setValues(nextValues);
    setErrorsState({});
    setFormError(undefined);
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
    clearErrors,
    errors,
    formError,
    getCheckboxProps,
    getInputProps,
    handleSubmit,
    isSubmitting,
    isValid,
    reset,
    runValidation,
    setError,
    setErrors,
    setFieldTouched,
    setFormError,
    setServerErrors,
    setTouched,
    setValue,
    setValues,
    touched,
    validateField,
    values,
  };
}

function getFieldValidationErrors<TValues extends Record<string, unknown>>(
  values: TValues,
  validators: FieldValidators<TValues>,
) {
  const errors: FormErrors<TValues> = {};

  Object.keys(validators).forEach((name) => {
    const fieldName = name as keyof TValues;
    const validator = validators[fieldName];
    const error = validator?.(values[fieldName], values);

    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
}

function normalizeErrors<TValues>(errors: FormErrors<TValues>) {
  return Object.fromEntries(
    Object.entries(errors).filter(([, error]) => Boolean(error)),
  ) as FormErrors<TValues>;
}
