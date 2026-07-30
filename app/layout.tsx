import "./globals.css";
import Header from "./components/Header";
import Providers from "./providers";

export const metadata = {
  title: "NMT Platform",
  description: "Платформа комп'ютерного тестування",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className="bg-[#F8FAFC] text-[#1F2937]">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}