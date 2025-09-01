// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-bold tracking-tight">MyApp</h1>
          <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
            <Link href="/about" className="hover:text-black">
              About
            </Link>
            <Link href="/contact" className="hover:text-black">
              Contact
            </Link>
            <Link
              href="/signin"
              className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-900"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-1 items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-bold sm:text-5xl">
            Welcome to <span className="text-indigo-600">MyApp</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            A modern platform to manage everything in one place. Simple, fast,
            and secure.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signin"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-white shadow hover:bg-indigo-700"
            >
              Get Started
            </Link>
            <Link
              href="/learn-more"
              className="rounded-lg border px-6 py-3 text-gray-700 shadow hover:bg-gray-50"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} — MyApp. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
