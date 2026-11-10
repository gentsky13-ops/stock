// Client-safe shapes shared between server and UI.

export type Format = "ae" | "pr" | "both";

export interface SceneCategory {
  name: string;
  count: number;
}

export interface Scene {
  image: string;
  category: string;
}

export interface CustomFeature {
  title: string;
  text: string;
}

export interface Product {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  hasAe: boolean;
  hasPr: boolean;
  motionbro: boolean;
  autoresize: boolean;
  featured: boolean;
  featuredOrder: number;
  priceAe: number | null; // cents
  pricePr: number | null;
  priceBoth: number | null;
  salePercent: number;
  tags: string[];
  filesIncluded: string[];
  sizeLabel: string;
  resolution: string;
  elementsCount: number | null;
  customFeatures: CustomFeature[];
  categories: SceneCategory[];
  scenes: Scene[];
  previewImage: string;
  previewVideo: string;
  createdAt: string;
  sales: number;
  rating: number;
  reviewCount: number;
}

export interface Review {
  id: number;
  productId: number;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
  verified: boolean;
}

export interface CartItem {
  productId: number;
  format: Format;
  license: "standard" | "multi";
}

export interface SessionUser {
  id: number;
  email: string;
  name: string | null;
}
