
"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { HOTEL_DB_IDS } from "@/data/supabaseIds";

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

  const hotelId = HOTEL_DB_IDS[hotelSlug];

  const loadRating = useCallback(async () => {
    if (!hotelId) {
      console.error(`Hotel ID not found for slug: ${hotelSlug}`);

      setRating(0);
      setReviewCount(0);
      setLoading(false);

      return;
    }

    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("hotel_id", hotelId);

    if (error) {
      console.error("Hotel rating error:", error);

      setRating(0);
      setReviewCount(0);
      setLoading(false);

      return;
    }

    const reviews = (data ?? []) as ReviewRating[];

    const count = reviews.length;

    const totalRating = reviews.reduce(
      (sum, review) => sum + Number(review.rating),
      0
    );

    const averageRating =
      count > 0
        ? Number((totalRating / count).toFixed(1))
        : 0;

    setRating(averageRating);
    setReviewCount(count);
    setLoading(false);
  }, [hotelId, hotelSlug]);

  useEffect(() => {
    if (!hotelId) {
      loadRating();
      return;
    }

    loadRating();

    const channel = supabase
      .channel(`hotel-rating-${hotelId}`)
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
      supabase.removeChannel(channel);
    };
  }, [hotelId, loadRating]);

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
        <Star size={15} className="fill-current" />
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