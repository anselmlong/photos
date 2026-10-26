"use client";

import { pdf } from "@react-pdf/renderer";
import { useState } from "react";
import { QuotePDF } from "./QuotePDF";
import type { QuoteData } from "@/lib/types";

interface PDFDownloadButtonProps {
  data: QuoteData;
  fileName: string;
}

export function PDFDownloadButton({ data, fileName }: PDFDownloadButtonProps) {
  // Render the PDF from the *current* props at click time. usePDF({ document })
  // only renders the document it receives on mount and ignores later prop
  // changes, so every edit made in the builder was missing from the download.
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setBusy(true);
    setError(null);
    try {
      const blob = await pdf(<QuotePDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      // Give the browser a moment to start the download before revoking the URL.
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error(err);
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Preparing PDF..." : "Download Quote PDF"}
      </button>
      {error && <span className="text-xs text-red-700">PDF failed: {error}</span>}
    </div>
  );
}
