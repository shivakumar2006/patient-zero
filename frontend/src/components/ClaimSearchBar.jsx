import { useState } from "react";

export default function ClaimSearchBar({ onTrace, loading }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    if (value.trim()) onTrace(value.trim());
  }

  return (
    <form onSubmit={submit} className="w-full max-w-2xl mx-auto">
      <label className="block text-inkDim text-xs font-mono mb-2 uppercase tracking-wider">
        Enter a claim to trace
      </label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Pentagon files confirm aliens were watching Apollo 11"
          className="flex-1 bg-surface border border-manilaDark/40 text-ink font-mono text-sm px-4 py-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-string/60 placeholder:text-inkDim/60"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-string hover:bg-stringDim text-ink font-mono text-sm px-5 py-3 rounded-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Tracing…" : "Trace"}
        </button>
      </div>
    </form>
  );
}
