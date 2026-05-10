"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-8">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Something went wrong</h2>
      <p className="text-sm text-gray-500 max-w-md text-center leading-relaxed">
        {error.message || "An unexpected error occurred while rendering this page."}
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
