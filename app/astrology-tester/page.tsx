"use client";

import { FormEvent, useMemo, useState } from "react";

type FormState = {
  year: string;
  month: string;
  day: string;
  hour: string;
  lat: string;
  lng: string;
};

const DEFAULT_FORM: FormState = {
  year: "1990",
  month: "1",
  day: "1",
  hour: "0",
  lat: "28.6139",
  lng: "77.2090"
};

const FIELDS: Array<{
  name: keyof FormState;
  label: string;
  step?: string;
}> = [
  { name: "year", label: "Year" },
  { name: "month", label: "Month" },
  { name: "day", label: "Day" },
  { name: "hour", label: "Hour (IST)", step: "0.01" },
  { name: "lat", label: "Latitude", step: "0.0001" },
  { name: "lng", label: "Longitude", step: "0.0001" }
];

export default function AstrologyTesterPage() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState("Run a calculation to see the full chart JSON.");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams(form);
    return params.toString();
  }, [form]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    setResult("Generating chart JSON...");

    try {
      const response = await fetch(`/api/astrology?${queryString}`);
      const payload = await response.json();
      const formattedPayload = JSON.stringify(payload, null, 2);

      if (!response.ok) {
        setError(payload.error ?? "The calculation request failed.");
      }

      setResult(formattedPayload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The calculation request failed."
      );
      setResult("No API response was returned.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="intro">
        <p className="eyebrow">PM testing playground</p>
        <h1>Astrology chart JSON tester</h1>
        <p>
          Enter birth details in Indian Standard Time. The API converts the
          time to UTC before calling Swiss Ephemeris.
        </p>
      </section>

      <section className="tester-layout" aria-label="Astrology chart generator">
        <form className="panel" onSubmit={handleSubmit}>
          <div className="form-grid">
            {FIELDS.map((field) => (
              <div className="field" key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                <input
                  id={field.name}
                  inputMode="decimal"
                  name={field.name}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      [field.name]: event.target.value
                    }))
                  }
                  required
                  step={field.step ?? "1"}
                  type="number"
                  value={form[field.name]}
                />
              </div>
            ))}
          </div>

          <p>
            Endpoint: <code>/api/astrology?{queryString}</code>
          </p>

          {error ? <p className="error-message">{error}</p> : null}

          <button className="primary-button" disabled={isLoading} type="submit">
            {isLoading ? "Generating..." : "Generate Full Chart JSON"}
          </button>
        </form>

        <pre className="result-pre">{result}</pre>
      </section>
    </main>
  );
}
