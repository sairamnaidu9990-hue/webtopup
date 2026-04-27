export type Review = {
  _id: string;
  invoiceNumber: string;
  gameSnapshot: {
    name: string;
    code: string;
    provider: string;
    category: string;
    logo: string;
  };
  customerDisplay: string;
  rating: number;
  comment: string;
  isCommentHidden: boolean;
  adminNote: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ReviewSummary = {
  totalReviews: number;
  averageRating: number;
  hiddenComments: number;
};
