import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { AI_BASE_URL } from "../../config";
import useAuthStore from "../../stores/authStore";
const tabs = ["Email Agent", "Chatbot", "Document Scanner", "Get Recommendations"];

const riskAccent = {
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  medium: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  high: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

const intentAccent = {
  "file insurance claim": "bg-amber-500/15 text-amber-300",
  "fund transfer request": "bg-cyan-500/15 text-cyan-300",
  "investment query": "bg-emerald-500/15 text-emerald-300",
  "policy update": "bg-blue-500/15 text-blue-300",
  complaint: "bg-rose-500/15 text-rose-300",
  "general inquiry": "bg-slate-700 text-slate-200",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const quickQuestions = [
  "How do I check my balance?",
  "How do I file an insurance claim?",
  "What are current FD rates?",
  "How do I buy a stock?",
];

function AIAgent() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("Email Agent");
  const [emailText, setEmailText] = useState("");
  const [emailResult, setEmailResult] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi. I can help with banking, investments, insurance, and documents.",
      suggestions: quickQuestions,
    },
  ]);
  const [documentResult, setDocumentResult] = useState(null);
  const [documentExpanded, setDocumentExpanded] = useState(false);
  const [riskProfile, setRiskProfile] = useState("medium");
  const [recommendAmount, setRecommendAmount] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  const chatSuggestions = useMemo(() => {
    const latestBot = [...messages].reverse().find((message) => message.sender === "bot");
    return latestBot?.suggestions || quickQuestions;
  }, [messages]);

  const analyzeEmail = async () => {
    try {
      const response = await fetch(`${AI_BASE_URL}/email-process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_text: emailText,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      setEmailResult(data);
    } catch (error) {
      toast.error("Unable to analyze email");
    }
  };

  const sendChat = async (messageOverride) => {
    const outgoing = messageOverride || chatInput;

    if (!outgoing.trim()) {
      return;
    }

    setMessages((prev) => [...prev, { sender: "user", text: outgoing }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(`${AI_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: outgoing,
          userId: user?.id,
        }),
      });
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.response,
          suggestions: data.suggestions,
          confidence: data.confidence,
        },
      ]);
    } catch (error) {
      toast.error("Chatbot unavailable");
    } finally {
      setChatLoading(false);
    }
  };

  const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${AI_BASE_URL}/document-extract`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setDocumentResult(data);
    } catch (error) {
      toast.error("Unable to process document");
    }
  };

  const getRecommendations = async () => {
    try {
      const response = await fetch(`${AI_BASE_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          riskProfile,
          amount: Number(recommendAmount),
        }),
      });
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      toast.error("Unable to fetch recommendations");
    }
  };

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-md border border-slate-800 bg-slate-950 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm ${
              activeTab === tab ? "bg-cyan-500 text-slate-950" : "text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Email Agent" ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <textarea
            value={emailText}
            onChange={(event) => setEmailText(event.target.value)}
            placeholder="Paste email here"
            rows={9}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
          />
          <button
            type="button"
            onClick={analyzeEmail}
            className="mt-4 rounded-md bg-cyan-500 px-5 py-3 font-medium text-slate-950"
          >
            Analyze
          </button>

          {emailResult ? (
            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    intentAccent[emailResult.intent] || "bg-slate-700 text-slate-200"
                  }`}
                >
                  {emailResult.intent}
                </span>
                <span className="text-sm text-slate-400">
                  Confidence {(emailResult.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-300">{emailResult.message}</p>
              <p className="mt-2 text-sm text-cyan-300">{emailResult.action_taken}</p>
              <div className="mt-4 overflow-hidden rounded-md border border-slate-800">
                <table className="min-w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Entity</th>
                      <th className="px-4 py-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(emailResult.entities || {}).map(([key, value]) => (
                      <tr key={key} className="border-t border-slate-800">
                        <td className="px-4 py-3 capitalize">{key.replace("_", " ")}</td>
                        <td className="px-4 py-3">{value || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "Chatbot" ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl rounded-lg px-4 py-3 text-sm ${
                    message.sender === "user"
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-800 text-slate-100"
                  }`}
                >
                  <p>{message.text}</p>
                  {message.confidence ? (
                    <p className="mt-2 text-xs opacity-80">
                      Confidence {(message.confidence * 100).toFixed(1)}%
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
            {chatLoading ? (
              <div className="flex justify-start">
                <div className="rounded-lg bg-slate-800 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {chatSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendChat(suggestion)}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendChat();
                }
              }}
              placeholder="Ask the AI agent"
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />
            <button
              type="button"
              onClick={() => sendChat()}
              className="rounded-md bg-cyan-500 px-5 py-3 font-medium text-slate-950"
            >
              Send
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === "Document Scanner" ? (
        <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950 px-6 py-16 text-center text-slate-400">
            <div className="mb-4 text-4xl">[]</div>
            <p className="text-base text-slate-300">Drag and drop a PDF or image here</p>
            <p className="mt-2 text-sm">Accepts PDF, JPG, and PNG</p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  uploadDocument(file);
                }
              }}
            />
          </label>

          {documentResult ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white">Extracted Fields</h3>
                  <span className="text-sm text-slate-400">
                    Confidence {(documentResult.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-4 overflow-hidden rounded-md border border-slate-800">
                  <table className="min-w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Field</th>
                        <th className="px-4 py-3">Extracted Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(documentResult.fields || {}).map(([key, value]) => (
                        <tr key={key} className="border-t border-slate-800">
                          <td className="px-4 py-3 capitalize">{key.replace("_", " ")}</td>
                          <td className="px-4 py-3">{value || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                <button
                  type="button"
                  onClick={() => setDocumentExpanded((prev) => !prev)}
                  className="text-sm font-medium text-cyan-300"
                >
                  {documentExpanded ? "Hide raw text preview" : "Show raw text preview"}
                </button>
                {documentExpanded ? (
                  <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300">
                    {documentResult.extracted_text}
                  </pre>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "Get Recommendations" ? (
        <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {["low", "medium", "high"].map((risk) => (
              <button
                key={risk}
                type="button"
                onClick={() => setRiskProfile(risk)}
                className={`rounded-lg border p-5 text-left ${
                  riskProfile === risk
                    ? riskAccent[risk]
                    : "border-slate-800 bg-slate-950 text-slate-300"
                }`}
              >
                <p className="text-sm uppercase tracking-wide">{risk}</p>
                <p className="mt-2 text-lg font-semibold capitalize">{risk} Risk</p>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <input
              type="number"
              min="1000"
              step="500"
              value={recommendAmount}
              onChange={(event) => setRecommendAmount(event.target.value)}
              placeholder="Investment amount"
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            />
            <button
              type="button"
              onClick={getRecommendations}
              className="rounded-md bg-cyan-500 px-5 py-3 font-medium text-slate-950"
            >
              Get Recommendations
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {recommendations.map((item) => (
              <div
                key={item.fund.id}
                className="rounded-lg border border-slate-800 bg-slate-950 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.fund.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{item.fund.category}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                    {item.fund.oneYearReturn}% 1Y
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      riskAccent[item.fund.riskLevel]
                    }`}
                  >
                    {item.fund.riskLevel} risk
                  </span>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                    Score {item.score}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-300">{item.reason}</p>
                <p className="mt-4 text-sm text-slate-400">
                  NAV {formatCurrency(item.fund.nav)} - Min SIP{" "}
                  {formatCurrency(item.fund.minSIP)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AIAgent;
