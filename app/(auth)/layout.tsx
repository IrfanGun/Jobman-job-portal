import { Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${manrope.className} min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-10`}
    >
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        {children}
      </div>
    </div>
  );
}
