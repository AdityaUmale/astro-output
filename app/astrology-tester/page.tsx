"use client";

import { FormEvent, useMemo, useState } from "react";

type FormState = {
  date: string;
  time: string;
  lat: string;
  lng: string;
  city: string;
  country: string;
};

const DEFAULT_FORM: FormState = {
  date: "1990-01-01",
  time: "00:00",
  lat: "28.6139",
  lng: "77.2090",
  city: "New Delhi",
  country: "India"
};

const FIELDS: Array<{
  name: keyof FormState;
  label: string;
  type?: string;
  step?: string;
}> = [
  { name: "date", label: "Date", type: "date" },
  { name: "time", label: "Time (IST)", type: "time", step: "60" },
  { name: "lat", label: "Latitude", type: "number", step: "0.0001" },
  { name: "lng", label: "Longitude", type: "number", step: "0.0001" },
  { name: "city", label: "City" },
  { name: "country", label: "Country" }
];

export default function AstrologyTesterPage() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState("Run a calculation to see the full chart JSON.");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams(form);
    params.set("timezone", "Asia/Kolkata");
    return params.toString();
  }, [form]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    setResult("Generating chart JSON...");

    try {
      const response = await fetch(`/api/astrology?${queryString}`);
      const responseText = await response.text();
      let payload: unknown;

      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = {
          error: response.ok
            ? "The API returned a non-JSON response."
            : `The API returned HTTP ${response.status}.`,
          body: responseText
        };
      }

      const formattedPayload = JSON.stringify(payload, null, 2);

      if (!response.ok) {
        setError(
          typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
            ? payload.error
            : "The calculation request failed."
        );
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
          Enter birth details in Indian Standard Time. The API builds the
          interpreter-ready Vedic sidereal chart payload from Swiss Ephemeris.
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
                  inputMode={field.type === "number" ? "decimal" : "text"}
                  name={field.name}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      [field.name]: event.target.value
                    }))
                  }
                  required
                  step={field.step}
                  type={field.type ?? "text"}
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
