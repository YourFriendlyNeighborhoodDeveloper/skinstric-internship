import { Header } from "@/components/chrome";
import { AnalysisProvider } from "@/components/analysis-session";

export const metadata = { title: "Analysis" };

export default function TestLayout({ children }) {
  return (
    <>
      <Header section="analysis" />
      <main id="main-content" className="flex flex-1 flex-col px-6 pb-6 md:px-10 md:pb-8">
        <AnalysisProvider>{children}</AnalysisProvider>
      </main>
    </>
  );
}
