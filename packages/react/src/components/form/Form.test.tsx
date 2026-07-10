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
} from ".";

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

});
