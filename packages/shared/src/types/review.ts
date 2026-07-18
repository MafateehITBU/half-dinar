export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewSummary {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  createdAt: string;
  userName: string;
  images: { id: string; url: string }[];
}

export interface ProductReviews {
  avgRating: number;
  reviewCount: number;
  reviews: ReviewSummary[];
}
