"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, MapPin, Sparkles, WandSparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type HotelRow = {
  id: string;
  slug?: string | null;
  name?: string | null;
  location?: string | null;
  city?: string | null;
  type?: string | null;
  property_type?: string | null;
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  cover_image?: string | null;
  amenities?: string[] | string | null;
  price?: number | string | null;
  price_per_night?: number | string | null;
};

type Hotel = {
  id: string;
  slug: string;
  name: string;
  location: string;
  type: string;
  description: string;
  image: string;
  amenities: string[];
  price: number;
};

const moods = [
  { id: "unwind", title: "Slow & serene", subtitle: "Spa days, quiet views and time to recharge", words: ["spa", "pool", "peace", "serene", "relax", "wellness", "retreat", "quiet", "nature"] },
  { id: "adventure", title: "Outdoors & adventure", subtitle: "Mountains, trails and days outside", words: ["mountain", "adventure", "trek", "hiking", "nature", "view", "outdoor", "forest", "alpine"] },
  { id: "romance", title: "A little romance", subtitle: "Intimate escapes and memorable moments", words: ["romantic", "private", "couple", "luxury", "suite", "candle", "beach", "view"] },
  { id: "culture", title: "Culture & character", subtitle: "Heritage, local flavour and distinctive stays", words: ["heritage", "palace", "culture", "history", "traditional", "local", "architecture", "royal"] },
  { id: "coast", title: "Coastal reset", subtitle: "Beach air, sunshine and laid-back living", words: ["beach", "coast", "sea", "ocean", "pool", "goa", "water", "tropical"] },
];

function normalizeAmenities(value: HotelRow["amenities"]): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
    } catch { /* Use comma-separated values below. */ }
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function getPrice(value: unknown): number {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

export default function AuraMatchPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mood, setMood] = useState("unwind");
  const [budget, setBudget] = useState("any");
  const [surpriseId, setSurpriseId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data, error }, { data: rooms }] = await Promise.all([
        supabase.from("hotels").select("*"),
        supabase.from("rooms").select("*"),
      ]);
      if (!active) return;
      if (error) {
        setLoadError("We couldn't load stays right now. Please try again in a moment.");
        setLoading(false);
        return;
      }
      const roomPrices = new Map<string, number[]>();
      (rooms ?? []).forEach((room: Record<string, unknown>) => {
        const hotelId = String(room.hotel_id ?? room.property_id ?? room.hotelId ?? "");
        const price = getPrice(room.price ?? room.price_per_night ?? room.base_price ?? room.nightly_price);
        if (hotelId && price) roomPrices.set(hotelId, [...(roomPrices.get(hotelId) ?? []), price]);
      });
      const mapped = ((data ?? []) as HotelRow[]).map((row) => {
        const name = row.name?.trim() || "AURASTAYS property";
        const amenities = normalizeAmenities(row.amenities);
        const prices = roomPrices.get(String(row.id)) ?? [];
        return {
          id: String(row.id),
          slug: row.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + String(row.id).slice(0, 8),
          name,
          location: row.location || row.city || "Location unavailable",
          type: row.type || row.property_type || "Hotel",
          description: row.description || "",
          image: row.image || row.image_url || row.cover_image || "",
          amenities,
          price: prices.length ? Math.min(...prices) : getPrice(row.price ?? row.price_per_night),
        };
      });
      setHotels(mapped);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const selectedMood = moods.find((item) => item.id === mood) ?? moods[0];
  const matched = useMemo(() => {
    const maxBudget = budget === "any" ? Infinity : Number(budget);
    return hotels
      .filter((hotel) => !hotel.price || hotel.price <= maxBudget)
      .map((hotel) => {
        const searchable = [hotel.name, hotel.location, hotel.type, hotel.description, ...hotel.amenities].join(" ").toLowerCase();
        const score = selectedMood.words.reduce((sum, word) => sum + (searchable.includes(word) ? 1 : 0), 0);
        return { hotel, score };
      })
      .sort((a, b) => b.score - a.score || (a.hotel.price || Infinity) - (b.hotel.price || Infinity));
  }, [hotels, budget, selectedMood]);

  const surprise = matched.find((item) => item.hotel.id === surpriseId)?.hotel ?? null;
  const results = surprise ? [surprise, ...matched.map((item) => item.hotel).filter((hotel) => hotel.id !== surprise.id)] : matched.map((item) => item.hotel);

  const pickSurprise = () => {
    if (!matched.length) return;
    const pool = matched.slice(0, Math.max(1, Math.min(5, matched.length)));
    setSurpriseId(pool[Math.floor(Math.random() * pool.length)].hotel.id);
  };

  return (
    <main className="min-h-screen bg-[#11110e] text-white">
      <Navbar />
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-36 sm:px-8 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"><ArrowLeft size={16}/> Back to home</Link>
        <div className="mt-10 grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.28em] text-[#e7c78b]"><Sparkles size={15}/> A more personal way to stay</p>
            <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">Find a stay that <span className="font-serif italic font-normal text-[#e7c78b]">feels like you.</span></h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/55">Tell Aura what kind of escape you have in mind. We'll match your mood with stays in our collection.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:p-8">
            <div className="flex items-center gap-2 text-[#e7c78b]"><Compass size={18}/><span className="text-xs font-semibold uppercase tracking-[.2em]">Your Aura Match</span></div>
            <h2 className="mt-5 text-xl font-semibold">What are you in the mood for?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {moods.map((item) => (
                <button key={item.id} type="button" onClick={() => { setMood(item.id); setSurpriseId(null); }} aria-pressed={mood === item.id} className={`rounded-2xl border p-4 text-left transition ${mood === item.id ? "border-[#e7c78b] bg-[#e7c78b]/10" : "border-white/10 bg-black/10 hover:border-white/25"}`}>
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-white/45">{item.subtitle}</span>
                </button>
              ))}
            </div>
            <label htmlFor="aura-budget" className="mt-6 block text-xs font-semibold uppercase tracking-wider text-white/55">Maximum nightly budget</label>
            <select id="aura-budget" value={budget} onChange={(event) => { setBudget(event.target.value); setSurpriseId(null); }} className="mt-2 w-full rounded-xl border border-white/15 bg-[#1b1b17] px-4 py-3 text-sm text-white outline-none focus:border-[#e7c78b]">
              <option value="any">No limit</option>
              <option value="3000">Up to ₹3,000</option>
              <option value="5000">Up to ₹5,000</option>
              <option value="8000">Up to ₹8,000</option>
              <option value="12000">Up to ₹12,000</option>
            </select>
            <button type="button" onClick={pickSurprise} disabled={!matched.length || loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e7c78b] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"><WandSparkles size={17}/> Surprise me with a stay</button>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div><p className="text-xs uppercase tracking-[.25em] text-[#e7c78b]">Curated for your mood</p><h2 className="mt-2 text-2xl font-semibold">{selectedMood.title}</h2></div>
          <p className="text-sm text-white/45">{loading ? "Finding your matches…" : `${matched.length} ${matched.length === 1 ? "stay" : "stays"} to explore`}</p>
        </div>

        {loading ? <div className="py-20 text-center text-sm text-white/50">Finding stays that fit your mood…</div> : loadError ? <div className="py-16 text-center text-sm text-red-300">{loadError}</div> : results.length === 0 ? <div className="py-16 text-center"><p className="text-lg font-medium">No close matches just yet</p><p className="mt-2 text-sm text-white/45">Try a higher budget or a different mood to explore more stays.</p></div> : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((hotel, index) => (
              <article key={hotel.id} className={`overflow-hidden rounded-3xl border bg-white/[.04] ${index === 0 && surprise ? "border-[#e7c78b]/70" : "border-white/10"}`}>
                <Link href={`/hotel/${hotel.slug}`} className="group relative block aspect-[4/3] overflow-hidden bg-white/5">
                  {hotel.image ? <img src={hotel.image} alt={hotel.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center text-sm text-white/35">Image unavailable</div>}
                  {index === 0 && surprise && <span className="absolute left-4 top-4 rounded-full bg-[#e7c78b] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black">Aura's surprise pick</span>}
                </Link>
                <div className="p-5">
                  <p className="flex items-center gap-1.5 text-xs text-white/45"><MapPin size={13}/>{hotel.location}</p>
                  <h3 className="mt-2 text-lg font-semibold">{hotel.name}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/45">{hotel.description || hotel.type}</p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <div>{hotel.price > 0 ? <><span className="text-lg font-semibold text-[#e7c78b]">₹{hotel.price.toLocaleString("en-IN")}</span><span className="ml-1 text-xs text-white/40">/ night</span></> : <span className="text-xs text-white/40">Price on request</span>}</div>
                    <Link href={`/hotel/${hotel.slug}`} className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold transition hover:border-[#e7c78b] hover:text-[#e7c78b]">Explore stay</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
