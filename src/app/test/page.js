"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/components/analysis-session";
import { BackLink, DiamondArrow, Orbit } from "@/components/chrome";
import { submitProfile, validateField } from "@/lib/skinstric";

export default function ProfilePage() {
  const { profile, saveProfile } = useAnalysis();
  const [step, setStep] = useState("name");
  const [values, setValues] = useState(profile || { name: "", location: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const request = useRef(null);
  const router = useRouter();

  useEffect(() => () => request.current?.abort(), []);

  async function proceed(event) {
    event.preventDefault();
    if (request.current) return;
    const validation = validateField(values[step], step);
    setError(validation);
    if (validation) return;
    if (step === "name") {
      setStep("location");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    try {
      const submitted = {
        name: values.name.trim().normalize("NFC"),
        location: values.location.trim().normalize("NFC"),
      };
      await submitProfile(submitted, controller.signal);
      if (controller.signal.aborted) return;
      saveProfile(submitted);
      router.push("/test/image");
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message);
    } finally {
      request.current = null;
      setPending(false);
    }
  }

  return (
    <>
      <h1 className="pt-3 text-xs font-semibold uppercase">To start analysis</h1>
      <div className="flex flex-1 items-center justify-center py-20">
        <form noValidate onSubmit={proceed} aria-busy={pending} className="relative flex min-h-72 w-full max-w-[420px] flex-col items-center justify-center">
          <Orbit />
          <h2 className="relative mb-6 text-center text-3xl tracking-tight">Let’s start with you</h2>
          <p className="relative mb-5 text-[10px] uppercase text-neutral-500">{step === "name" ? "Click to type" : "One more detail"}</p>
          <label htmlFor={step} className="sr-only">{step === "name" ? "Your name" : "Your location"}</label>
          <input
            key={step}
            id={step}
            name={step}
            type="text"
            autoComplete={step === "name" ? "name" : "address-level2"}
            autoFocus
            maxLength={100}
            value={values[step]}
            disabled={pending}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "profile-error" : "profile-hint"}
            placeholder={step === "name" ? "Introduce yourself" : "Where are you from?"}
            onChange={(event) => {
              setValues({ ...values, [step]: event.target.value });
              setError("");
            }}
            className="relative w-[90%] border-b border-neutral-700 bg-transparent pb-2 text-center text-[clamp(1.5rem,3.4vw,2.5rem)] tracking-tight outline-offset-8 placeholder:text-neutral-800"
          />
          <p id="profile-hint" className="relative mt-5 text-center text-xs text-neutral-500">
            {step === "name" ? "Enter your name to get started." : `Thanks, ${values.name.trim()}. Enter your city or region.`}
          </p>
          {error && (
            <p id="profile-error" role="alert" className="relative mt-4 max-w-xs text-center text-sm text-red-700">{error}</p>
          )}
          <button type="submit" disabled={pending} className="group relative mt-10 flex min-h-11 items-center gap-5 text-xs uppercase">
            {pending ? "Submitting" : "Proceed"}<DiamondArrow />
          </button>
        </form>
      </div>
      <div className="flex items-center justify-between gap-6">
        {step === "name" ? <BackLink href="/" /> : (
          <button
            disabled={pending}
            onClick={() => { setStep("name"); setError(""); }}
            className="group flex min-h-11 items-center gap-5 text-xs uppercase"
          >
            <DiamondArrow back />Back
          </button>
        )}
        <p className="max-w-60 text-right text-[10px] leading-relaxed text-neutral-500">Your name and location are sent to Skinstric when you proceed.</p>
      </div>
    </>
  );
}
