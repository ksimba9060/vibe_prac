// Static food photos, kept independent of remote restaurant rows so old demo
// images in Supabase never reintroduce screenshot UI into the food cards.
const categoryPhotos: Record<string, string[]> = {
  한식: ["korean-table", "korean-bowl"],
  양식: ["western-plate", "western-pasta"],
  "샐러드/포케": ["salad-fresh", "salad-grain"],
  일식: ["japanese-sushi", "japanese-rolls"],
  중식: ["chinese-dumplings", "chinese-rice"],
};
export function getRestaurantImage(
  restaurant: { name?: string; type?: string; menu?: string; image?: string },
  variant: "cover" | "detail" = "cover",
) {
  const photos = categoryPhotos[restaurant.type || ""];
  if (!photos) return restaurant.image || "salad-fresh";
  let index =
    Array.from(restaurant.name || "").reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0,
    ) % photos.length;
  if (restaurant.type === "양식")
    index = restaurant.menu?.includes("파스타") ? 1 : 0;
  if (restaurant.type === "중식")
    index = restaurant.menu?.includes("밥") ? 1 : 0;
  if (restaurant.type === "일식" && restaurant.menu?.includes("소바"))
    return variant === "cover" ? "chinese-noodles" : "japanese-rolls";
  return photos[(index + (variant === "detail" ? 1 : 0)) % photos.length];
}
