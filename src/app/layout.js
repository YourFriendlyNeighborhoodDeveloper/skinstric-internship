import "./globals.css";

export const metadata = {
  title: { default: "Skinstric", template: "%s | Skinstric" },
  description: "Explore a simulated demographic analysis with a photo or selfie.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-dvh flex-col">
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
