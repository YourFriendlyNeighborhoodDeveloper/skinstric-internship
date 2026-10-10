"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { SessionRecovery, useAnalysis } from "@/components/analysis-session";
import { BackLink } from "@/components/chrome";
import PhotoReview from "@/components/photo-review";
import { captureFrame } from "@/lib/image";

export default function CameraPage() {
  const { profile } = useAnalysis();
  const [photo, setPhoto] = useState("");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const video = useRef(null);
  const stream = useRef(null);
  const revision = useRef(0);
  const opening = useRef(false);

  const stopCamera = useCallback(() => {
    revision.current += 1;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    opening.current = false;
    setReady(false);
    setPending(false);
  }, []);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) stopCamera();
    }
    window.addEventListener("pagehide", stopCamera);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stopCamera();
      setPhoto("");
      window.removeEventListener("pagehide", stopCamera);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [stopCamera]);

  async function startCamera() {
    if (opening.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access requires HTTPS and a supported browser. You can upload a photo instead.");
      return;
    }
    stopCamera();
    const current = revision.current;
    opening.current = true;
    setPending(true);
    setError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      if (current !== revision.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      video.current.srcObject = media;
      await video.current.play();
      if (current === revision.current) setReady(true);
    } catch (failure) {
      if (current !== revision.current) return;
      stopCamera();
      if (failure.name === "NotAllowedError") setError("Camera permission was denied. Allow camera access in your browser or upload a photo.");
      else if (failure.name === "NotFoundError") setError("No camera was found. Connect a camera or upload a photo.");
      else if (failure.name === "NotReadableError") setError("Your camera is unavailable. Close other apps using it, then try again.");
      else setError("The camera could not be started. Try again or upload a photo.");
    } finally {
      if (current === revision.current) {
        opening.current = false;
        setPending(false);
      }
    }
  }

  function capture() {
    try {
      const image = captureFrame(video.current);
      stopCamera();
      setPhoto(image);
    } catch (failure) {
      setError(failure.message);
    }
  }

  if (!profile) return <SessionRecovery />;

  return (
    <>
      <div className={photo ? "hidden" : "flex flex-1 flex-col"}>
        <h1 className="pt-3 text-xs font-semibold uppercase">Take a selfie</h1>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
          <div className="relative aspect-[4/3] w-full max-w-2xl overflow-hidden bg-neutral-100">
            <video
              ref={video}
              autoPlay
              muted
              playsInline
              aria-label="Live camera preview"
              className="h-full w-full -scale-x-100 object-cover"
            />
            {!ready && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
                <Camera aria-hidden="true" size={60} strokeWidth={1} />
                <p className="max-w-xs text-sm leading-relaxed">
                  {pending ? "Waiting for camera access" : "Allow your camera to take a selfie."}
                </p>
              </div>
            )}
            {ready && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-[30%] inset-y-[10%] rounded-[50%] border border-white/70" />
            )}
          </div>
          <p className="text-center text-xs uppercase text-neutral-500">Good lighting. Face forward. Keep your face in frame.</p>
          {error && <p role="alert" className="max-w-md text-center text-sm text-red-700">{error}</p>}
          {pending && <p role="status" className="text-xs">Waiting for camera permission</p>}
          {ready ? (
            <button onClick={capture} className="flex min-h-11 items-center gap-3 border border-neutral-900 px-6 py-3 text-xs uppercase">
              <Camera aria-hidden="true" size={18} />Take photo
            </button>
          ) : (
            <button onClick={startCamera} disabled={pending} className="min-h-11 border border-neutral-900 px-6 py-3 text-xs uppercase">
              {pending ? "Opening camera" : "Enable camera"}
            </button>
          )}
        </div>
        <BackLink href="/test/image">Back to photo options</BackLink>
      </div>
      {photo && (
        <PhotoReview image={photo} onDiscard={() => setPhoto("")} discardLabel="Retake photo" backHref="/test/image" />
      )}
    </>
  );
}
