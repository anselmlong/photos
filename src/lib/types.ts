export type Service = "photography" | "videography" | "both";
export type Deliverable = "photos" | "reel" | "both" | "raw";
export type Turnaround = "standard" | "rush";

export interface BookingEnquiry {
  name: string;
  email: string;
  phone?: string;
  referral?: string;

  eventTitle: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  venueAddress?: string;

  services: Service;
  duration: string;
  guestCount?: number;
  budget?: string;
  deliverables?: Deliverable;
  turnaround?: Turnaround;

  specialRequests?: string;
  returningClient?: boolean;
  preferredContact?: "email" | "whatsapp";
}

export interface LineItem {
  description: string;
  qty: number;
  rate: number;
}

export interface QuoteData {
  enquiry: BookingEnquiry;
  quoteNum: string;
  lineItems: LineItem[];
  discount?: number;
  discountNote?: string;
  paymentTerms: string;
  validDays: number;
  notes?: string;
}
