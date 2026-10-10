"use client";

import { useState } from "react";
import { SessionRecovery, useAnalysis } from "@/components/analysis-session";
import { BackLink } from "@/components/chrome";
import { formatConfidence } from "@/lib/skinstric";

export default function ResultsPage() {
  const { profile, demographics, selections, selectAttribute, resetSelections } = useAnalysis();
  const [category, setCategory] = useState("race");
  if (!profile || !demographics) return <SessionRecovery needsImage={Boolean(profile)} />;

  const scores = demographics[category];
  const selected = selections[category] || scores[0].label;
  const current = scores.find((score) => score.label === selected);

  return (
    <>
      <p className="pt-3 text-xs font-semibold uppercase">A.I. analysis</p>
      <h1 className="mt-4 text-[clamp(2.4rem,5vw,4.5rem)] leading-none tracking-[-0.055em] uppercase">Demographics</h1>
      <p className="mt-4 text-xs uppercase">Predicted {category}. Select your actual attribute.</p>
      <div className="mt-10 grid flex-1 items-start gap-4 lg:grid-cols-[190px_minmax(0,1fr)_minmax(260px,0.65fr)]">
        <nav aria-label="Demographic categories" className="grid grid-cols-3 gap-2 lg:grid-cols-1">
          {["race", "age", "gender"].map((item) => (
            <button key={item} aria-current={item === category ? "true" : undefined} onClick={() => setCategory(item)} className={`flex min-h-24 flex-col items-start justify-between gap-4 border-t border-neutral-900 p-3 text-left transition-colors lg:min-h-28 ${item === category ? "bg-neutral-900 text-white" : "bg-neutral-100 hover:bg-neutral-200"}`}>
              <span className="break-words text-base capitalize lg:text-xl">{selections[item] || demographics[item][0].label}</span>
              <span className="text-[10px] uppercase">{item}</span>
            </button>
          ))}
        </nav>
        <section aria-label={`${category} confidence`} className="flex min-h-[360px] flex-col justify-between border-t border-neutral-900 bg-neutral-100 p-5 md:min-h-[460px] md:p-7">
          <div><h2 className="text-3xl tracking-tight capitalize md:text-4xl">{selected}</h2><p className="mt-2 text-xs text-neutral-500">{selections[category] ? "Your selection" : "Highest simulated prediction"}</p></div>
          <div className="confidence-ring relative my-8 flex size-52 items-center justify-center self-center rounded-full md:size-64" style={{ "--confidence": `${current.confidence * 100}%` }}>
            <div className="absolute inset-[3px] rounded-full bg-neutral-100" />
            <span className="relative text-4xl tracking-tight tabular-nums md:text-5xl">{formatConfidence(current.confidence)}</span>
          </div>
          <p className="text-xs uppercase text-neutral-500">Simulated confidence</p>
        </section>
        <section aria-label={`${category} scores`} className="border-t border-neutral-900 bg-neutral-100 p-4 md:p-5">
          <div className="mb-4 flex justify-between gap-4 text-xs uppercase"><h2>{category}</h2><span>A.I. confidence</span></div>
          <div role="radiogroup" aria-label={`Select your ${category}`} className="flex flex-col">
            {scores.map((score) => (
              <label key={score.label} className={`flex min-h-12 cursor-pointer items-center gap-3 px-3 py-3 transition-colors ${score.label === selected ? "bg-neutral-900 text-white" : "hover:bg-neutral-200"}`}>
                <input type="radio" name={category} value={score.label} checked={score.label === selected} onChange={() => selectAttribute(category, score.label)} className="size-3 shrink-0 accent-current" />
                <span className="text-sm capitalize">{score.label}</span>
                <span className="ml-auto text-xs tabular-nums">{formatConfidence(score.confidence)}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
      <p className="my-8 text-center text-xs leading-relaxed text-neutral-500">These results are randomized simulations, not verified medical or biometric measurements.</p>
      <div className="flex flex-wrap items-center justify-between gap-6"><BackLink href="/test/analysis" /><button onClick={resetSelections} disabled={!Object.keys(selections).length} className="min-h-11 border border-neutral-900 px-5 py-3 text-xs uppercase">Reset selections</button></div>
    </>
  );
}
