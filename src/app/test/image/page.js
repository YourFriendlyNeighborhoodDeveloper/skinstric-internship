"use client";

import Link from "next/link";
import { Camera, ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SessionRecovery, useAnalysis } from "@/components/analysis-session";
import { BackLink, DiamondLayers } from "@/components/chrome";
import PhotoReview from "@/components/photo-review";
import { prepareImage } from "@/lib/image";

export default function ImagePage() {
  const { profile } = useAnalysis();
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [preparing, setPreparing] = useState(false);
  const input = useRef(null);
  const revision = useRef(0);

  useEffect(() => () => {
    revision.current += 1;
    setImage("");
    setPreparing(false);
  }, []);

  async function choosePhoto(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    const current = ++revision.current;
    setPreparing(true);
    setError("");
    try {
      const prepared = await prepareImage(file);
      if (current === revision.current) setImage(prepared);
    } catch (failure) {
      if (current === revision.current) setError(failure.message);
    } finally {
      if (current === revision.current) setPreparing(false);
    }
  }

  if (!profile) return <SessionRecovery />;
  if (image) return <PhotoReview image={image} onDiscard={() => setImage("")} discardLabel="Choose another photo" />;

  return (
    <>
      <h1 className="pt-3 text-xs font-semibold uppercase">To start analysis</h1>
      <div className="flex flex-1 flex-col items-center justify-center py-8 md:py-12">
        <div className="grid w-full max-w-5xl grid-cols-1 justify-items-center gap-4 md:grid-cols-2">
          <Link href="/test/camera" className="scan-option group">
            <DiamondLayers />
            <span className="scan-icon"><Camera aria-hidden="true" strokeWidth={1.75} /></span>
            <span className="scan-label">Allow A.I.<br /> to scan your face</span>
          </Link>
          <div className="relative">
            <button disabled={preparing} onClick={() => input.current.click()} className="scan-option scan-option-gallery group">
              <DiamondLayers />
              <span className="scan-icon"><ImageIcon aria-hidden="true" strokeWidth={1.75} /></span>
              <span className="scan-label">{preparing ? "Preparing your photo" : <>Allow A.I.<br /> access gallery</>}</span>
            </button>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload photo" className="sr-only" tabIndex={-1} disabled={preparing} onChange={choosePhoto} />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-neutral-500">Choose a photo or take a selfie. JPEG, PNG, or WebP, up to 10 MB.</p>
        {preparing && <p role="status" className="mt-4 text-xs">Preparing your photo</p>}
        {error && <p role="alert" className="mt-4 max-w-sm text-center text-sm text-red-700">{error}</p>}
      </div>
      <BackLink href="/test" />
    </>
  );
}
