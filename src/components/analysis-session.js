"use client";

import Link from "next/link";
import { createContext, useContext, useState } from "react";

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [session, setSession] = useState({
    profile: null,
    demographics: null,
    selections: {},
  });

  return (
    <AnalysisContext.Provider
      value={{
        ...session,
        saveProfile(profile) {
          setSession({ profile, demographics: null, selections: {} });
        },
        saveDemographics(demographics) {
          setSession((previous) => ({ ...previous, demographics, selections: {} }));
        },
        selectAttribute(category, label) {
          setSession((previous) => ({
            ...previous,
            selections: { ...previous.selections, [category]: label },
          }));
        },
        resetSelections() {
          setSession((previous) => ({ ...previous, selections: {} }));
        },
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const session = useContext(AnalysisContext);
  if (!session) throw new Error("Analysis must be used within its session provider.");
  return session;
}

export function SessionRecovery({ needsImage = false }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl tracking-tight">
        {needsImage ? "Start with a photo" : "Let’s start with you"}
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
        Your session stays in memory. {needsImage
          ? "Upload a photo or take a selfie to see your results."
          : "Enter your details to begin the test."}
      </p>
      <Link href={needsImage ? "/test/image" : "/test"} className="border border-neutral-900 px-6 py-3 text-xs uppercase">
        {needsImage ? "Choose a photo" : "Start test"}
      </Link>
    </div>
  );
}
