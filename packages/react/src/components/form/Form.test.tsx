import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Checkbox,
  Field,
  Form,
  FormActions,
  FormRow,
  FormSection,
  Input,
  Select,
  Textarea,
  useForm,
} from ".";


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

});
