import React from "react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ComplianceGuidePage() {
  const [markdown, setMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/compliance-guide")
      .then(async (res) => {
        if (!res.ok) throw new Error("Fehler beim Laden des Compliance Guides");
        return await res.text();
      })
      .then(setMarkdown)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 text-blue-700 font-semibold">Lade Compliance Guide...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="prose max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="mb-4">MedTech Compliance Boss Guide (EU MDR/IVDR 2025)</h1>
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
