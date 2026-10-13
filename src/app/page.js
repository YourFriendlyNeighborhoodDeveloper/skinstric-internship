import Link from "next/link";
import { Header, DiamondArrow } from "@/components/chrome";

export default function Home() {
  return (
    <>
      <Header section="intro" />
      <main id="main-content" className="home-main relative flex flex-1 flex-col overflow-hidden px-6 pb-8 md:px-10">
        <div aria-hidden="true" className="home-diamond home-diamond-left" />
        <div aria-hidden="true" className="home-diamond home-diamond-right" />
        <div className="relative flex flex-1 items-center justify-center py-24 md:py-32">
          <a href="#about" className="home-nav home-nav-left group absolute left-0 hidden items-center gap-5 text-xs uppercase lg:flex">
            Discover A.I.<DiamondArrow />
          </a>
          <h1 className="home-title text-center text-[clamp(3.5rem,8.5vw,8rem)] leading-[0.94] font-normal tracking-[-0.075em]">Sophisticated<br /><span className="block">skincare</span></h1>
          <Link href="/test" className="home-nav home-nav-right group absolute right-0 hidden items-center gap-5 text-xs uppercase lg:flex"><DiamondArrow back />Take The Test</Link>
        </div>
        <div className="relative mb-16 flex flex-wrap items-center justify-between gap-3 lg:hidden">
          <a href="#about" className="group flex min-h-11 items-center gap-2 text-[10px] uppercase">Discover A.I.<DiamondArrow /></a>
          <Link href="/test" className="group flex min-h-11 items-center gap-2 text-[10px] uppercase"><DiamondArrow back />Take The Test</Link>
        </div>
        <div id="about" className="relative flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-[22rem] text-xs leading-relaxed uppercase">Skinstric introduces an A.I. experience.<br />Take a selfie. Explore your demographics.<br />Adjust the results to reflect you.</p>
          <p className="max-w-60 text-xs leading-relaxed text-neutral-500">This test returns randomized, simulated predictions.</p>
        </div>
      </main>
    </>
  );
}
