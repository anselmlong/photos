"use client";

import { usePDF } from "@react-pdf/renderer";
import { QuotePDF } from "./QuotePDF";
import type { QuoteData } from "@/lib/types";

interface PDFDownloadButtonProps {
  data: QuoteData;
  fileName: string;
}

export function PDFDownloadButton({ data, fileName }: PDFDownloadButtonProps) {
  // usePDF generates the blob lazily in the browser; unlike PDFDownloadLink it
  // gives us the blob directly so we can trigger the save ourselves, which is
  // reliable across Safari and Chrome (PDFDownloadLink's auto-click often
  // silently fails and never downloads the file).
  const [instance] = usePDF({ document: <QuotePDF data={data} /> });

  function handleDownload() {
    if (!instance.blob) return;
    const url = URL.createObjectURL(instance.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    // Give the browser a moment to start the download before revoking the URL.
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  if (instance.error) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-6 py-2.5 text-sm text-red-700">
        PDF failed: {String(instance.error)}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={instance.loading}
      className="inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {instance.loading && !instance.blob ? "Preparing PDF..." : "Download Quote PDF"}
    </button>
  );
}
