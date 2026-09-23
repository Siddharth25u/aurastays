
"use client";

import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
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

export default function HotelCard({
  hotel,
}: HotelCardProps) {
  const searchParams = useSearchParams();

  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const hotelId = HOTEL_DB_IDS[hotel.slug];

  /*
   * Load real-time rating from Supabase.
   */
  useEffect(() => {
    if (!hotelId) {
      console.error(
        `Hotel ID not found for slug: ${hotel.slug}`
      );

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

        if (isMounted) {
          setRating(0);
          setReviewCount(0);
        }

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

    /*
     * Real-time updates whenever reviews change.
     */
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
        () => {
          loadRating();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [hotelId, hotel.slug]);

  /*
   * Preserve search information.
   */
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "2";

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

        {/* Favorite */}
        <button
          type="button"
          aria-label={`Save ${hotel.name}`}
          onClick={(event) => {
            event.preventDefault();
          }}
          className="absolute right-4 top-4 rounded-full bg-white/90 p-2.5 text-neutral-800 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <Heart size={18} />
        </button>

        {/* Hotel Type */}
        <div className="absolute bottom-4 left-4 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
          {hotel.type}
        </div>
      </div>

      {/* Hotel Information */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={hotelUrl}
              className="block"
            >
              <h3 className="text-lg font-semibold text-neutral-900 transition hover:text-neutral-600">
                {hotel.name}
              </h3>
            </Link>

            <div className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
              <MapPin size={14} />
              <span>{hotel.location}</span>
            </div>
          </div>

          {/* Dynamic Rating */}
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

        {/* Price + View Stay */}
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