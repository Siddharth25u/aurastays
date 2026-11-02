"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, MapPin, ArrowRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type SavedHotel = { id: string; slug: string; name: string; location: string | null; type: string | null; image: string | null; price: number | string | null };
type Favorite = { id: string; hotel_id: string; hotels: SavedHotel | SavedHotel[] | null };

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data, error } = await supabase.from("favorites")
        .select("id, hotel_id, hotels(id, slug, name, location, type, image, price)")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) console.error("Error loading favorites:", error);
      else if (mounted) setFavorites((data ?? []) as Favorite[]);
      if (mounted) setLoading(false);
    };
    loadFavorites();
    return () => { mounted = false; };
  }, [router]);

  const removeFavorite = async (favoriteId: string) => {
    setRemovingId(favoriteId);
    const { error } = await supabase.from("favorites").delete().eq("id", favoriteId);
    if (error) { console.error("Error removing favorite:", error); setRemovingId(null); return; }
    setFavorites(current => current.filter(favorite => favorite.id !== favoriteId));
    setRemovingId(null);
  };

  return (
    <main className="min-h-screen bg-[#11110f] text-white">
      <Navbar />
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-36 sm:px-8 lg:px-10">
        <div className="mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#e7c78b]">Your Collection</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Liked Hotels</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/55">Your saved stays, collected in one place.</p>
        </div>
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center"><p className="text-sm text-white/50">Loading your favorites...</p></div>
        ) : favorites.length === 0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 text-center">
            <Heart size={42} strokeWidth={1.2} className="mb-5 text-[#e7c78b]" />
            <h2 className="text-xl font-medium">No saved hotels yet</h2>
            <p className="mt-3 max-w-md text-sm text-white/50">Explore our hotels and save the stays you love.</p>
            <Link href="/search" className="mt-7 rounded-full bg-[#e7c78b] px-6 py-3 text-sm font-semibold text-black transition hover:bg-white">Explore Hotels</Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map(favorite => {
              const hotel = Array.isArray(favorite.hotels) ? favorite.hotels[0] : favorite.hotels;
              if (!hotel) return null;
              const price = Number(hotel.price) || 0;
              const isRemoving = removingId === favorite.id;
              return (
                <article key={favorite.id} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                  <div className="relative h-64 overflow-hidden">
                    <img src={hotel.image || "/placeholder-hotel.jpg"} alt={hotel.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <button type="button" onClick={() => removeFavorite(favorite.id)} disabled={isRemoving} aria-label={`Remove ${hotel.name} from favorites`} className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/40 p-3 text-white backdrop-blur-md transition hover:bg-red-500/80 disabled:opacity-50"><Trash2 size={16} /></button>
                    <div className="absolute bottom-4 left-5"><span className="rounded-full bg-[#e7c78b] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">{hotel.type || "Hotel"}</span></div>
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-medium">{hotel.name}</h2>
                    <div className="mt-2 flex items-center gap-2 text-sm text-white/55"><MapPin size={14} />{hotel.location || "Location unavailable"}</div>
                    <div className="mt-5 flex items-end justify-between">
                      <div><p className="text-xs text-white/40">Starting from</p><p className="mt-1 text-lg font-semibold text-[#e7c78b]">{price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Price unavailable"}<span className="text-xs font-normal text-white/45">{price > 0 ? " / night" : ""}</span></p></div>
                      <Link href={`/hotel/${hotel.slug}`} className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-white transition hover:border-[#e7c78b] hover:text-[#e7c78b]">View <ArrowRight size={14} /></Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
