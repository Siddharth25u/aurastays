"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";

import { supabase } from "@/lib/supabase";

type HotelRatingProps = {
  hotelSlug: string;
};

type ReviewRating = {
  rating: number;
};

export default function HotelRating({
  hotelSlug,
}: HotelRatingProps) {
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadRating = useCallback(async () => {
    try {
      /*
       * Resolve the actual Supabase hotel ID using slug.
       * No HOTEL_DB_IDS mapping required.
       */

      const { data: hotel, error: hotelError } = await supabase
        .from("hotels")
        .select("id")
        .eq("slug", hotelSlug)
        .maybeSingle();

      if (hotelError) {
        console.error(
          "Hotel lookup error:",
          hotelError
        );

        setRating(0);
        setReviewCount(0);
        setLoading(false);

        return;
      }

      if (!hotel?.id) {
        console.error(
          `Hotel not found for slug: ${hotelSlug}`
        );

        setRating(0);
        setReviewCount(0);
        setLoading(false);

        return;
      }

      /*
       * Load reviews.
       */

      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("hotel_id", hotel.id);

      if (error) {
        console.error(
          "Hotel rating error:",
          error
        );

        setRating(0);
        setReviewCount(0);
        setLoading(false);

        return;
      }

      const reviews = (data ?? []) as ReviewRating[];

      const count = reviews.length;

      const totalRating = reviews.reduce(
        (sum, review) =>
          sum + Number(review.rating || 0),
        0
      );

      const averageRating =
        count > 0
          ? Number(
              (totalRating / count).toFixed(1)
            )
          : 0;

      setRating(averageRating);
      setReviewCount(count);
      setLoading(false);

      /*
       * Return hotel ID so realtime can use it.
       */

      return hotel.id;
    } catch (error) {
      console.error(
        "Hotel rating exception:",
        error
      );

      setRating(0);
      setReviewCount(0);
      setLoading(false);
    }
  }, [hotelSlug]);

  useEffect(() => {
    let channel:
      | ReturnType<typeof supabase.channel>
      | null = null;

    let cancelled = false;

    const setup = async () => {
      const hotelId = await loadRating();

      if (!hotelId || cancelled) return;

      channel = supabase
        .channel(`hotel-rating-${hotelId}-${Date.now()}`)
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
    };

    setup();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadRating]);

  if (loading) {
    return (
      <div className="mt-4 flex items-center gap-3">
        <div className="h-9 w-16 animate-pulse rounded-full bg-neutral-200" />

        <div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">

      <div className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">

        <Star
          size={15}
          className="fill-current"
        />

        {rating.toFixed(1)}

      </div>

      <span className="text-sm text-neutral-500">
        {reviewCount}{" "}
        {reviewCount === 1
          ? "verified review"
          : "verified reviews"}
      </span>

    </div>
  );
}