"use client";

import { AlertCircle, KeyRound, LogIn, Mail } from "lucide-react";
import { useActionState } from "react";
import { masuk } from "./actions";

const input =
  "h-12 w-full rounded-xl border border-line-strong bg-surface pl-12 pr-4 text-base text-ink placeholder:text-ink-mute focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-error aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-error-50";

export function FormMasuk() {
  const [state, action, pending] = useActionState(masuk, undefined);
  const ringkasan = state?.message ?? (state?.errors ? "Periksa kembali isian Anda." : null);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {ringkasan && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-error-50 px-4 py-3 text-sm font-medium text-error">
          <AlertCircle size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{ringkasan}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-bold text-ink">
          Email <span className="text-error">*</span>
        </label>
        <div className="relative">
          <Mail size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="nama@instansi.go.id"
            aria-invalid={!!state?.errors?.email}
            aria-describedby={state?.errors?.email ? "email-galat" : undefined}
            className={input}
          />
        </div>
        {state?.errors?.email && (
          <p id="email-galat" className="flex items-center gap-2 text-sm font-medium text-error">
            <AlertCircle size={16} aria-hidden="true" />
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="kataSandi" className="text-sm font-bold text-ink">
          Kata sandi <span className="text-error">*</span>
        </label>
        <div className="relative">
          <KeyRound size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input
            id="kataSandi"
            name="kataSandi"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!state?.errors?.kataSandi}
            aria-describedby={state?.errors?.kataSandi ? "sandi-galat" : undefined}
            className={input}
          />
        </div>
        {state?.errors?.kataSandi && (
          <p id="sandi-galat" className="flex items-center gap-2 text-sm font-medium text-error">
            <AlertCircle size={16} aria-hidden="true" />
            {state.errors.kataSandi[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-13 min-h-[3.25rem] items-center justify-center gap-2 rounded-xl bg-magenta-600 px-6 text-base font-bold text-white shadow-card transition-colors hover:bg-magenta-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-magenta-100 disabled:bg-line-strong disabled:shadow-none"
      >
        <LogIn size={20} aria-hidden="true" />
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
