"use client";

import Link from "next/link";
import { SessionRecovery, useAnalysis } from "@/components/analysis-session";
import { BackLink, DiamondArrow } from "@/components/chrome";

// Grid cells are rotated 45°: row 1/col 1 is the top tile, row 2/col 1 left, row 1/col 2 right, row 2/col 2 bottom.
const modules = [
  { id: "demographics", lines: ["Demographics"], href: "/test/results", place: "col-start-1 row-start-1" },
  { id: "concerns", lines: ["Cosmetic", "Concerns"], href: "/test/concerns", place: "col-start-1 row-start-2" },
  { id: "skinType", lines: ["Skin Type", "Details"], href: "/test/skin-type", place: "col-start-2 row-start-1" },
  { id: "weather", lines: ["Weather"], href: "/test/weather", place: "col-start-2 row-start-2" },
];

export default function AnalysisPage() {
  const { profile, results, lastModule, openModule } = useAnalysis();
  if (!profile || !results) return <SessionRecovery needsImage={Boolean(profile)} />;

  return (
    <>
      <h1 className="pt-3 text-base font-semibold uppercase">A.I. analysis</h1>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">A.I. has estimated the following.<br />Fix estimated information if needed.</p>
      <div className="flex flex-1 items-center justify-center py-16 sm:py-20 md:py-36">
        <nav aria-label="Analysis categories" className="analysis-categories relative grid size-40 rotate-45 grid-cols-2 grid-rows-2 gap-1.5 md:size-48">
          <span aria-hidden="true" className="analysis-outline" />
          {modules.map(({ id, lines, href, place }) => {
            const selected = lastModule === id;
            return (
              <Link
                key={id}
                href={href}
                onClick={() => openModule(id)}
                aria-label={lines.join(" ")}
                aria-current={selected ? "true" : undefined}
                className={`flex items-center justify-center transition-colors ${place} ${selected ? "bg-gray-300 shadow-[inset_0_0_0_1px_#1a1b1c]" : "bg-neutral-200/80 hover:bg-gray-300"}`}
              >
                <span className="-rotate-45 text-center text-[10px] leading-snug font-semibold sm:text-xs md:text-[13px]">
                  {lines.map((line) => <span key={line} className="block">{line}</span>)}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center justify-between gap-6"><BackLink href="/test/image" /><Link href="/" className="group flex min-h-11 items-center gap-5 text-xs uppercase">Home<DiamondArrow /></Link></div>
    </>
  );
}
