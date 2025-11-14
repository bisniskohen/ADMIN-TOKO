import { Timestamp } from "firebase/firestore";

export interface Admin {
  id: string;
  adminName: string;
  createdAt: Timestamp;
}
export type NewAdmin = Omit<Admin, "id" | "createdAt">;

export interface Shop {
    id: string;
    shopName: string;
    adminId: string;
    createdAt: Timestamp;
}
export type NewShop = Omit<Shop, "id" | "createdAt">;


export interface ShopData {
  id: string;
  shopId: string;
  revenue: number;
  totalSales: number;
  adSales: number;
  adROI: number;
  createdAt: Timestamp;
}

export type NewShopData = Omit<ShopData, "id" | "createdAt">;

// Fix: Add missing DataPenjualan interface
export interface DataPenjualan {
  id: string;
  shopId: string;
  adminId: string;
  namaProduk: string;
  jumlah: number;
  harga: number;
  createdAt: Timestamp;
}


export interface Creator {
  id: string;
  name: string;
  source: 'TikTok' | 'WA';
  phoneNumber?: string;
  recipientName?: string;
  address?: string;
  dateContacted: Timestamp;
  createdAt: Timestamp;
}
export type NewCreator = Omit<Creator, 'id' | 'createdAt'>;

export interface CreatorSample {
  id: string;
  creatorId: string;
  recipientName: string;
  address: string;
  phoneNumber?: string;
  quantity: number;
  dateSent: Timestamp;
  createdAt: Timestamp;
}
export type NewCreatorSample = Omit<CreatorSample, 'id' | 'createdAt'>;

export interface AffiliateEvent {
  id: string;
  eventType: 'Webinar/Zoom' | 'Seminar' | 'Kopdar' | 'Private';
  topic: string;
  eventDate: Timestamp;
  status: 'scheduled' | 'completed' | 'cancelled';
  cancellationReason?: string;
  createdAt: Timestamp;
}

export type NewAffiliateEvent = Omit<AffiliateEvent, 'id' | 'createdAt'>;