import React, { useState } from "react";
import { complianceChecklist } from "@shared/compliance-checklist";

export default function ComplianceChecklistPage() {
  // Local state for demo; in Produktion ggf. persistent (DB/User)
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const handleToggle = (stepId: string) => {
    setChecked((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Compliance Self-Review Checkliste</h1>
      {complianceChecklist.map((section) => (
        <div key={section.id} className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
          <ul className="space-y-2">
            {section.steps.map((step) => (
              <li key={step.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!checked[step.id]}
                  onChange={() => handleToggle(step.id)}
                  className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded"
                  id={step.id}
                />
                <label htmlFor={step.id} className={"flex-1 " + (step.mandatory ? "font-medium" : "text-gray-600")}>{step.label}
                  {step.reference && (
                    <a href={step.reference} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 underline text-xs">Quelle</a>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="mt-8">
        <button
          className="px-6 py-3 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800 transition"
          onClick={() => alert("Checkliste als abgeschlossen markiert! (Demo)")}
        >
          Abschluss bestätigen
        </button>
      </div>
    </div>
  );
}
