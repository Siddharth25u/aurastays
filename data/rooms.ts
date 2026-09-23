
export type Room = {
  id: string;
  hotelSlug: string;
  name: string;
  type: string;
  description: string;
  price: number;
  maxGuests: number;
  bed: string;
  size: string;
  image: string;
  amenities: string[];
};

export const rooms: Room[] = [
  {
    id: "grand-himalayan-deluxe",
    hotelSlug: "grand-himalayan",
    name: "Deluxe Mountain Room",
    type: "Deluxe Room",
    description:
      "A beautifully designed room with warm interiors, comfortable furnishings and peaceful Himalayan views.",
    price: 8499,
    maxGuests: 2,
    bed: "King Bed",
    size: "420 sq ft",
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=85",
    amenities: [
      "Mountain View",
      "Free Wi-Fi",
      "Air Conditioning",
      "Breakfast",
      "Smart TV",
      "Private Bathroom",
    ],
  },
  {
    id: "grand-himalayan-suite",
    hotelSlug: "grand-himalayan",
    name: "Himalayan Luxury Suite",
    type: "Luxury Suite",
    description:
      "An expansive luxury suite featuring elegant interiors, a private sitting area and panoramic mountain views.",
    price: 12499,
    maxGuests: 3,
    bed: "King Bed",
    size: "680 sq ft",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85",
    amenities: [
      "Panoramic View",
      "Free Wi-Fi",
      "Air Conditioning",
      "Breakfast",
      "Living Area",
      "Private Bathroom",
    ],
  },
  {
    id: "palm-retreat-deluxe",
    hotelSlug: "palm-retreat",
    name: "Deluxe Poolside Room",
    type: "Deluxe Room",
    description:
      "A stylish tropical room located close to the pool, designed for a relaxed Goan getaway.",
    price: 7299,
    maxGuests: 2,
    bed: "King Bed",
    size: "400 sq ft",
    image:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=85",
    amenities: [
      "Pool Access",
      "Free Wi-Fi",
      "Air Conditioning",
      "Breakfast",
      "Smart TV",
      "Private Bathroom",
    ],
  },
  {
    id: "palm-retreat-suite",
    hotelSlug: "palm-retreat",
    name: "Palm Luxury Suite",
    type: "Luxury Suite",
    description:
      "A spacious coastal suite combining contemporary luxury with a calm tropical atmosphere.",
    price: 10999,
    maxGuests: 3,
    bed: "King Bed",
    size: "650 sq ft",
    image:
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1400&q=85",
    amenities: [
      "Beach Access",
      "Free Wi-Fi",
      "Air Conditioning",
      "Breakfast",
      "Living Area",
      "Mini Bar",
    ],
  },
  {
    id: "royal-heritage-deluxe",
    hotelSlug: "royal-heritage-palace",
    name: "Royal Deluxe Room",
    type: "Heritage Room",
    description:
      "A regal room inspired by Rajasthan's heritage architecture with modern luxury and comfort.",
    price: 9499,
    maxGuests: 2,
    bed: "King Bed",
    size: "450 sq ft",
    image:
      "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1400&q=85",
    amenities: [
      "Heritage View",
      "Free Wi-Fi",
      "Air Conditioning",
      "Breakfast",
      "Smart TV",
      "Private Bathroom",
    ],
  },
  {
    id: "royal-heritage-suite",
    hotelSlug: "royal-heritage-palace",
    name: "Royal Palace Suite",
    type: "Luxury Suite",
    description:
      "A grand palace-inspired suite featuring traditional details, luxurious furnishings and generous living space.",
    price: 13999,
    maxGuests: 3,
    bed: "King Bed",
    size: "720 sq ft",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85",
    amenities: [
      "Palace View",
      "Free Wi-Fi",
      "Air Conditioning",
      "Breakfast",
      "Living Area",
      "Private Balcony",
    ],
  },
  {
    id: "mountain-mist-deluxe",
    hotelSlug: "mountain-mist-resort",
    name: "Mountain View Room",
    type: "Deluxe Room",
    description:
      "A cozy mountain room with panoramic views, warm interiors and everything needed for a peaceful retreat.",
    price: 6199,
    maxGuests: 2,
    bed: "Queen Bed",
    size: "380 sq ft",
    image:
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=85",
    amenities: [
      "Mountain View",
      "Free Wi-Fi",
      "Heating",
      "Breakfast",
      "Smart TV",
      "Private Bathroom",
    ],
  },
  {
    id: "mountain-mist-suite",
    hotelSlug: "mountain-mist-resort",
    name: "Mountain Luxury Suite",
    type: "Luxury Suite",
    description:
      "A spacious high-altitude suite with a private sitting area and breathtaking views of the surrounding mountains.",
    price: 9999,
    maxGuests: 3,
    bed: "King Bed",
    size: "620 sq ft",
    image:
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1400&q=85",
    amenities: [
      "Panoramic View",
      "Free Wi-Fi",
      "Heating",
      "Breakfast",
      "Fireplace",
      "Private Balcony",
    ],
  },
];