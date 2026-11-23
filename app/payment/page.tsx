"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type DatabaseRoom = {
  id: string;
  hotel_id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  max_guests: number;
  bed: string;
  size: string;
  image: string;
  amenities: string[];
};

type DatabaseHotel = {
  id: string;
  slug: string;
  name: string;
  location: string;
  type: string;
  description: string;
  rating: number;
  review_count: number;
  image: string;
};

export default function PaymentPage() {
  const router = useRouter();

  const [queryReady, setQueryReady] = useState(false);
  const [hotelSlug, setHotelSlug] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const [nightsFromUrl, setNightsFromUrl] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setHotelSlug(params.get("hotel") || "");
    setRoomId(params.get("room") || "");
    setCheckIn(params.get("checkIn") || "");
    setCheckOut(params.get("checkOut") || "");
    setGuests(Number(params.get("guests") || "2"));
    setRoomCount(Number(params.get("rooms") || "1"));
    setNightsFromUrl(Number(params.get("nights") || "0"));
    setQueryReady(true);
  }, []);

  const [hotel, setHotel] =
    useState<DatabaseHotel | null>(null);
  const [room, setRoom] =
    useState<DatabaseRoom | null>(null);
  const [detailsLoading, setDetailsLoading] =
    useState(true);
  const [detailsError, setDetailsError] =
    useState("");

  useEffect(() => {
    let active = true;

    const loadBookingDetails = async () => {
      if (!queryReady) return;

      if (!hotelSlug || !roomId) {
        if (active) {
          setDetailsError("Hotel or room information is missing.");
          setDetailsLoading(false);
        }
        return;
      }

      setDetailsLoading(true);
      setDetailsError("");

      const { data: hotelData, error: hotelError } =
        await supabase
          .from("hotels")
          .select("*")
          .eq("slug", hotelSlug)
          .maybeSingle();

      if (!active) return;

      if (hotelError || !hotelData) {
        console.error("Payment hotel fetch error:", hotelError);
        setDetailsError("Hotel could not be found in the database.");
        setDetailsLoading(false);
        return;
      }

      const { data: roomData, error: roomError } =
        await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .eq("hotel_id", hotelData.id)
          .maybeSingle();

      if (!active) return;

      if (roomError || !roomData) {
        console.error("Payment room fetch error:", roomError);
        setDetailsError("Room could not be found in the database.");
        setDetailsLoading(false);
        return;
      }

      setHotel({
        id: String(hotelData.id),
        slug: String(hotelData.slug ?? hotelSlug),
        name: String(hotelData.name ?? hotelSlug),
        location: String(hotelData.location ?? ""),
        type: String(hotelData.type ?? "Hotel"),
        description: String(hotelData.description ?? ""),
        rating: Number(hotelData.rating ?? 0),
        review_count: Number(hotelData.review_count ?? 0),
        image: String(hotelData.image ?? ""),
      });

      setRoom({
        id: String(roomData.id),
        hotel_id: String(roomData.hotel_id),
        name: String(roomData.name ?? "Room"),
        type: String(roomData.type ?? "Room"),
        description: String(roomData.description ?? ""),
        price: Number(roomData.price ?? 0),
        max_guests: Number(roomData.max_guests ?? 1),
        bed: String(roomData.bed ?? ""),
        size: String(roomData.size ?? ""),
        image: String(roomData.image ?? hotelData.image ?? "/placeholder-hotel.jpg"),
        amenities: Array.isArray(roomData.amenities) ? roomData.amenities : [],
      });

      setDetailsLoading(false);
    };

    loadBookingDetails();

    return () => {
      active = false;
    };
  }, [queryReady, hotelSlug, roomId]);


  const [isProcessing, setIsProcessing] =
    useState(false);


  const calculateNights = () => {
    if (!checkIn || !checkOut) {
      return nightsFromUrl;
    }

    const start = new Date(
      `${checkIn}T00:00:00`,
    );

    const end = new Date(
      `${checkOut}T00:00:00`,
    );

    const difference =
      end.getTime() - start.getTime();

    return Math.max(
      0,
      Math.ceil(
        difference / (1000 * 60 * 60 * 24),
      ),
    );
  };

  const nights = calculateNights();

  if (detailsLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
          <p className="mt-5 text-sm text-neutral-400">
            Loading payment details...
          </p>
        </div>
      </main>
    );
  }

  if (detailsError || !hotel || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">
            Booking not found
          </h1>

          <p className="mt-3 text-neutral-400">
            {detailsError || "We couldn't find the hotel or room for this booking."}
          </p>

          <Link
            href="/search"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            <ArrowLeft size={17} />
            Back to stays
          </Link>
        </div>
      </main>
    );
  }

  const subtotal =
    room.price * nights * roomCount;

  const tax = Math.round(subtotal * 0.12);
  const total = subtotal + tax;

  const handlePayment = async () => {
    if (!checkIn || !checkOut || nights <= 0) {
      alert("Please select valid check-in and check-out dates.");
      return;
    }
    setIsProcessing(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Please sign in before creating a booking.");
      const params = new URLSearchParams(window.location.search);
      const { data, error } = await supabase.rpc("create_pending_booking", {
        p_hotel_slug: hotel.slug,
        p_room_id: room.id,
        p_check_in: checkIn,
        p_check_out: checkOut,
        p_guests: guests,
        p_rooms: roomCount,
        p_first_name: params.get("firstName") || "",
        p_last_name: params.get("lastName") || "",
        p_email: params.get("email") || user.email || "",
        p_phone: params.get("phone") || "",
        p_special_request: params.get("specialRequest") || "",
      });
      if (error) throw error;
      const created = Array.isArray(data) ? data[0] : data;
      if (!created?.booking_id) throw new Error("Booking could not be created.");
      router.push(`/demo-payment?bookingId=${encodeURIComponent(created.booking_id)}`);
    } catch (error) {
      console.error("Pending booking creation failed:", error);
      alert(error instanceof Error ? error.message : "Booking could not be created.");
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* HEADER */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="text-xl font-semibold tracking-[0.22em] sm:text-2xl"
          >
            AURASTAYS
          </Link>

          <div className="flex items-center gap-2 text-xs text-neutral-500 sm:text-sm">
            <Lock size={15} />
            Secure checkout
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        {/* BACK */}
        <Link
          href={`/booking?hotel=${hotel.slug}&room=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&rooms=${roomCount}&guests=${guests}&nights=${nights}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          <ArrowLeft size={16} />
          Back to booking
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* PAYMENT SECTION */}
          <section>
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-400">
                  Payment
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  Complete your reservation
                </h1>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Choose your preferred payment
                  method to continue.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="font-semibold text-amber-950">Online payments are not connected yet</h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  Aura Stays is currently in booking-test mode. No card details or fake UPI payment confirmations are collected.
                  Your reservation will be saved as pending and will not be marked as paid or confirmed.
                </p>
              </div>

              {/* SECURITY */}
              <div className="mt-8 flex items-start gap-3 rounded-2xl bg-neutral-50 p-4">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="text-sm font-medium">
                    Secure payment
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Your payment information is
                    securely handled. This demo does
                    not process real payments.
                  </p>
                </div>
              </div>

              {/* PAY BUTTON */}
              <button
                type="button"
                onClick={handlePayment}
                disabled={isProcessing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating booking...
                  </>
                ) : (
                  <>
                    Continue to demo payment
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
          </section>

          {/* BOOKING SUMMARY */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={room.image}
                  alt={room.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Your stay
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  {hotel.name}
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  {room.name}
                </p>

                <div className="my-5 h-px bg-neutral-200" />

                {/* STAY DETAILS */}
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">
                      Check-in
                    </span>

                    <span className="font-medium">
                      {checkIn}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">
                      Check-out
                    </span>

                    <span className="font-medium">
                      {checkOut}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">
                      Guests
                    </span>

                    <span className="font-medium">
                      {guests}{" "}
                      {guests === 1
                        ? "Guest"
                        : "Guests"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">
                      Rooms
                    </span>

                    <span className="font-medium">
                      {roomCount}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">
                      Duration
                    </span>

                    <span className="font-medium">
                      {nights}{" "}
                      {nights === 1
                        ? "night"
                        : "nights"}
                    </span>
                  </div>
                </div>

                <div className="my-5 h-px bg-neutral-200" />

                {/* PRICE */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4 text-neutral-500">
                    <span>
                      ₹
                      {room.price.toLocaleString(
                        "en-IN",
                      )}{" "}
                      × {nights} nights ×{" "}
                      {roomCount} rooms
                    </span>

                    <span>
                      ₹
                      {subtotal.toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 text-neutral-500">
                    <span>
                      Taxes & fees
                    </span>

                    <span>
                      ₹
                      {tax.toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>

                  <div className="h-px bg-neutral-200" />

                  <div className="flex justify-between gap-4 text-lg font-semibold">
                    <span>Total</span>

                    <span>
                      ₹
                      {total.toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 text-xs text-neutral-400">
                  <Check size={15} />
                  Free cancellation before
                  check-in
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}