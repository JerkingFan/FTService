import type { Part } from "../types";

/** Стоковые фото автозапчастей (Unsplash) для демо-ленты */
export const STOCK_PART_PHOTOS = [
  "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1617814076668-b9ac2d33f0cf?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1597008641621-0f16f3d0f5d5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1605559424843-9c7f4d7a1a08?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1612810806560-4cbdb0254f1b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1583267746897-2cf415887172?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1625046732392-fb5df929a8b9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1615904702203-008ec61951cc?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1601362840469-51e4d8d229c5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518611012118-f0c5d3a8c0ef?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1471478331149-c72f17e66f42?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1489824914135-041abeaadff5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1533473359331-0135ef1b58dd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1583121274602-3e2820c9e5b7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d1?auto=format&fit=crop&w=1200&q=80",
];

export function partImages(part: Part): string[] {
  if (part.images?.length) return part.images;
  if (part.image_url) return [part.image_url];
  return [];
}

/** Минимум 4 фото на объявление для ленты-шортсов */
export function enrichPartImages(part: Part, min = 5): Part {
  const existing = [...partImages(part)];
  const used = new Set(existing);
  let i = 0;
  while (existing.length < min && i < STOCK_PART_PHOTOS.length * 2) {
    const url = STOCK_PART_PHOTOS[(part.id * 3 + i) % STOCK_PART_PHOTOS.length];
    i += 1;
    if (!used.has(url)) {
      existing.push(url);
      used.add(url);
    }
  }
  if (existing.length === 0) {
    existing.push(STOCK_PART_PHOTOS[part.id % STOCK_PART_PHOTOS.length]);
  }
  return { ...part, images: existing, image_url: existing[0] };
}
