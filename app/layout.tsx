import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import HeaderNav from "./components/HeaderNav";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LessonLedger",
  description: "Log tutoring sessions and track income.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth()

  async function handleSignOut() {
    'use server'
    await signOut({ redirectTo: '/login' })
  }

  return (
    <html
      lang="en"
      className={`${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <header className="bg-header relative">
          {session ? (
            <HeaderNav
              userName={session.user.name ?? session.user.email ?? ''}
              signOutAction={handleSignOut}
            />
          ) : (
            <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-6">
              <Link
                href="/"
                className="font-semibold text-white hover:text-header-muted transition-colors shrink-0"
              >
                LessonLedger
              </Link>
            </div>
          )}
        </header>
        <main className="flex-1 bg-background">
          {children}
        </main>
      </body>
    </html>
  );
}
