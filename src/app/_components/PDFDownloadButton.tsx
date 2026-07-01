"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { QuotePDF } from "./QuotePDF";
import type { QuoteData } from "@/lib/types";

interface PDFDownloadButtonProps {
  data: QuoteData;
  fileName: string;
}

export function PDFDownloadButton({ data, fileName }: PDFDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={<QuotePDF data={data} />}
      fileName={fileName}
      className="inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-opacity hover:opacity-80"
    >
      {({ loading }) => (loading ? "Preparing PDF..." : "Download Quote PDF")}
    </PDFDownloadLink>
  );
}
