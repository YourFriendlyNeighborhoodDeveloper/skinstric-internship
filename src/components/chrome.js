import Link from "next/link";

export function Header({ section }) {
  return (
    <header className="relative z-10 flex h-20 shrink-0 items-center gap-5 px-6 md:px-10">
      <Link href="/" aria-label="Skinstric home" className="text-sm font-semibold tracking-tight">SKINSTRIC</Link>
      <span className="text-[10px] uppercase text-neutral-500">[ {section} ]</span>
      <Link href="/test" className="ml-auto bg-neutral-900 px-4 py-2.5 text-[10px] uppercase text-white transition-colors hover:bg-neutral-700">Take test</Link>
    </header>
  );
}

export function DiamondArrow({ back = false }) {
  return (
    <span aria-hidden="true" className="flex size-9 shrink-0 rotate-45 items-center justify-center border border-current transition-colors group-hover:bg-neutral-200">
      <svg viewBox="0 0 20 20" className="size-4 -rotate-45" fill="currentColor">
        <path d={back ? "M12 4 5 10l7 6Z" : "m8 4 7 6-7 6Z"} />
      </svg>
    </span>
  );
}

export function BackLink({ href, children = "Back" }) {
  return <Link href={href} className="group inline-flex min-h-11 items-center gap-5 text-xs uppercase"><DiamondArrow back />{children}</Link>;
}

export function DiamondLayers() {
  return (
    <span aria-hidden="true" className="diamond-layers">
      <span /><span /><span />
    </span>
  );
}

export function Orbit() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden lg:overflow-visible">
      <span className="diamond-orbit" />
      <span className="diamond-orbit" />
      <span className="diamond-orbit" />
    </div>
  );
}
