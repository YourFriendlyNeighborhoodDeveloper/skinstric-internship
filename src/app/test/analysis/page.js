"use client";

import Link from "next/link";
import { SessionRecovery, useAnalysis } from "@/components/analysis-session";
import { BackLink, DiamondArrow, Orbit } from "@/components/chrome";

export default function AnalysisPage() {
  const { profile, demographics } = useAnalysis();
  if (!profile || !demographics) return <SessionRecovery needsImage={Boolean(profile)} />;

  return (
    <>
      <h1 className="pt-3 text-xs font-semibold uppercase">A.I. analysis</h1>
      <p className="mt-3 max-w-sm text-xs leading-relaxed uppercase">Your analysis is complete.<br />Explore your demographic results and select your actual attributes.</p>
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="relative flex size-64 items-center justify-center md:size-96">
          <Orbit />
          <nav aria-label="Analysis categories" className="analysis-categories relative grid size-44 rotate-45 grid-cols-2 grid-rows-2 gap-2 md:size-64">
            <Link href="/test/results" className="flex items-center justify-center bg-neutral-200 transition-colors hover:bg-neutral-300"><span className="-rotate-45 text-[10px] font-semibold uppercase md:text-sm">Demographics</span></Link>
            <button type="button" disabled aria-label="Cosmetic Concerns (unavailable)" className="flex items-center justify-center bg-neutral-100 text-neutral-600">
              <span className="-rotate-45 text-center text-[10px] font-semibold uppercase md:text-xs">Cosmetic<br />Concerns<span className="mt-1 block text-[8px] font-normal normal-case">Unavailable</span></span>
            </button>
            <button type="button" disabled aria-label="Skin Type Details (unavailable)" className="flex items-center justify-center bg-neutral-100 text-neutral-600">
              <span className="-rotate-45 text-center text-[10px] font-semibold uppercase md:text-xs">Skin Type<br />Details<span className="mt-1 block text-[8px] font-normal normal-case">Unavailable</span></span>
            </button>
            <button type="button" disabled aria-label="Weather (unavailable)" className="flex items-center justify-center bg-neutral-100 text-neutral-600">
              <span className="-rotate-45 text-center text-[10px] font-semibold uppercase md:text-xs">Weather<span className="mt-1 block text-[8px] font-normal normal-case">Unavailable</span></span>
            </button>
          </nav>
        </div>
      </div>
      <p className="mb-8 text-center text-xs text-neutral-500">Randomized demo predictions. Select what reflects you.</p>
      <div className="flex items-center justify-between gap-6"><BackLink href="/test/image" /><Link href="/test/results" className="group flex min-h-11 items-center gap-5 text-xs uppercase">Get summary<DiamondArrow /></Link></div>
    </>
  );
}
