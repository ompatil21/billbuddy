export default function Home() {
  return (
    <main className="py-16">
      <h1 className="text-4xl font-bold">Split, Scan, Settle.</h1>
      <p className="mt-2 text-gray-600">A Splitwise-style app with OCR and smart extras.</p>
      <a
        className="mt-6 inline-block rounded bg-black px-4 py-2 text-white"
        href="/dashboard"
      >
        Go to Dashboard
      </a>
    </main>
  );
}
