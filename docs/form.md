# Form Primitives

The form primitives provide accessible, reusable controls for enterprise forms. Phase 1 includes `Field`, `Input`, `Textarea`, `Select`, and `Checkbox`.

## Import

```tsx
import {
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
  type SelectOption,
} from "@open-enterprise-ui/react";
```

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
| `Field` | `label`, `hint`, `error`, `required`, `disabled`, `htmlFor`, `id` |
| `Input` | `label`, `hint`, `error`, `onValueChange`, `size`, native input props |
| `Textarea` | `label`, `hint`, `error`, `onValueChange`, native textarea props |
| `Select` | `label`, `hint`, `error`, `options`, `placeholder`, `onValueChange`, native select props |
| `Checkbox` | `label`, `hint`, `error`, `onCheckedChange`, native checkbox props |
