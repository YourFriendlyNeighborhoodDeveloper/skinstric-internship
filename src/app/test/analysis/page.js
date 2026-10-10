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
        <div className="relative flex size-60 items-center justify-center md:size-80">
          <Orbit />
          <Link href="/test/results" className="group relative flex size-44 rotate-45 items-center justify-center bg-neutral-200 transition-colors hover:bg-neutral-300 md:size-56"><span className="-rotate-45 text-sm font-semibold uppercase">Demographics</span></Link>
        </div>
      </div>
      <p className="mb-8 text-center text-xs text-neutral-500">Randomized demo predictions. Select what reflects you.</p>
      <div className="flex items-center justify-between gap-6"><BackLink href="/test/image" /><Link href="/test/results" className="group flex min-h-11 items-center gap-5 text-xs uppercase">Get summary<DiamondArrow /></Link></div>
    </>
  );
}
