"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { adminLabels } from "@/lib/admin/labels";

import { loginAction, type LoginResult } from "../actions";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    let result: LoginResult;
    try {
      result = await loginAction(formData);
    } catch {
      result = { status: "error", message: adminLabels.common.error };
    }

    if (result.status === "success") {
      router.replace("/admin");
      router.refresh();
      return;
    }

    setPending(false);
    setError(result.message);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/45 bg-danger/10 px-4 py-3 text-sm text-[#eba295]"
        >
          {error}
        </p>
      ) : null}

      <Field id="login-email" label={adminLabels.auth.email} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="email"
            type="email"
            autoComplete="username"
            required
            autoFocus
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <Field id="login-password" label={adminLabels.auth.password} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? (
          <>
            <Spinner />
            {adminLabels.auth.submitting}
          </>
        ) : (
          <>
            <LogIn aria-hidden="true" />
            {adminLabels.auth.submit}
          </>
        )}
      </Button>
    </form>
  );
}