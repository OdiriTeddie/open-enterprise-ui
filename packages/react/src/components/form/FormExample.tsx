import { Checkbox } from "./Checkbox";
import { Form } from "./Form";
import { FormActions } from "./FormActions";
import { FormBuilder } from "./FormBuilder";
import { FormRow } from "./FormRow";
import { FormSection } from "./FormSection";
import { Input } from "./Input";
import { Select } from "./Select";
import { Textarea } from "./Textarea";
import { useForm } from "./useForm";

type UserFormValues = {
  name: string;
  notes: string;
  role: string;
  sendInvite: boolean;
};

export function FormExample() {
  const form = useForm<UserFormValues>({
    initialValues: {
      name: "",
      notes: "",
      role: "",
      sendInvite: true,
    },
    validate: (values) => ({
      name: values.name.trim() ? undefined : "Full name is required.",
      role: values.role ? undefined : "Choose a role.",
    }),
  });

  return (
    <div className="grid gap-6">
      <Form
        className="max-w-2xl rounded-lg border border-gray-200 bg-white p-4"
        onSubmit={form.handleSubmit}
      >
        <FormSection
          description="Create a user record with form state and validation."
          title="User profile"
        >
          <FormRow columns={2}>
            <Input
              label="Full name"
              placeholder="Ada Lovelace"
              required
              {...form.getInputProps("name")}
            />
            <Select
              label="Role"
              options={[
                { label: "Admin", value: "admin" },
                { label: "Analyst", value: "analyst" },
                { label: "Engineer", value: "engineer" },
              ]}
              placeholder="Choose role"
              {...form.getInputProps("role")}
            />
          </FormRow>
          <Textarea
            hint="Optional internal note for the account."
            label="Notes"
            {...form.getInputProps("notes")}
          />
          <Checkbox
            label="Send onboarding email"
            {...form.getCheckboxProps("sendInvite")}
          />
        </FormSection>

        <FormActions>
          <button
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
            type="button"
            onClick={() => form.reset()}
          >
            Reset
          </button>
          <button
            className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={form.isSubmitting}
            type="submit"
          >
            {form.isSubmitting ? "Saving..." : "Save user"}
          </button>
        </FormActions>
      </Form>

      <FormBuilder
        className="max-w-2xl rounded-lg border border-gray-200 bg-white p-4"
        initialValues={{
          email: "",
          role: "",
          sendInvite: true,
        }}
        schema={[
          {
            title: "Schema-driven form",
            description: "The same primitives rendered from configuration.",
            fields: [
              { label: "Email", name: "email", required: true, type: "email" },
              {
                label: "Role",
                name: "role",
                options: [
                  { label: "Admin", value: "admin" },
                  { label: "Analyst", value: "analyst" },
                  { label: "Engineer", value: "engineer" },
                ],
                placeholder: "Choose role",
                type: "select",
              },
              { label: "Send invite", name: "sendInvite", type: "checkbox" },
            ],
          },
        ]}
        submitLabel="Create user"
        validators={{
          email: (value) =>
            String(value).includes("@") ? undefined : "Enter a valid email.",
        }}
      />
    </div>
  );
}
