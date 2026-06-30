import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="intro">
        <p className="eyebrow">Internal utility</p>
        <h1>Astrology calculation tools</h1>
        <p>
          Generate a complete core planetary JSON payload through the Swiss
          Ephemeris API endpoint.
        </p>
        <Link className="primary-link" href="/astrology-tester">
          Open tester
        </Link>
      </section>
    </main>
  );
}
