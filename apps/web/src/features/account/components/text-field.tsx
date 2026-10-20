import type { ComponentProps } from "react";

interface TextFieldProps extends Omit<ComponentProps<"input">, "id"> {
  id: string;
  label: string;
  error?: string;
}

export function TextField({ id, label, error, ...input }: TextFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="eyebrow text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full border-b border-foreground/40 bg-transparent py-2 text-start text-sm outline-none placeholder:text-muted-foreground focus:border-foreground aria-invalid:border-destructive"
        {...input}
      />
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
