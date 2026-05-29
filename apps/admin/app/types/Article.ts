export type AdminArticle = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  status: "DRAFT" | "PUBLISHED";
  category: "GAME" | "EVENT" | "PROMO" | "TOPUP_GUIDE";
  relatedGame?: {
    gameId: string;
    name: string;
    code: string;
    logo: string;
    provider: string;
    category: string;
  } | null;
  isFeatured: boolean;
  sortOrder: number;
  readingMinutes: number;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: {
    adminId: string;
    name: string;
    email: string;
    role: string;
  } | null;
  updatedBy?: {
    adminId: string;
    name: string;
    email: string;
    role: string;
  } | null;
};
