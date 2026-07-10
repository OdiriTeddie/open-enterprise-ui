import { useState } from "react";
import { Checkbox } from "./Checkbox";
import { Form } from "./Form";
import { FormActions } from "./FormActions";
import { FormRow } from "./FormRow";
import { FormSection } from "./FormSection";
import { Input } from "./Input";
import { Select } from "./Select";
import { Textarea } from "./Textarea";

export function FormExample() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [sendInvite, setSendInvite] = useState(true);

  return (
    <Form className="max-w-2xl rounded-lg border border-gray-200 bg-white p-4">
      <FormSection
        description="Create a user record with the first set of form primitives."
        title="User profile"
      >
        <FormRow columns={2}>
          <Input
            label="Full name"
            placeholder="Ada Lovelace"
            value={name}
            onValueChange={setName}
            required
          />
          <Select
            label="Role"
            options={[
              { label: "Admin", value: "admin" },
              { label: "Analyst", value: "analyst" },
              { label: "Engineer", value: "engineer" },
            ]}
            placeholder="Choose role"
            value={role}
            onValueChange={setRole}
          />
        </FormRow>
        <Textarea
          hint="Optional internal note for the account."
          label="Notes"
          value={notes}
          onValueChange={setNotes}
        />
        <Checkbox
          checked={sendInvite}
          label="Send onboarding email"
          onCheckedChange={setSendInvite}
        />
      </FormSection>

      <FormActions>
        <button
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
          type="button"
        >
          Cancel
        </button>
        <button
          className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
          type="submit"
        >
          Save user
        </button>
      </FormActions>
    </Form>
  );
}
