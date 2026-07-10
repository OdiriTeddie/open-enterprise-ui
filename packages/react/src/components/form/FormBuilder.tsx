import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Checkbox } from "./Checkbox";
import { Form } from "./Form";
import { FormActions } from "./FormActions";
import { FormRow } from "./FormRow";
import { FormSection } from "./FormSection";
import { Input } from "./Input";
import { Select } from "./Select";
import { Textarea } from "./Textarea";
import { useForm } from "./useForm";
import type { FormErrors, FieldValidators, FormValidator } from "./useForm";
import type { SelectOption } from "./types";

export type FormBuilderFieldType =
  | "checkbox"
  | "email"
  | "number"
  | "password"
  | "select"
  | "text"
  | "textarea";

export type FormBuilderField<TValues extends Record<string, unknown>> = {
  disabled?: boolean;
  hidden?: boolean;
  hint?: ReactNode;
  label: ReactNode;
  loadOptions?: (values: TValues) => SelectOption[] | Promise<SelectOption[]>;
  name: keyof TValues;
  options?: SelectOption[];
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  rows?: number;
  type: FormBuilderFieldType;
  visibleWhen?: (values: TValues) => boolean;
};

export type FormBuilderSection<TValues extends Record<string, unknown>> = {
  columns?: 1 | 2 | 3 | 4;
  description?: ReactNode;
  fields: Array<FormBuilderField<TValues>>;
  title?: ReactNode;
};

export type FormBuilderSchema<TValues extends Record<string, unknown>> =
  | Array<FormBuilderField<TValues>>
  | Array<FormBuilderSection<TValues>>;

export type FormBuilderForm<TValues extends Record<string, unknown>> = ReturnType<
  typeof useForm<TValues>
>;

export type FormBuilderProps<TValues extends Record<string, unknown>> = {
  actions?: ReactNode;
  className?: string;
  disabled?: boolean;
  form?: FormBuilderForm<TValues>;
  initialValues: TValues;
  onSubmit?: (values: TValues) => void | Promise<void>;
  readOnly?: boolean;
  resetLabel?: ReactNode;
  schema: FormBuilderSchema<TValues>;
  showReset?: boolean;
  submitLabel?: ReactNode;
  validate?: FormValidator<TValues>;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  validators?: FieldValidators<TValues>;
};

export function FormBuilder<TValues extends Record<string, unknown>>({
  actions,
  className = "",
  disabled = false,
  form: controlledForm,
  initialValues,
  onSubmit,
  readOnly = false,
  resetLabel = "Reset",
  schema,
  showReset = false,
  submitLabel = "Submit",
  validate,
  validateOnBlur,
  validateOnChange,
  validators,
}: FormBuilderProps<TValues>) {
  const internalForm = useForm<TValues>({
    initialValues,
    onSubmit,
    validate,
    validateOnBlur,
    validateOnChange,
    validators,
  });
  const form = controlledForm ?? internalForm;
  const sections = useMemo(() => normalizeSchema(schema), [schema]);
  const [asyncOptions, setAsyncOptions] = useState<Record<string, SelectOption[]>>({});

  useEffect(() => {
    let isCurrent = true;
    const fields = sections.flatMap((section) => section.fields);

    fields.forEach((field) => {
      if (
        field.type !== "select" ||
        !field.loadOptions ||
        !isFieldVisible(field, form.values)
      ) {
        return;
      }

      Promise.resolve(field.loadOptions(form.values)).then((options) => {
        if (!isCurrent) {
          return;
        }

        setAsyncOptions((currentOptions) => ({
          ...currentOptions,
          [String(field.name)]: options,
        }));
      });
    });

    return () => {
      isCurrent = false;
    };
  }, [form.values, sections]);

  return (
    <Form className={className} onSubmit={form.handleSubmit}>
      {form.formError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {form.formError}
        </div>
      ) : null}

      {sections.map((section, sectionIndex) => (
        <FormSection
          key={sectionIndex}
          description={section.description}
          title={section.title}
        >
          <FormRow columns={section.columns ?? 2}>
            {section.fields
              .filter((field) => isFieldVisible(field, form.values))
              .map((field) => (
                <FormBuilderControl
                  key={String(field.name)}
                  asyncOptions={asyncOptions}
                  disabled={disabled}
                  errors={form.errors}
                  field={field}
                  form={form}
                  readOnly={readOnly}
                />
              ))}
          </FormRow>
        </FormSection>
      ))}

      <FormActions>
        {actions ?? (
          <>
            {showReset ? (
              <button
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!form.isDirty || form.isSubmitting || disabled}
                onClick={() => form.reset()}
                type="button"
              >
                {resetLabel}
              </button>
            ) : null}
            <button
              className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={form.isSubmitting || disabled || readOnly}
              type="submit"
            >
              {submitLabel}
            </button>
          </>
        )}
      </FormActions>
    </Form>
  );
}

function FormBuilderControl<TValues extends Record<string, unknown>>({
  asyncOptions,
  disabled,
  errors,
  field,
  form,
  readOnly,
}: {
  asyncOptions: Record<string, SelectOption[]>;
  disabled: boolean;
  errors: FormErrors<TValues>;
  field: FormBuilderField<TValues>;
  form: FormBuilderForm<TValues>;
  readOnly: boolean;
}) {
  const isCheckbox = field.type === "checkbox";
  const isDisabled = disabled || field.disabled || form.isSubmitting || (readOnly && isCheckbox);
  const isReadOnly = !isCheckbox && (readOnly || field.readOnly);
  const commonProps = {
    disabled: isDisabled,
    error: errors[field.name],
    hint: field.hint,
    label: field.label,
    placeholder: field.placeholder,
    readOnly: isReadOnly,
    required: field.required,
  };

  if (isCheckbox) {
    return <Checkbox {...commonProps} {...form.getCheckboxProps(field.name)} disabled={isDisabled} />;
  }

  if (field.type === "select") {
    return (
      <Select
        {...commonProps}
        {...form.getInputProps(field.name)}
        disabled={isDisabled || readOnly}
        options={asyncOptions[String(field.name)] ?? field.options ?? []}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        {...commonProps}
        {...form.getInputProps(field.name)}
        disabled={isDisabled}
        readOnly={isReadOnly}
        rows={field.rows}
      />
    );
  }

  return (
    <Input
      {...commonProps}
      {...form.getInputProps(field.name)}
      disabled={isDisabled}
      readOnly={isReadOnly}
      type={field.type}
    />
  );
}

function isFieldVisible<TValues extends Record<string, unknown>>(
  field: FormBuilderField<TValues>,
  values: TValues,
) {
  if (field.hidden) {
    return false;
  }

  return field.visibleWhen ? field.visibleWhen(values) : true;
}

function normalizeSchema<TValues extends Record<string, unknown>>(
  schema: FormBuilderSchema<TValues>,
): Array<FormBuilderSection<TValues>> {
  if (schema.length === 0) {
    return [];
  }

  if ("fields" in schema[0]) {
    return schema as Array<FormBuilderSection<TValues>>;
  }

  return [
    {
      fields: schema as Array<FormBuilderField<TValues>>,
    },
  ];
}
