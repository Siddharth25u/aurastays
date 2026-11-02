export type Hotel = {
  id: string;
  slug: string;
  name: string;
  location: string;
  type: string;
  rating: number;
  reviews: number;
  price: number;
  image: string;
  description: string;
  amenities: string[];
};

export const hotels: Hotel[] = [
  {
    id: "1",
    slug: "grand-himalayan",
    name: "The Grand Himalayan",
    location: "Dehradun, Uttarakhand",
    type: "Luxury Resort",
    rating: 4.9,
    reviews: 328,
    price: 8499,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
    description:
      "A refined mountain retreat surrounded by Himalayan landscapes, elegant interiors and peaceful luxury.",
    amenities: ["Pool", "Spa", "Breakfast", "Wi-Fi"],
  },

  {
    id: "2",
    slug: "palm-retreat",
    name: "The Palm Retreat",
    location: "North Goa",
    type: "Beach Resort",
    rating: 4.8,
    reviews: 412,
    price: 7299,
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=85",
    description:
      "A tropical escape combining contemporary design, warm hospitality and effortless coastal living.",
    amenities: ["Beach Access", "Pool", "Bar", "Wi-Fi"],
  },

  {
    id: "3",
    slug: "royal-heritage-palace",
    name: "Royal Heritage Palace",
    location: "Jaipur, Rajasthan",
    type: "Heritage Hotel",
    rating: 4.9,
    reviews: 267,
    price: 9499,
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=85",
    description:
      "Experience timeless Rajasthani architecture blended with modern comfort and exceptional hospitality.",
    amenities: ["Restaurant", "Spa", "Pool", "Wi-Fi"],
  },

  {
    id: "4",
    slug: "mountain-mist-resort",
    name: "Mountain Mist Resort",
    location: "Manali, Himachal Pradesh",
    type: "Mountain Resort",
    rating: 4.7,
    reviews: 193,
    price: 6199,
    image:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=85",
    description:
      "A serene high-altitude getaway offering panoramic mountain views, cozy rooms and premium amenities.",
    amenities: ["Mountain View", "Restaurant", "Fireplace", "Wi-Fi"],
  },
];