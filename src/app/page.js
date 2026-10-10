import Link from "next/link";
import { Header, DiamondArrow } from "@/components/chrome";

export default function Home() {
  return (
    <>
      <Header section="intro" />
      <main id="main-content" className="relative flex flex-1 flex-col overflow-hidden px-6 pb-8 md:px-10">
        <div aria-hidden="true" className="home-diamond home-diamond-left" />
        <div aria-hidden="true" className="home-diamond home-diamond-right" />
        <div className="relative flex flex-1 items-center justify-center py-24 md:py-32">
          <a href="#about" className="group absolute left-0 hidden items-center gap-5 text-xs uppercase md:flex">
            <DiamondArrow back />Discover A.I.
          </a>
          <h1 className="home-title text-center text-[clamp(3.5rem,8.5vw,8rem)] leading-[0.94] font-normal tracking-[-0.075em]">Sophisticated<br />skincare</h1>
          <Link href="/test" className="group absolute right-0 hidden items-center gap-5 text-xs uppercase md:flex">Take test<DiamondArrow /></Link>
        </div>
        <Link href="/test" className="group mx-auto mb-16 flex items-center gap-5 text-sm uppercase md:hidden">Take test<DiamondArrow /></Link>
        <div id="about" className="relative flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-[22rem] text-xs leading-relaxed uppercase">Skinstric introduces an A.I. experience.<br />Take a selfie. Explore your demographics.<br />Adjust the results to reflect you.</p>
          <p className="max-w-60 text-xs leading-relaxed text-neutral-500">This test returns randomized, simulated predictions.</p>
        </div>
      </main>
    </>
  );
}
