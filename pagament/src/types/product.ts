export type ProductCycle = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "ANNUALLY";

export interface CreateProductRequest {
  externalId: string;
  name: string;
  price: number;
  currency: "BRL";
  description?: string;
  imageUrl?: string | null;
  fileUrl?: string;
  cycle?: ProductCycle | null;
  trialDays?: number;
}

export interface ProductResponse {
  id: string;
  externalId: string;
  name: string;
  description: string | null;
  price: number;
  currency: "BRL";
  status: string;
  devMode: boolean;
  imageUrl: string | null;
  cycle: ProductCycle | null;
  trialDays?: number | null;
  hasFile: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  search?: string;
  after?: string;
  before?: string;
  limit?: number;
  id?: string;
}
