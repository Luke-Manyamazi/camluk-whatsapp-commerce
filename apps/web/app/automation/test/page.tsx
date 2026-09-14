"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

type RuleResponse = {
  rule: {
    id: string;
    name: string;
    business_id: string;
    enabled: boolean;
    priority: number;
    match_type: string;
    keywords: string[];
    response_text: string | null;
    action_type: string;
  };
};

type TestResponse = {
  input: string;
  matched: boolean;
  rule: RuleResponse["rule"] | null;
  responseText: string | null;
  actionType: string | null;
  actionConfig: Record<string, unknown>;
};

export default function AutomationTestPage() {
  const [message, setMessage] = useState("I need a website for my business");

  const [result, setResult] = useState<TestResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createRule() {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<RuleResponse>("/api/automation/rules", {
        method: "POST",
        body: JSON.stringify({
          name: "Website Enquiry",
          description: "Handles website-related enquiries.",
          enabled: true,
          priority: 70,
          matchType: "any",
          keywords: ["website", "web development", "web design"],
          responseText:
            "Thanks for contacting Camluk Technologies. We can help you build a modern, responsive website for your business.",
          actionType: "create_lead",
          actionConfig: {
            serviceCategory: "web-development",
            status: "new",
          },
        }),
      });

      alert(`Rule created: ${data.rule.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rule.");
    } finally {
      setLoading(false);
    }
  }

  async function executeRule() {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/automation/execute", {
        method: "POST",
        body: JSON.stringify({
          message: "I need a website for my business",

          customerId: "ae641ada-36a7-4c5f-ae07-fec186e667e3",

          conversationId: "d8a67310-b233-40ab-8895-b9c7ccaa252b",
        }),
      });

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to execute automation.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function testRule() {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<TestResponse>("/api/automation/test", {
        method: "POST",
        body: JSON.stringify({
          message,
        }),
      });

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to test automation.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 24,
      }}
    >
      <h1>Automation API Test</h1>

      <p>Temporary development page for testing the rules engine.</p>

      <button onClick={createRule} disabled={loading}>
        Create Website Rule
      </button>

      <hr
        style={{
          margin: "30px 0",
        }}
      />

      <label>Test message</label>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={4}
        style={{
          display: "block",
          width: "100%",
          marginTop: 8,
          marginBottom: 16,
          padding: 12,
        }}
      />

      <button onClick={testRule} disabled={loading}>
        Test Rule
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <pre
          style={{
            marginTop: 24,
            padding: 16,
            background: "#f4f4f4",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
      <button
        onClick={executeRule}
        disabled={loading}
        style={{
          marginLeft: 10,
        }}
      >
        Execute Rule
      </button>
    </main>
  );
}
