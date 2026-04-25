import { useState } from "react";

const STORAGE_KEY = "simulation-banner-dismissed";

function SimulationBanner() {
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return sessionStorage.getItem(STORAGE_KEY) === "true";
  });

  if (hidden) {
    return null;
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-400 px-4 py-3 text-sm text-amber-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <p className="font-medium">
          Academic simulation - no real banking operations are performed.
        </p>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(STORAGE_KEY, "true");
            setHidden(true);
          }}
          className="rounded-md border border-amber-900/20 px-3 py-1 text-xs font-medium"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default SimulationBanner;
