import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Checkbox,
  Field,
  Form,
  FormBuilder,
  FormActions,
  FormRow,
  FormSection,
  Input,
  Select,
  Textarea,
  useForm,
} from ".";
import type { FormBuilderField } from ".";


function UseFormHarness({ onSubmit }: { onSubmit: (values: { name: string; sendInvite: boolean }) => void }) {
  const form = useForm({
    initialValues: {
      name: "",
      sendInvite: false,
    },
    onSubmit,
    validate: (values) => ({
      name: values.name.trim() ? undefined : "Name is required",
    }),
  });

  return (
    <Form aria-label="Hook form" onSubmit={form.handleSubmit}>
      <Input label="Name" {...form.getInputProps("name")} />
      <Checkbox label="Send invite" {...form.getCheckboxProps("sendInvite")} />
      <button type="button" onClick={() => form.reset()}>
        Reset
      </button>
      <button type="submit">Save</button>
    </Form>
  );
}


function ValidationModelHarness() {
  const form = useForm({
    initialValues: {
      email: "",
    },
    validateOnBlur: true,
    validators: {
      email: (value) => (String(value).includes("@") ? undefined : "Invalid email"),
    },
  });

  return (
    <Form aria-label="Validation form">
      {form.formError ? <div role="alert">{form.formError}</div> : null}
      <Input label="Email" {...form.getInputProps("email")} />
      <button
        type="button"
        onClick={() =>
          form.setServerErrors([
            { field: "email", message: "Email already exists" },
            { message: "Unable to save user" },
          ])
        }
      >
        Apply server errors
      </button>
      <button type="button" onClick={() => form.clearErrors(["email"])}>
        Clear email error
      </button>
      <button type="button" onClick={() => form.clearErrors()}>
        Clear all errors
      </button>
    </Form>
  );
}

describe("form primitives", () => {
  it("renders a standalone field with label, hint, and error", () => {
    render(
      <Field
        error="Email is required"
        hint="Use a work email"
        htmlFor="email"
        id="email"
        label="Email"
        required
      >
        <input id="email" />
      </Field>,
    );

    expect(screen.getByLabelText("Email *")).toBeInTheDocument();
    expect(screen.queryByText("Use a work email")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });

  it("wires Input label, hint, error, and value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Input
        error="Name is required"
        hint="Your legal name"
        label="Full name"
        onValueChange={onValueChange}
      />,
    );

    const input = screen.getByLabelText("Full name");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");

    await user.type(input, "Ada");

    expect(onValueChange).toHaveBeenLastCalledWith("Ada");
  });

  it("wires Textarea value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<Textarea label="Bio" onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText("Bio"), "Notes");

    expect(onValueChange).toHaveBeenLastCalledWith("Notes");
  });

  it("renders Select options and value changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Select
        label="Role"
        onValueChange={onValueChange}
        options={[
          { label: "Admin", value: "admin" },
          { label: "User", value: "user" },
        ]}
        placeholder="Choose role"
      />,
    );

    await user.selectOptions(screen.getByLabelText("Role"), "admin");

    expect(onValueChange).toHaveBeenCalledWith("admin");
  });

  it("wires Checkbox checked changes and error state", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <Checkbox
        error="Accept the terms"
        label="Accept terms"
        onCheckedChange={onCheckedChange}
      />,
    );

    const checkbox = screen.getByLabelText("Accept terms");

    expect(checkbox).toHaveAttribute("aria-invalid", "true");

    await user.click(checkbox);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("renders form layout components", () => {
    render(
      <Form aria-label="User form" spacing="lg">
        <FormSection description="Profile details" title="Profile">
          <FormRow columns={3} data-testid="form-row">
            <Input label="First name" />
            <Input label="Last name" />
            <Input label="Email" />
          </FormRow>
        </FormSection>
        <FormActions align="between" data-testid="form-actions">
          <button type="button">Cancel</button>
          <button type="submit">Save</button>
        </FormActions>
      </Form>,
    );

    expect(screen.getByRole("form", { name: "User form" })).toHaveClass(
      "gap-6",
    );
    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("Profile details")).toBeInTheDocument();
    expect(screen.getByTestId("form-row")).toHaveClass("lg:grid-cols-3");
    expect(screen.getByTestId("form-actions")).toHaveClass("justify-between");
  });


  it("manages values, validation, submit, and reset with useForm", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UseFormHarness onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");

    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.click(screen.getByLabelText("Send invite"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Ada",
      sendInvite: true,
    });

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Send invite")).not.toBeChecked();
  });


  it("supports field validators, server errors, and clearing errors", async () => {
    const user = userEvent.setup();

    render(<ValidationModelHarness />);

    await user.click(screen.getByLabelText("Email"));
    await user.tab();

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");

    await user.click(screen.getByRole("button", { name: "Apply server errors" }));

    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "Unable to save user",
    );
    expect(screen.getAllByRole("alert")[1]).toHaveTextContent(
      "Email already exists",
    );

    await user.click(screen.getByRole("button", { name: "Clear email error" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to save user");

    await user.click(screen.getByRole("button", { name: "Clear all errors" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });


  it("renders and submits a schema-driven form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <FormBuilder
        initialValues={{
          name: "",
          role: "",
          sendInvite: false,
        }}
        schema={[
          {
            title: "Profile",
            fields: [
              { label: "Name", name: "name", required: true, type: "text" },
              {
                label: "Role",
                name: "role",
                options: [{ label: "Admin", value: "admin" }],
                type: "select",
              },
              { label: "Send invite", name: "sendInvite", type: "checkbox" },
            ],
          },
        ]}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Name *"), "Ada");
    await user.selectOptions(screen.getByLabelText("Role"), "admin");
    await user.click(screen.getByLabelText("Send invite"));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Ada",
      role: "admin",
      sendInvite: true,
    });
  });

  it("validates and conditionally renders schema fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <FormBuilder
        initialValues={{
          email: "",
          inviteNote: "",
          sendInvite: false,
        }}
        schema={[
          { label: "Email", name: "email", type: "email" },
          { label: "Send invite", name: "sendInvite", type: "checkbox" },
          {
            label: "Invite note",
            name: "inviteNote",
            type: "textarea",
            visibleWhen: (values) => Boolean(values.sendInvite),
          },
        ]}
        validators={{
          email: (value) => (String(value).includes("@") ? undefined : "Invalid email"),
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.queryByLabelText("Invite note")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Send invite"));

    expect(screen.getByLabelText("Invite note")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
  });
  it("tracks dirty fields and resets the clean baseline", async () => {
    const user = userEvent.setup();

    function DirtyStateHarness() {
      const form = useForm({
        initialValues: {
          name: "Ada",
        },
      });

      return (
        <Form aria-label="Dirty state form">
          <Input label="Name" {...form.getInputProps("name")} />
          <div data-testid="is-dirty">{String(form.isDirty)}</div>
          <div data-testid="name-dirty">{String(Boolean(form.dirtyFields.name))}</div>
          <button type="button" onClick={() => form.reset({ name: "Grace" })}>
            Reset to Grace
          </button>
          <button type="button" onClick={() => form.markClean()}>
            Mark clean
          </button>
        </Form>
      );
    }

    render(<DirtyStateHarness />);

    expect(screen.getByTestId("is-dirty")).toHaveTextContent("false");

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Grace");

    expect(screen.getByTestId("is-dirty")).toHaveTextContent("true");
    expect(screen.getByTestId("name-dirty")).toHaveTextContent("true");

    await user.click(screen.getByRole("button", { name: "Mark clean" }));

    expect(screen.getByTestId("is-dirty")).toHaveTextContent("false");

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Katherine");
    await user.click(screen.getByRole("button", { name: "Reset to Grace" }));

    expect(screen.getByLabelText("Name")).toHaveValue("Grace");
    expect(screen.getByTestId("is-dirty")).toHaveTextContent("false");
  });

  it("supports builder-level disabled and read-only form states", () => {
    const schema: Array<FormBuilderField<{ name: string; role: string; sendInvite: boolean }>> = [
      { label: "Name", name: "name", type: "text" as const },
      {
        label: "Role",
        name: "role",
        options: [{ label: "Admin", value: "admin" }],
        type: "select" as const,
      },
      { label: "Send invite", name: "sendInvite", type: "checkbox" as const },
    ];

    const { rerender } = render(
      <FormBuilder
        disabled
        initialValues={{ name: "Ada", role: "", sendInvite: false }}
        schema={schema}
      />,
    );

    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("Role")).toBeDisabled();
    expect(screen.getByLabelText("Send invite")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();

    rerender(
      <FormBuilder
        readOnly
        initialValues={{ name: "Ada", role: "", sendInvite: false }}
        schema={schema}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Role")).toBeDisabled();
    expect(screen.getByLabelText("Send invite")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  it("loads select options asynchronously in FormBuilder", async () => {
    render(
      <FormBuilder
        initialValues={{ role: "" }}
        schema={[
          {
            label: "Role",
            loadOptions: async () => [{ label: "Admin", value: "admin" }],
            name: "role",
            placeholder: "Choose role",
            type: "select",
          },
        ]}
      />,
    );

    expect(await screen.findByRole("option", { name: "Admin" })).toBeInTheDocument();
  });

  it("can render a default reset action in FormBuilder", async () => {
    const user = userEvent.setup();

    render(
      <FormBuilder
        initialValues={{ name: "Ada" }}
        schema={[{ label: "Name", name: "name", type: "text" }]}
        showReset
      />,
    );

    const resetButton = screen.getByRole("button", { name: "Reset" });

    expect(resetButton).toBeDisabled();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Grace");

    expect(resetButton).toBeEnabled();

    await user.click(resetButton);

    expect(screen.getByLabelText("Name")).toHaveValue("Ada");
    expect(resetButton).toBeDisabled();
  });

});



