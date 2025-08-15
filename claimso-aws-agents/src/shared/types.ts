export interface PurchaseEvent {
  id: string;
  userId: string;
  productName: string;
  productDescription?: string;
  purchasePrice: number;
  purchaseDate: string;
  retailer: string;
  orderNumber?: string;
  receiptImageUrl?: string;
  source: 'email' | 'browser' | 'mobile' | 'bank';
  rawData: any;
}

export interface EnrichmentJob {
  id: string;
  productId: string;
  userId: string;
  type: 'product_intelligence' | 'warranty_intelligence';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ValueOpportunity {
  id: string;
  productId: string;
  userId: string;
  type: 'warranty_claim' | 'cash_extraction' | 'maintenance' | 'upgrade';
  title: string;
  description: string;
  potentialValue: number;
  confidence: number;
  actionRequired: string;
  createdAt: string;
}

export interface AgentAlert {
  id: string;
  userId: string;
  type: 'opportunity' | 'warning' | 'info';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  createdAt: string;
  read: boolean;
}
