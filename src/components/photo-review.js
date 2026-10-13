"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/components/analysis-session";
import { BackLink, DiamondArrow } from "@/components/chrome";
import { analyzeImage, simulateEstimates } from "@/lib/skinstric";

export default function PhotoReview({ image, onDiscard, discardLabel, backHref }) {
  const { saveResults } = useAnalysis();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(null);
  const router = useRouter();

  useEffect(() => () => request.current?.abort(), []);

  async function analyze() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    try {
      const demographics = await analyzeImage(image, controller.signal);
      if (controller.signal.aborted) return;
      saveResults({ demographics, ...simulateEstimates() });
      onDiscard();
      router.push("/test/analysis");
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message);
    } finally {
      request.current = null;
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="pt-3 text-xs font-semibold uppercase">Review your photo</h1>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10" aria-busy={pending}>
        <div className="relative aspect-[4/5] w-full max-w-72 bg-neutral-100">
          <Image src={image} alt="Your photo, ready for analysis" fill unoptimized className="object-contain" />
        </div>
        <p className="max-w-sm text-center text-xs leading-relaxed text-neutral-500">Your photo will be sent to Skinstric for simulated analysis. It is not saved in this browser.</p>
        {error && <p role="alert" className="max-w-sm text-center text-sm text-red-700">{error}</p>}
        {pending && <p role="status" className="text-xs uppercase">Analyzing your photo</p>}
        <div className="flex flex-wrap items-center justify-center gap-8">
          <button disabled={pending} onClick={onDiscard} className="min-h-11 border-b border-neutral-800 text-xs uppercase">{discardLabel}</button>
          <button disabled={pending} onClick={analyze} className="group flex min-h-11 items-center gap-5 text-xs uppercase">{pending ? "Analyzing" : "Use this photo"}<DiamondArrow /></button>
        </div>
      </div>
      {backHref ? <BackLink href={backHref} /> : (
        <button disabled={pending} onClick={onDiscard} className="group inline-flex min-h-11 items-center gap-5 self-start text-xs uppercase">
          <DiamondArrow back />Back
        </button>
      )}
    </div>
  );
}
