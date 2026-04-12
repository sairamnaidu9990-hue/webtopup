export type VariantGame = {
  _id: string;
  name: string;
  code?: string;
  variantCategories?: Array<{
    _id: string;
    name: string;
    order: number;
  }>;
};

export type Variant = {
  _id: string;
  name: string;
  providerCode: string;
  productCode?: string;
  basePrice: number;
  markup: number;
  price: number;
  currency?: string;
  duration?: number;
  region?: string;
  logo?: string;
  status?: string;
  syncSource?: string;
  variantCategoryId?: string;
  game?: VariantGame;
};
