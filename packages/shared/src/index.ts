export type ServiceCategory =
  | "web-development"
  | "business-software"
  | "ai-automation"
  | "cloud-deployment";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  status: "open" | "closed" | "human-handoff";
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  customerId: string;
  serviceCategory?: ServiceCategory;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}