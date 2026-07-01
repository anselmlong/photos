"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { LineItem, QuoteData } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#111111",
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 40,
  },
  header: {
    borderBottomColor: "#111111",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 14,
  },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 16 },
  brandSub: { color: "#666666", fontSize: 8, marginTop: 2 },
  quoteTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, textAlign: "right" },
  quoteNum: { color: "#666666", fontSize: 8, marginTop: 2, textAlign: "right" },
  muted: { color: "#666666", fontSize: 8 },
  metaGrid: { flexDirection: "row", marginBottom: 20 },
  metaBlock: { flexBasis: 0, flexGrow: 1, marginRight: 24 },
  metaBlockLast: { flexBasis: 0, flexGrow: 1, marginRight: 0 },
  detailBox: {
    borderBottomColor: "#eeeeee",
    borderBottomWidth: 1,
    borderTopColor: "#eeeeee",
    borderTopWidth: 1,
    marginBottom: 16,
    paddingVertical: 8,
  },
  detailText: { color: "#444444", fontSize: 8, lineHeight: 1.5 },
  detailLabel: { fontFamily: "Helvetica-Bold" },
  label: {
    color: "#999999",
    fontSize: 7,
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  value: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  valueSub: { color: "#444444", fontSize: 8, marginTop: 1 },
  tableHead: {
    borderBottomColor: "#111111",
    borderBottomWidth: 1,
    flexDirection: "row",
    marginBottom: 4,
    marginTop: 16,
    paddingBottom: 6,
  },
  tableRow: {
    borderBottomColor: "#eeeeee",
    borderBottomWidth: 0.5,
    flexDirection: "row",
    paddingVertical: 6,
  },
  colDesc: { flexGrow: 4, fontSize: 9 },
  colNum: { flexGrow: 1, fontSize: 9, textAlign: "right" },
  totalBox: {
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    marginTop: 12,
    padding: 12,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalFinal: {
    borderTopColor: "#cccccc",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
  },
  totalFinalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  totalFinalValue: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  section: { marginTop: 20 },
  tcText: { color: "#666666", fontSize: 7.5, lineHeight: 1.6 },
  sig: { flexDirection: "row", marginTop: 28 },
  sigBlock: {
    borderTopColor: "#999999",
    borderTopWidth: 0.5,
    flexBasis: 0,
    flexGrow: 1,
    marginRight: 40,
    paddingTop: 6,
  },
  sigBlockLast: {
    borderTopColor: "#999999",
    borderTopWidth: 0.5,
    flexBasis: 0,
    flexGrow: 1,
    marginRight: 0,
    paddingTop: 6,
  },
  sigLabel: { color: "#999999", fontSize: 7 },
  noteText: { color: "#333333", fontSize: 8.5, lineHeight: 1.6 },
});

function formatSGD(value: number) {
  return `SGD ${value.toLocaleString("en-SG", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function formatLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function lineItemAmount(item: LineItem) {
  return item.qty * item.rate;
}

export function QuotePDF({ data }: { data: QuoteData }) {
  const { enquiry, quoteNum, lineItems, discount, discountNote, paymentTerms, validDays, notes } =
    data;
  const safeDiscount = Math.max(0, discount ?? 0);
  const subtotal = lineItems.reduce((sum, item) => sum + lineItemAmount(item), 0);
  const total = Math.max(0, subtotal - safeDiscount);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + Math.max(1, validDays));
  const validStr = validUntil.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Anselm Long</Text>
            <Text style={styles.brandSub}>Photography & Videography - Singapore</Text>
            <Text style={[styles.muted, { marginTop: 4 }]}>
              anselmpius@gmail.com - +65 8853 6376
            </Text>
          </View>
          <View>
            <Text style={styles.quoteTitle}>QUOTATION</Text>
            <Text style={styles.quoteNum}>#{quoteNum || "DRAFT"}</Text>
            <Text style={[styles.muted, { marginTop: 4, textAlign: "right" }]}>
              Valid until {validStr}
            </Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Prepared for</Text>
            <Text style={styles.value}>{enquiry.name}</Text>
            <Text style={styles.valueSub}>{enquiry.email}</Text>
            {enquiry.phone && <Text style={styles.valueSub}>{enquiry.phone}</Text>}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Event</Text>
            <Text style={styles.value}>
              {enquiry.eventTitle} ({enquiry.eventType})
            </Text>
            <Text style={styles.valueSub}>
              {enquiry.eventDate} - {enquiry.startTime}-{enquiry.endTime}
            </Text>
            <Text style={styles.valueSub}>{enquiry.venue}</Text>
          </View>
          <View style={styles.metaBlockLast}>
            <Text style={styles.label}>Services</Text>
            <Text style={styles.value}>{formatLabel(enquiry.services)}</Text>
            <Text style={styles.valueSub}>{enquiry.duration}</Text>
            {enquiry.deliverables && (
              <Text style={styles.valueSub}>{formatLabel(enquiry.deliverables)}</Text>
            )}
            {enquiry.turnaround === "rush" && <Text style={styles.valueSub}>Rush delivery</Text>}
          </View>
        </View>

        {(enquiry.venueAddress || enquiry.preferredContact) && (
          <View style={styles.detailBox}>
            {enquiry.venueAddress && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Venue address: </Text>
                {enquiry.venueAddress}
              </Text>
            )}
            {enquiry.preferredContact && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Preferred contact: </Text>
                {formatLabel(enquiry.preferredContact)}
              </Text>
            )}
          </View>
        )}

        <View style={styles.tableHead}>
          <Text style={[styles.colDesc, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>
            Description
          </Text>
          <Text style={[styles.colNum, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Hrs</Text>
          <Text style={[styles.colNum, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>Rate</Text>
          <Text style={[styles.colNum, { fontFamily: "Helvetica-Bold", fontSize: 8 }]}>
            Amount
          </Text>
        </View>

        {lineItems.map((item, index) => (
          <View key={`${item.description}-${index}`} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description || "Coverage"}</Text>
            <Text style={styles.colNum}>{item.qty}</Text>
            <Text style={styles.colNum}>{formatSGD(item.rate)}</Text>
            <Text style={styles.colNum}>{formatSGD(lineItemAmount(item))}</Text>
          </View>
        ))}

        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{formatSGD(subtotal)}</Text>
          </View>
          {safeDiscount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>
                Discount{discountNote ? ` (${discountNote})` : ""}
              </Text>
              <Text>-{formatSGD(safeDiscount)}</Text>
            </View>
          )}
          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalLabel}>Total (SGD)</Text>
            <Text style={styles.totalFinalValue}>{formatSGD(total)}</Text>
          </View>
        </View>

        {notes && (
          <View style={styles.section}>
            <Text style={[styles.label, { marginBottom: 4 }]}>Notes</Text>
            <Text style={styles.noteText}>{notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.label, { marginBottom: 4 }]}>Payment Terms</Text>
          <Text style={styles.tcText}>{paymentTerms}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { marginBottom: 4 }]}>Terms & Conditions</Text>
          <Text style={styles.tcText}>
            A 50% deposit is required to confirm the booking. The remaining balance is due 7 days
            before the event. Standard turnaround is 14 days from event date. Rush delivery is 7
            days and incurs a 30% surcharge. Cancellations within 14 days of the event forfeit the
            deposit. Travel outside Singapore is charged at cost.
          </Text>
        </View>

        <View style={styles.sig}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>Client signature and date</Text>
          </View>
          <View style={styles.sigBlockLast}>
            <Text style={styles.sigLabel}>Anselm Long - anselmpius@gmail.com</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
