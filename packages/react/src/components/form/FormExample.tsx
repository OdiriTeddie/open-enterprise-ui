import { useState } from "react";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";
import { Select } from "./Select";
import { Textarea } from "./Textarea";

export function FormExample() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [sendInvite, setSendInvite] = useState(true);

  return (
    <form className="grid max-w-2xl gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
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
    </form>
  );
}
