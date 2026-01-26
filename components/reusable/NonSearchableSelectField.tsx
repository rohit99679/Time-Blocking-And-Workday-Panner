"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field } from "./Field";
import { NonSearchableSelect } from "./NonSearchableSelect";

type NonSearchableSelectFieldProps =
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    name: string;
    label: string;
    required?: boolean;
    options: { value: any; label: string }[];
    disabled?: boolean;
  };

export const NonSearchableSelectField = ({
  name,
  label,
  required,
  options = [],
  disabled = false,
}: NonSearchableSelectFieldProps) => {
  const form = useFormContext();

  return (
    <Field name={name} label={label} required={required}>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <NonSearchableSelect
            options={options}
            value={field.value}
            onValueChange={field.onChange}
            placeholder={`Select ${label}`}
            disabled={disabled}
          />
        )}
      />
    </Field>
  );
};
