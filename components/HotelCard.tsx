"use client";

import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { Hotel } from "@/data/hotels";
import { supabase } from "@/lib/supabase";

type HotelCardProps = {
  hotel: Hotel & {
    dbId?: string;
    startingPrice?: number;
  };
};

type ReviewRating = {
  rating: number | string;
};

export default function HotelCard({ hotel }: HotelCardProps) {
  const [rating, setRating] = useState(
    Number(hotel.rating || 0)
  );

  const [reviewCount, setReviewCount] = useState(
    Number(hotel.reviews || 0)
  );

  const [price, setPrice] = useState(
    Number(
      hotel.startingPrice ??
        hotel.price ??
        0
    )
  );

  const [databaseHotelId, setDatabaseHotelId] = useState<string | null>(hotel.dbId ?? null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  /*
   * ============================================================
   * SEARCH PARAMETERS
   * ============================================================
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
   * ============================================================
   * LOAD PRICE + RATINGS
   * ============================================================
   *
   * IMPORTANT:
   *
   * We DO NOT use HOTEL_DB_IDS.
   *
   * hotel.dbId is the actual UUID coming from Supabase.
   *
   * This means new hotels automatically work.
   */

  useEffect(() => {
    const databaseHotelId = hotel.dbId;

    if (!databaseHotelId) {
      console.warn(
        `No database ID available for hotel: ${hotel.slug}`
      );

      return;
    }

    let mounted = true;

    const loadHotelData = async () => {
      /*
       * ========================================================
       * LOAD ROOMS
       * ========================================================
       */

      const {
        data: rooms,
        error: roomsError,
      } = await supabase
        .from("rooms")
        .select("*")
        .eq("hotel_id", databaseHotelId);

      if (roomsError) {
        console.error(
          "Hotel rooms error:",
          roomsError
        );
      }

      /*
       * ========================================================
       * CALCULATE STARTING PRICE
       * ========================================================
       */

      if (!roomsError && rooms) {
        const roomPrices = rooms
          .map((room: any) => {
            const possiblePrice =
              room.price ??
              room.price_per_night ??
              room.pricePerNight ??
              room.base_price ??
              room.basePrice ??
              room.nightly_price ??
              room.nightlyPrice;

            const numberPrice =
              Number(possiblePrice);

            return Number.isFinite(numberPrice)
              ? numberPrice
              : 0;
          })
          .filter(
            (roomPrice: number) =>
              roomPrice > 0
          );

        if (roomPrices.length > 0) {
          const cheapestPrice =
            Math.min(...roomPrices);

          if (mounted) {
            setPrice(cheapestPrice);
          }
        }
      }

      /*
       * ========================================================
       * LOAD REVIEWS
       * ========================================================
       */

      const {
        data: reviews,
        error: reviewsError,
      } = await supabase
        .from("reviews")
        .select("rating")
        .eq("hotel_id", databaseHotelId);

      if (reviewsError) {
        console.error(
          "Hotel reviews error:",
          reviewsError
        );

        return;
      }

      if (!mounted) return;

      const reviewList =
        (reviews ?? []) as ReviewRating[];

      if (reviewList.length === 0) {
        setRating(0);
        setReviewCount(0);
        return;
      }

      const totalRating =
        reviewList.reduce(
          (sum, review) =>
            sum +
            Number(review.rating || 0),
          0
        );

      const averageRating =
        totalRating / reviewList.length;

      setRating(
        Number(
          averageRating.toFixed(1)
        )
      );

      setReviewCount(
        reviewList.length
      );
    };

    loadHotelData();

    /*
     * ========================================================
     * REAL-TIME REVIEW UPDATES
     * ========================================================
     */

    const channel = supabase
      .channel(
        `hotel-card-${databaseHotelId}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `hotel_id=eq.${databaseHotelId}`,
        },
        () => {
          loadHotelData();
        }
      )
      .subscribe();

    return () => {
      mounted = false;

      supabase.removeChannel(
        channel
      );
    };
  }, [hotel.dbId, hotel.slug]);

  /* Resolve the real Supabase UUID for both dynamic and static cards. */
  useEffect(() => {
    let mounted = true;
    const resolveHotelId = async () => {
      if (hotel.dbId) { setDatabaseHotelId(hotel.dbId); return; }
      const { data, error } = await supabase.from("hotels").select("id").eq("slug", hotel.slug).maybeSingle();
      if (error) { console.error("Hotel ID lookup error:", error); return; }
      if (mounted && data?.id) setDatabaseHotelId(data.id);
    };
    resolveHotelId();
    return () => { mounted = false; };
  }, [hotel.dbId, hotel.slug]);

  /*
   * ============================================================
   * LOAD FAVORITE
   * ============================================================
   */

  useEffect(() => {
    if (!databaseHotelId) return;

    let mounted = true;

    const loadFavorite = async () => {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) return;

      const {
        data,
        error,
      } = await supabase
        .from("favorites")
        .select("id")
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "hotel_id",
          databaseHotelId
        )
        .maybeSingle();

      if (error) {
        console.error(
          "Favorite loading error:",
          error
        );

        return;
      }

      if (mounted) {
        setIsFavorite(
          Boolean(data)
        );
      }
    };

    loadFavorite();

    return () => {
      mounted = false;
    };
  }, [databaseHotelId]);

  /*
   * ============================================================
   * FAVORITE BUTTON
   * ============================================================
   */

  const handleFavorite = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      favoriteLoading ||
      !databaseHotelId
    ) {
      return;
    }

    setFavoriteLoading(true);

    try {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "Please login to save your favorite hotels."
        );

        return;
      }

      if (isFavorite) {
        const {
          error,
        } = await supabase
          .from("favorites")
          .delete()
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "hotel_id",
            databaseHotelId
          );

        if (error) {
          throw error;
        }

        setIsFavorite(false);
      } else {
        const {
          error,
        } = await supabase
          .from("favorites")
          .insert({
            user_id: user.id,
            hotel_id: hotel.dbId,
          });

        if (error) {
          throw error;
        }

        setIsFavorite(true);
      }
    } catch (error) {
      console.error(
        "Favorite error:",
        error
      );

      alert(
        "Unable to update favorite. Please try again."
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  /*
   * ============================================================
   * URL
   * ============================================================
   */

  const hotelParams =
    new URLSearchParams();

  if (checkIn) {
    hotelParams.set(
      "checkIn",
      checkIn
    );
  }

  if (checkOut) {
    hotelParams.set(
      "checkOut",
      checkOut
    );
  }

  if (guests) {
    hotelParams.set(
      "guests",
      guests
    );
  }

  const hotelUrl =
    `/hotel/${hotel.slug}` +
    (
      hotelParams.toString()
        ? `?${hotelParams.toString()}`
        : ""
    );

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl">

      {/* IMAGE */}

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

        {/* FAVORITE */}

        <button
          type="button"
          aria-label={
            isFavorite
              ? `Remove ${hotel.name} from favorites`
              : `Save ${hotel.name}`
          }
          aria-pressed={
            isFavorite
          }
          disabled={
            favoriteLoading
          }
          onClick={
            handleFavorite
          }
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

        {/* TYPE */}

        <div className="absolute bottom-4 left-4 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
          {hotel.type}
        </div>

      </div>

      {/* DETAILS */}

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

              <span>
                {hotel.location}
              </span>
            </div>

          </div>

          {/* RATING */}

          <div
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-neutral-900"
            title={`${reviewCount} reviews`}
          >

            <Star
              size={14}
              className="fill-current"
            />

            <span>
              {rating.toFixed(1)}
            </span>

          </div>

        </div>

        {/* REVIEWS */}

        <p className="mt-1 text-xs text-neutral-400">
          {reviewCount}{" "}
          {reviewCount === 1
            ? "verified review"
            : "verified reviews"}
        </p>

        {/* AMENITIES */}

        <div className="mt-4 flex flex-wrap gap-2">

          {(Array.isArray(
            hotel.amenities
          )
            ? hotel.amenities
            : []
          )
            .slice(0, 3)
            .map(
              (
                amenity
              ) => (
                <span
                  key={
                    amenity
                  }
                  className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600"
                >
                  {amenity}
                </span>
              )
            )}

        </div>

        {/* PRICE */}

        <div className="mt-5 flex items-end justify-between border-t border-neutral-100 pt-4">

          <div>

            {price > 0 ? (
              <>
                <span className="text-xl font-semibold text-neutral-900">
                  ₹
                  {price.toLocaleString(
                    "en-IN"
                  )}
                </span>

                <span className="ml-1 text-sm text-neutral-500">
                  / night
                </span>
              </>
            ) : (
              <span className="text-sm text-neutral-500">
                Rooms unavailable
              </span>
            )}

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