import type { LeadStatus, VisitStatus, VisitType } from "@/lib/validation";

export interface ApplianceDetails {
  geladeira?: string;
  fogao?: string;
  microondas?: string;
  coifa?: string;
  maquina?: string;
  cama?: string;
}

export interface LeadRecord {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  property_type: string | null;
  environments: string[];
  appliance_details: ApplianceDetails;
  design_style: string | null;
  color_preference: string | null;
  wants_technical_visit: boolean | null;
  status: LeadStatus;
  source: "chat" | "manual";
  budget_value: number | null;
  payment_method: string | null;
  installments: number | null;
  amount_received: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitRecord {
  id: string;
  lead_id: string;
  type: VisitType;
  scheduled_at: string;
  status: VisitStatus;
  notes: string | null;
  created_at: string;
}

export interface PortfolioItemRecord {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image_path: string | null;
  display_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}
