"use client";

import ReviewForm from "@/components/ReviewForm";
import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { HOTEL_DB_IDS } from "@/data/supabaseIds";

type Customer = {
  first_name: string;
  last_name: string;
};

type Review = {
  id: string;
  rating: number;
  comment: string;
  photos: string[] | null;
  created_at: string;
  customers: Customer | Customer[] | null;
};

type HotelReviewsProps = {
  hotelSlug: string;
};

type EligibleBooking = {
  id: string;
  hotel_id: string;
  room_id: string;
  customer_id: string;
  status: string;
};

export default function HotelReviews({
  hotelSlug,
}: HotelReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showReviewForm, setShowReviewForm] = useState(false);

  const [eligibleBookings, setEligibleBookings] = useState<
    EligibleBooking[]
  >([]);

  const [selectedBookingId, setSelectedBookingId] =
    useState("");

  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [bookingError, setBookingError] =
    useState("");

  const hotelId = HOTEL_DB_IDS[hotelSlug];

  /*
   * LOAD REVIEWS
   */
  const loadReviews = useCallback(async () => {
    if (!hotelId) {
      setError("Hotel ID not found.");
      setLoading(false);
      return;
    }

    setError("");

    const { data, error: reviewsError } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        photos,
        created_at,
        customers (
          first_name,
          last_name
        )
      `)
      .eq("hotel_id", hotelId)
      .order("created_at", {
        ascending: false,
      });

    if (reviewsError) {
      console.error(
        "Reviews error:",
        reviewsError
      );

      setError(reviewsError.message);
      setLoading(false);
      return;
    }

    const reviewData: Review[] = (data ?? []).map(
      (review) => ({
        id: review.id,
        rating: Number(review.rating),
        comment: review.comment,
        photos: Array.isArray(review.photos)
          ? (review.photos as string[])
          : null,
        created_at: review.created_at,
        customers: review.customers as
          | Customer
          | Customer[]
          | null,
      })
    );

    setReviews(reviewData);
    setTotalReviews(reviewData.length);

    if (reviewData.length > 0) {
      const total = reviewData.reduce(
        (sum, review) => sum + review.rating,
        0
      );

      setAverageRating(
        Number(
          (total / reviewData.length).toFixed(1)
        )
      );
    } else {
      setAverageRating(0);
    }

    setLoading(false);
  }, [hotelId]);

  /*
   * LOAD USER BOOKINGS
   *
   * Important:
   * bookings.customer_id stores the ID from the customers table,
   * not the Supabase Auth user.id.
   *
   * Therefore we first find the customer using the logged-in
   * user's email and then query bookings using customers.id.
   */
  const loadEligibleBookings = useCallback(async () => {
    if (!hotelId) {
      setBookingError("Hotel information is missing.");
      setBookingLoading(false);
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      // 1. Get the currently authenticated user.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setBookingError(
          "Please sign in before submitting a review."
        );
        setEligibleBookings([]);
        setSelectedBookingId("");
        return;
      }

      if (!user.email) {
        setBookingError(
          "Your account does not have an email address."
        );
        setEligibleBookings([]);
        setSelectedBookingId("");
        return;
      }

      console.log("Logged-in Auth user ID:", user.id);
      console.log("Logged-in email:", user.email);
      console.log("Current hotel ID:", hotelId);

      // 2. Find the matching row in the customers table.
      // bookings.customer_id references customers.id.
      const {
        data: customer,
        error: customerError,
      } = await supabase
        .from("customers")
        .select("id")
        .ilike("email", user.email)
        .limit(1)
        .maybeSingle();

      if (customerError) {
        console.error(
          "Customer lookup error:",
          customerError
        );

        setBookingError(
          `Unable to find your customer profile: ${customerError.message}`
        );
        setEligibleBookings([]);
        setSelectedBookingId("");
        return;
      }

      if (!customer) {
        setBookingError(
          "Your customer profile was not found. Please make a booking first."
        );
        setEligibleBookings([]);
        setSelectedBookingId("");
        return;
      }

      console.log("Customer table ID:", customer.id);

      // 3. Find bookings using customers.id, not auth user.id.
      // All non-cancelled bookings are accepted here so a booking
      // saved as "confirmed" can be found.
      const {
        data: bookingData,
        error: bookingsError,
      } = await supabase
        .from("bookings")
        .select(
          "id, hotel_id, room_id, customer_id, status"
        )
        .eq("hotel_id", hotelId)
        .eq("customer_id", customer.id)
        .not(
          "status",
          "in",
          '("cancelled","cancelled_by_user")'
        )
        .order("created_at", {
          ascending: false,
        });

      if (bookingsError) {
        console.error(
          "Bookings error:",
          bookingsError
        );

        setBookingError(
          `Unable to load your bookings: ${bookingsError.message}`
        );
        setEligibleBookings([]);
        setSelectedBookingId("");
        return;
      }

      const validBookings =
        (bookingData ?? []) as EligibleBooking[];

      console.log("Eligible bookings:", validBookings);

      if (validBookings.length === 0) {
        setBookingError(
          "No booking was found for this hotel with your account."
        );
        setEligibleBookings([]);
        setSelectedBookingId("");
        return;
      }

      setEligibleBookings(validBookings);

      setSelectedBookingId((current) => {
        const selectedBookingStillExists =
          validBookings.some(
            (booking) => booking.id === current
          );

        if (selectedBookingStillExists) {
          return current;
        }

        return validBookings[0].id;
      });
    } catch (error) {
      console.error(
        "Unexpected booking error:",
        error
      );

      setBookingError(
        error instanceof Error
          ? error.message
          : "Unable to check your bookings. Please try again."
      );
      setEligibleBookings([]);
      setSelectedBookingId("");
    } finally {
      setBookingLoading(false);
    }
  }, [hotelId]);

  /*
   * CHECK BOOKINGS WHEN FORM OPENS
   */
  useEffect(() => {
    if (showReviewForm) {
      loadEligibleBookings();
    }
  }, [
    showReviewForm,
    loadEligibleBookings,
  ]);

  /*
   * INITIAL REVIEWS + REALTIME UPDATES
   */
  useEffect(() => {
    if (!hotelId) {
      loadReviews();
      return;
    }

    let isMounted = true;

    const loadInitialReviews = async () => {
      if (isMounted) {
        setLoading(true);
      }

      await loadReviews();
    };

    loadInitialReviews();

    const channel = supabase
      .channel(`hotel-reviews-${hotelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `hotel_id=eq.${hotelId}`,
        },
        () => {
          loadReviews();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [hotelId, loadReviews]);

  /*
   * LOADING STATE
   */
  if (loading) {
    return (
      <section className="mt-10">
        <div className="animate-pulse">
          <div className="h-7 w-48 rounded bg-gray-200" />

          <div className="mt-4 h-24 rounded-2xl bg-gray-100" />
        </div>
      </section>
    );
  }

  /*
   * ERROR STATE
   */
  if (error) {
    return (
      <section className="mt-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-600">
            Unable to load reviews.
          </p>

          <p className="mt-1 text-xs text-red-500">
            {error}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      {/* HEADER */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Guest Reviews
            </h2>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star
                  size={18}
                  className="fill-yellow-400 text-yellow-400"
                />

                <span className="font-semibold text-gray-900">
                  {averageRating > 0
                    ? averageRating.toFixed(1)
                    : "0.0"}
                </span>
              </div>

              <span className="text-sm text-gray-500">
                {totalReviews}{" "}
                {totalReviews === 1
                  ? "review"
                  : "reviews"}
              </span>
            </div>
          </div>

          {/* WRITE REVIEW BUTTON */}
          <button
            type="button"
            onClick={() =>
              setShowReviewForm(
                (previous) => !previous
              )
            }
            className="w-fit rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            {showReviewForm
              ? "Close Review Form"
              : "Write a Review"}
          </button>
        </div>
      </div>

      {/* REVIEW FORM */}
      {showReviewForm && (
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-gray-900">
              Share your experience
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Rate your stay and share your feedback.
            </p>
          </div>

          {/* BOOKING LOADING */}
          {bookingLoading && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Checking your bookings...
            </div>
          )}

          {/* BOOKING ERROR */}
          {!bookingLoading && bookingError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h4 className="font-semibold text-amber-900">
                Review unavailable
              </h4>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                {bookingError}
              </p>

              <button
                type="button"
                onClick={loadEligibleBookings}
                className="mt-4 rounded-full bg-amber-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-800"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ELIGIBLE BOOKINGS */}
          {!bookingLoading &&
            !bookingError &&
            eligibleBookings.length > 0 && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="review-booking"
                    className="text-sm font-medium text-gray-700"
                  >
                    Select your booking
                  </label>

                  <select
                    id="review-booking"
                    value={selectedBookingId}
                    onChange={(event) =>
                      setSelectedBookingId(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-neutral-900"
                  >
                    {eligibleBookings.map(
                      (booking) => (
                        <option
                          key={booking.id}
                          value={booking.id}
                        >
                          Booking: {booking.id}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* SELECTED BOOKING REVIEW FORM */}
                {(() => {
                  const selectedBooking =
                    eligibleBookings.find(
                      (booking) =>
                        booking.id ===
                        selectedBookingId
                    );

                  if (!selectedBooking) {
                    return null;
                  }

                  return (
                    <ReviewForm
                      bookingId={selectedBooking.id}
                      hotelId={selectedBooking.hotel_id}
                      roomId={selectedBooking.room_id}
                      customerId={selectedBooking.customer_id}
                      onReviewSubmitted={async () => {
                        setShowReviewForm(false);

                        await loadReviews();
                      }}
                    />
                  );
                })()}
              </div>
            )}
        </div>
      )}

      {/* EMPTY STATE */}
      {reviews.length === 0 && (
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Star
              size={22}
              className="text-gray-400"
            />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No reviews yet
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Be the first guest to share your experience.
          </p>
        </div>
      )}

      {/* REVIEWS LIST */}
      {reviews.length > 0 && (
        <div className="mt-5 space-y-4">
          {reviews.map((review) => {
            const customer = Array.isArray(
              review.customers
            )
              ? review.customers[0]
              : review.customers;

            const customerName = customer
              ? `${customer.first_name} ${customer.last_name}`
              : "Guest";

            const reviewDate = new Date(
              review.created_at
            ).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <article
                key={review.id}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {customerName}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      {reviewDate}
                    </p>
                  </div>

                  {/* RATING STARS */}
                  <div className="flex items-center gap-1">
                    {Array.from({
                      length: 5,
                    }).map((_, index) => (
                      <Star
                        key={index}
                        size={16}
                        className={
                          index < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* COMMENT */}
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {review.comment}
                </p>

                {/* REVIEW PHOTOS */}
                {review.photos &&
                  review.photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {review.photos.map(
                        (photo, index) => (
                          <img
                            key={`${review.id}-${index}`}
                            src={photo}
                            alt={`Review photo ${
                              index + 1
                            }`}
                            className="h-28 w-full rounded-xl object-cover"
                          />
                        )
                      )}
                    </div>
                  )}

                {/* VERIFIED STAY */}
                <div className="mt-4 text-xs font-medium text-green-600">
                  ✓ Verified stay
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}