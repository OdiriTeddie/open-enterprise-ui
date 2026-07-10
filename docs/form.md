# Form Primitives

The form components provide accessible, reusable controls and layout primitives for enterprise forms. The current set includes `Field`, `Input`, `Textarea`, `Select`, `Checkbox`, `Form`, `FormSection`, `FormRow`, and `FormActions`.

## Import

```tsx
import {
  Checkbox,
  Field,
  Form,
  FormActions,
  FormBuilder,
  FormRow,
  FormSection,
  Input,
  Select,
  Textarea,
  useForm,
  type SelectOption,
} from "@open-enterprise-ui/react";
```


## Form Layout

Use the layout components to build consistent enterprise forms without coupling to a form state library.

```tsx
<Form onSubmit={handleSubmit} spacing="lg">
  <FormSection
    title="Profile"
    description="Basic account details and preferences."
  >
    <FormRow columns={2}>
      <Input label="Full name" value={name} onValueChange={setName} />
      <Input label="Email" type="email" value={email} onValueChange={setEmail} />
    </FormRow>

    <Textarea label="Notes" value={notes} onValueChange={setNotes} />
  </FormSection>

  <FormActions>
    <button type="button">Cancel</button>
    <button type="submit">Save</button>
  </FormActions>
</Form>
```

`FormRow` supports `columns={1 | 2 | 3 | 4}` and collapses responsively on smaller screens. `FormActions` supports `align="left"`, `align="right"`, and `align="between"`.

## Input

```tsx
<Input
  label="Full name"
  value={name}
  onValueChange={setName}
  hint="Use the name on the account."
  required
/>
```

`Input` also accepts native input props, including `name`, `type`, `placeholder`, `disabled`, `readOnly`, `value`, `defaultValue`, and `onChange`.

## Textarea

```tsx
<Textarea
  label="Notes"
  value={notes}
  onValueChange={setNotes}
  rows={5}
/>
```

## Select

```tsx
const roleOptions: SelectOption[] = [
  { label: "Admin", value: "admin" },
  { label: "User", value: "user" },
];

<Select
  label="Role"
  options={roleOptions}
  placeholder="Choose role"
  value={role}
  onValueChange={setRole}
/>
```

## Checkbox

```tsx
<Checkbox
  label="Send onboarding email"
  checked={sendEmail}
  onCheckedChange={setSendEmail}
/>
```

## Field

Use `Field` when composing a custom control while keeping consistent label, hint, error, and required rendering.

```tsx
<Field
  htmlFor="custom-field"
  id="custom-field"
  label="Custom field"
  hint="Additional helper text"
  error={errors.customField}
  required
>
  <input id="custom-field" />
</Field>
```

When `error` is present, it replaces the hint and is rendered with `role="alert"`.


## Form State And Validation

`useForm` provides lightweight form state without locking you into a validation library. It manages values, errors, touched state, dirty tracking, reset, validation, server error mapping, and submit handling.

```tsx
type UserFormValues = {
  email: string;
  sendInvite: boolean;
};

const form = useForm<UserFormValues>({
  initialValues: {
    email: "",
    sendInvite: true,
  },
  validate: (values) => ({
    email: values.email ? undefined : "Email is required.",
  }),
  onSubmit: async (values) => {
    await saveUser(values);
  },
});

<Form onSubmit={form.handleSubmit}>
  <Input label="Email" type="email" {...form.getInputProps("email")} />
  <Checkbox label="Send invite" {...form.getCheckboxProps("sendInvite")} />

  <FormActions>
    <button type="button" onClick={() => form.reset()}>
      Reset
    </button>
    <button disabled={form.isSubmitting} type="submit">
      Save
    </button>
  </FormActions>
</Form>
```

`useForm` intentionally stays small. You can still use React Hook Form, Formik, Zod, Valibot, or server-provided errors by passing `error` directly to each primitive.


### Field Validators

Use `validators` for field-level validation and `validateOnBlur` or `validateOnChange` to decide when validation runs.

```tsx
const form = useForm({
  initialValues: { email: "" },
  validateOnBlur: true,
  validators: {
    email: (value) =>
      String(value).includes("@") ? undefined : "Enter a valid email.",
  },
});
```

Use `validate` for whole-form rules that need access to every value.

```tsx
const form = useForm({
  initialValues,
  validate: (values) => ({
    endDate:
      values.endDate > values.startDate
        ? undefined
        : "End date must be after start date.",
  }),
});
```

### Server Errors

Use `setServerErrors` to map API errors back into field errors and a form-level error.

```tsx
form.setServerErrors([
  { field: "email", message: "Email already exists." },
  { message: "Unable to save user." },
]);
```

Use `clearErrors()` to clear everything or `clearErrors(["email"])` to clear specific field errors.
### Dirty Tracking

`useForm` exposes `dirtyFields`, `isDirty`, `defaultValues`, and `markClean()` for enterprise save flows.

```tsx
const form = useForm({
  initialValues: { name: "" },
  onSubmit: async (values) => {
    await saveUser(values);
    form.markClean();
  },
});

<button disabled={!form.isDirty || form.isSubmitting} type="submit">
  Save changes
</button>
```

`reset(nextValues)` updates both the current values and the clean baseline, so reset states stay consistent after loading new server data.



## Schema-Driven Form Builder

Use `FormBuilder` when a form should be generated from configuration. This is useful for admin screens, internal tools, settings pages, and server-defined forms.

```tsx
type UserFormValues = {
  email: string;
  role: string;
  sendInvite: boolean;
};

<FormBuilder<UserFormValues>
  initialValues={{
    email: "",
    role: "",
    sendInvite: true,
  }}
  schema={[
    {
      title: "Profile",
      description: "Basic account details.",
      columns: 2,
      fields: [
        { name: "email", type: "email", label: "Email", required: true },
        {
          name: "role",
          type: "select",
          label: "Role",
          placeholder: "Choose role",
          options: [
            { label: "Admin", value: "admin" },
            { label: "User", value: "user" },
          ],
        },
        { name: "sendInvite", type: "checkbox", label: "Send invite" },
      ],
    },
  ]}
  validators={{
    email: (value) =>
      String(value).includes("@") ? undefined : "Enter a valid email.",
  }}
  onSubmit={saveUser}
/>
```

Supported field types are `text`, `email`, `password`, `number`, `textarea`, `select`, and `checkbox`.
### Enterprise Builder Options

`FormBuilder` includes a few enterprise-focused controls for generated forms:

```tsx
<FormBuilder
  disabled={isSaving}
  readOnly={!canEdit}
  showReset
  resetLabel="Discard changes"
  initialValues={values}
  schema={schema}
  onSubmit={saveUser}
/>
```

- `disabled` disables every generated control and submit action.
- `readOnly` makes text controls read-only and disables selects, checkboxes, and submit.
- `showReset` adds a reset button that is enabled only when the form is dirty.
- `resetLabel` customizes the generated reset action.

Select fields can load options from local or remote data:

```tsx
{
  name: "role",
  type: "select",
  label: "Role",
  placeholder: "Choose role",
  loadOptions: async () => fetchRoles(),
}
```

`loadOptions` receives the current form values, which makes dependent selects possible.

Fields can be hidden or conditionally rendered:

```tsx
{
  name: "inviteNote",
  type: "textarea",
  label: "Invite note",
  visibleWhen: (values) => Boolean(values.sendInvite),
}
```

You can pass an existing `form` returned by `useForm` when you need full control over values, validation, or server errors.

## Validation

Validation is library-agnostic. Pass errors directly from your form state or validation library.

```tsx
<Input
  label="Email"
  type="email"
  value={email}
  onValueChange={setEmail}
  error={errors.email}
/>
```

Each primitive wires:

- label and input association
- `aria-describedby` for hint or error text
- `aria-invalid` when an error is present
- disabled and required states
- native form attributes

## Props

| Component | Important props |
| --- | --- |
| `FormBuilder` | `schema`, `initialValues`, `validators`, `validate`, `onSubmit`, `actions`, `submitLabel`, `disabled`, `readOnly`, `showReset`, `resetLabel` |
| `Form` | `spacing`, native form props |
| `FormSection` | `title`, `description`, native section props |
| `FormRow` | `columns`, native div props |
| `FormActions` | `align`, native div props |
| `useForm` | `initialValues`, `validate`, `validators`, `onSubmit`, `validateOnBlur`, `validateOnChange`, `isDirty`, `dirtyFields`, `markClean`, `setServerErrors`, `clearErrors` |
| `Field` | `label`, `hint`, `error`, `required`, `disabled`, `htmlFor`, `id` |
| `Input` | `label`, `hint`, `error`, `onValueChange`, `size`, native input props |
| `Textarea` | `label`, `hint`, `error`, `onValueChange`, native textarea props |
| `Select` | `label`, `hint`, `error`, `options`, `placeholder`, `onValueChange`, native select props |
| `Checkbox` | `label`, `hint`, `error`, `onCheckedChange`, native checkbox props |



