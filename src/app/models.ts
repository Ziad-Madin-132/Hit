export interface ServiceItem {
  id: number;
  name: string;
  desc: string;
  price: number;
  largeCarFee?: number;
  visible: boolean;
}

export interface OfferItem {
  id: number;
  title: string;
  desc: string;
  image: string;
  startDate: string;
  endDate: string;
  discountPct: number;
}

export interface ClientRecord {
  id: number;
  phone: string;
  service: 'oil' | 'wash';
  serviceName: string;
  date: string;
  timestamp: number;
}

export interface Settings {
  siteName: string;
  heroTitle: string;
  heroDesc: string;
  phone: string;
  whatsapp: string;
  address: string;
  aboutImage: string;
  aboutTitle: string;
  aboutText1: string;
  aboutText2: string;
  mapUrl: string;
  brands: string[];
  colors: {
    p: string;
    a: string;
    g: string;
    bg: string;
  };
  hours: Array<{
    day: string;
    from: string;
    to: string;
  }>;
  waTemplates: {
    oil: string;
    wash: string;
    welcome: string;
  };
  largeCarFee?: number;
}

export interface InvitationRecord {
  id: string;
  inviterPhone: string;
  invitedPhone: string;
  discountPercent: number;
  status: 'pending' | 'completed' | 'used';
  createdAt: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
  simulated?: boolean;
  warning?: string;
  metaError?: any;
}
