
"use client";

import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { Hotel } from "@/data/hotels";
import { supabase } from "@/lib/supabase";
import { HOTEL_DB_IDS } from "@/data/supabaseIds";

type HotelCardProps = {
  hotel: Hotel;
};

type ReviewRating = {
  rating: number;
};

export default function HotelCard({ hotel }: HotelCardProps) {
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const hotelId = HOTEL_DB_IDS[hotel.slug];

  /*
   * Read search parameters safely in the browser.
   * This avoids useSearchParams() build errors.
   */

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    setCheckIn(params.get("checkIn") || "");
    setCheckOut(params.get("checkOut") || "");
    setGuests(params.get("guests") || "2");
  }, []);

  /*
   * Load hotel ratings and subscribe to
   * real-time review updates.
   */

  useEffect(() => {
    if (!hotelId) {
      setRating(0);
      setReviewCount(0);
      return;
    }

    let isMounted = true;

    const loadRating = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("hotel_id", hotelId);

      if (error) {
        console.error(
          "Hotel card rating error:",
          error
        );
        return;
      }

      if (!isMounted) return;

      const reviews = (data ?? []) as ReviewRating[];
      const count = reviews.length;

      const totalRating = reviews.reduce(
        (sum, review) =>
          sum + Number(review.rating || 0),
        0
      );

      const averageRating =
        count > 0
          ? Number((totalRating / count).toFixed(1))
          : 0;

      setRating(averageRating);
      setReviewCount(count);
    };

    loadRating();

    const channel = supabase
      .channel(`hotel-card-rating-${hotelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `hotel_id=eq.${hotelId}`,
        },
        loadRating
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [hotelId]);

  /*
   * Load the current user's favorite status.
   */

  useEffect(() => {
    if (!hotelId) return;

    let isMounted = true;

    const loadFavorite = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("hotel_id", hotelId)
        .maybeSingle();

      if (error) {
        console.error(
          "Favorite loading error:",
          error
        );
        return;
      }

      if (isMounted) {
        setIsFavorite(Boolean(data));
      }
    };

    loadFavorite();

    return () => {
      isMounted = false;
    };
  }, [hotelId]);

  /*
   * Add or remove the hotel from favorites.
   */

  const handleFavorite = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (favoriteLoading || !hotelId) return;

    setFavoriteLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "Please login to save your favorite hotels."
        );
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("hotel_id", hotelId);

        if (error) throw error;

        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({
            user_id: user.id,
            hotel_id: hotelId,
          });

        if (error) throw error;

        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Favorite error:", error);

      alert(
        "Unable to update favorite. Please try again."
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  /*
   * Preserve search parameters in hotel links.
   */

  const hotelParams = new URLSearchParams();

  if (checkIn) {
    hotelParams.set("checkIn", checkIn);
  }

  if (checkOut) {
    hotelParams.set("checkOut", checkOut);
  }

  if (guests) {
    hotelParams.set("guests", guests);
  }

  const hotelUrl = `/hotel/${hotel.slug}${
    hotelParams.toString()
      ? `?${hotelParams.toString()}`
      : ""
  }`;

  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl">
      {/* Hotel Image */}

      <div className="relative aspect-[4/3] overflow-hidden">
        <Link
          href={hotelUrl}
          aria-label={`View ${hotel.name}`}
          className="block h-full w-full"
        >
          <img
            src={hotel.image}
            alt={hotel.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Favorite Button */}

        <button
          type="button"
          aria-label={
            isFavorite
              ? `Remove ${hotel.name} from favorites`
              : `Save ${hotel.name}`
          }
          aria-pressed={isFavorite}
          disabled={favoriteLoading}
          onClick={handleFavorite}
          className="absolute right-4 top-4 rounded-full bg-white/90 p-2.5 text-neutral-800 shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
        >
          <Heart
            size={18}
            className={
              isFavorite
                ? "fill-red-500 text-red-500"
                : "text-neutral-800"
            }
          />
        </button>

        {/* Hotel Type */}

        <div className="absolute bottom-4 left-4 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
          {hotel.type}
        </div>
      </div>

      {/* Hotel Details */}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href={hotelUrl} className="block">
              <h3 className="text-lg font-semibold text-neutral-900 transition hover:text-neutral-600">
                {hotel.name}
              </h3>
            </Link>

            <div className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
              <MapPin size={14} />
              <span>{hotel.location}</span>
            </div>
          </div>

          {/* Rating */}

          <div
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-neutral-900"
            title={`${reviewCount} reviews`}
          >
            <Star
              size={14}
              className="fill-current"
            />

            <span>{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Review Count */}

        <p className="mt-1 text-xs text-neutral-400">
          {reviewCount}{" "}
          {reviewCount === 1
            ? "verified review"
            : "verified reviews"}
        </p>

        {/* Amenities */}

        <div className="mt-4 flex flex-wrap gap-2">
          {hotel.amenities
            .slice(0, 3)
            .map((amenity) => (
              <span
                key={amenity}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600"
              >
                {amenity}
              </span>
            ))}
        </div>

        {/* Price and Action */}

        <div className="mt-5 flex items-end justify-between border-t border-neutral-100 pt-4">
          <div>
            <span className="text-xl font-semibold text-neutral-900">
              ₹{hotel.price.toLocaleString("en-IN")}
            </span>

            <span className="ml-1 text-sm text-neutral-500">
              / night
            </span>
          </div>

          <Link
            href={hotelUrl}
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            View Stay
          </Link>
        </div>
      </div>
    </article>
  );
}