"use client";

import { useActionState } from "react";
import { masuk } from "./actions";

export function FormMasuk() {
  const [state, action, pending] = useActionState(masuk, undefined);
  const ringkasan = state?.message ?? (state?.errors ? "Periksa kembali isian Anda." : null);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {ringkasan && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-[#FDECEA] px-4 py-3 text-sm text-[#B42318]">
          <span aria-hidden="true">!</span>
          <span>{ringkasan}</span>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold">
          Email <span className="text-[#B42318]">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          aria-invalid={!!state?.errors?.email}
          aria-describedby={state?.errors?.email ? "email-galat" : undefined}
          className="h-11 rounded-[10px] border border-[#CFCBDD] px-3 text-base focus:border-2 focus:border-[#5847C2] focus:outline-none focus:ring-[3px] focus:ring-[#D9D3F7] aria-[invalid=true]:border-2 aria-[invalid=true]:border-[#B42318]"
        />
        {state?.errors?.email && (
          <p id="email-galat" className="text-sm text-[#B42318]">
            {state.errors.email[0]}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="kataSandi" className="text-sm font-semibold">
          Kata sandi <span className="text-[#B42318]">*</span>
        </label>
        <input
          id="kataSandi"
          name="kataSandi"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!state?.errors?.kataSandi}
          aria-describedby={state?.errors?.kataSandi ? "sandi-galat" : undefined}
          className="h-11 rounded-[10px] border border-[#CFCBDD] px-3 text-base focus:border-2 focus:border-[#5847C2] focus:outline-none focus:ring-[3px] focus:ring-[#D9D3F7] aria-[invalid=true]:border-2 aria-[invalid=true]:border-[#B42318]"
        />
        {state?.errors?.kataSandi && (
          <p id="sandi-galat" className="text-sm text-[#B42318]">
            {state.errors.kataSandi[0]}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-[10px] bg-[#5847C2] font-bold text-white hover:bg-[#46379E] focus:outline-none focus:ring-[3px] focus:ring-[#D9D3F7] disabled:bg-[#CFCBDD]"
      >
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
