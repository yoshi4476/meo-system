'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="p-8 text-center text-slate-300">
      <h2 className="text-xl font-bold text-red-400 mb-4">エラーが発生しました</h2>
      <p className="mb-4 bg-slate-900/50 p-4 rounded text-left font-mono text-sm border border-red-500/20">
        {error.message || "Unknown Error"}
      </p>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        className="bg-aurora-purple text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
      >
        再試行 (Retry)
      </button>
    </div>
  );
}
