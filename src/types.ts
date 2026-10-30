export interface Restaurant {
  name: string;
  image: string;
  fit: number;
  star: string;
  distance: number;
  type: string;
  menu: string;
  desc: string;
  tag: string;
  dietary: string[];
  allergens: string[];
  price: number;
  openNow: boolean;
  keywords: string[];
}
export interface Review {
  id?: string;
  restaurantId?: number;
  name: string;
  star: number;
  text: string;
  image: string;
  tag: string;
  date: string;
  glucose?: number | null;
  criteria?: string[];
  reaction?: string;
  photos?: string[];
}
export interface MemberPreferences {
  locationPlace?: string;
  locationAddress?: string;
  switch0?: boolean;
  switch1?: boolean;
  helpful?: string[];
}
export interface MemberData {
  saved: number[];
  reviews: Review[];
  health: string[];
  recentQueries: string[];
  prefs: MemberPreferences;
  selectedFilters: string[];
  category: string;
  searchCategory: string;
  sort: string;
  safe: boolean;
}
