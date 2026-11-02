"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  ShieldCheck,
  Star,
  Wifi,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import HotelReviews from "@/components/HotelReviews";

type Hotel = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  city: string | null;
  type: string | null;
  property_type: string | null;
  description: string | null;
  rating: number | null;
  review_count: number | null;
  reviews: number | null;
  image: string | null;
  image_url: string | null;
  cover_image: string | null;
  amenities: string[] | string | null;
};

type Room = {
  id: string;
  hotel_id: string;
  property_id: string | null;

  name: string | null;
  type: string | null;
  description: string | null;

  price: number | string | null;
  price_per_night: number | string | null;
  base_price: number | string | null;
  nightly_price: number | string | null;

  max_guests: number | string | null;
  bed: string | null;
  size: string | null;

  image: string | null;
  image_url: string | null;

  amenities: string[] | string | null;
};

function getNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const number = Number(cleaned);

    return Number.isFinite(number) ? number : 0;
  }

  return 0;
}

function getRoomPrice(room: Room): number {
  const possiblePrices = [
    room.price,
    room.price_per_night,
    room.base_price,
    room.nightly_price,
  ];

  for (const value of possiblePrices) {
    const price = getNumber(value);

    if (price > 0) {
      return price;
    }
  }

  return 0;
}

function getAmenities(value: Room["amenities"]): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export default function HotelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = String(params.slug || "");

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [currentImage, setCurrentImage] = useState(0);

  const [checkIn, setCheckIn] = useState(
    searchParams.get("checkIn") || ""
  );

  const [checkOut, setCheckOut] = useState(
    searchParams.get("checkOut") || ""
  );

  const [guests, setGuests] = useState(
    Math.max(
      1,
      Number(searchParams.get("guests") || "2")
    )
  );

  /*
   * ============================================================
   * LOAD HOTEL
   * ============================================================
   *
   * IMPORTANT:
   * We find the hotel by SLUG.
   * No HOTEL_DB_IDS required.
   */

  useEffect(() => {
    let cancelled = false;

    async function loadHotel() {
      if (!slug) {
        setErrorMessage("Hotel slug is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const { data: hotelData, error: hotelError } =
          await supabase
            .from("hotels")
            .select("*")
            .eq("slug", slug)
            .maybeSingle();

        if (hotelError) {
          console.error("HOTEL ERROR:", hotelError);

          if (!cancelled) {
            setErrorMessage(
              `Unable to load hotel: ${hotelError.message}`
            );
            setLoading(false);
          }

          return;
        }

        if (!hotelData) {
          if (!cancelled) {
            setHotel(null);
            setRooms([]);
            setErrorMessage("Hotel not found.");
            setLoading(false);
          }

          return;
        }

        /*
         * ========================================================
         * LOAD ROOMS USING THE REAL HOTEL ID
         * ========================================================
         */

        const { data: roomData, error: roomError } =
          await supabase
            .from("rooms")
            .select("*")
            .eq("hotel_id", hotelData.id);

        if (roomError) {
          console.error("ROOM ERROR:", roomError);

          if (!cancelled) {
            setErrorMessage(
              `Unable to load rooms: ${roomError.message}`
            );
            setLoading(false);
          }

          return;
        }

        if (cancelled) return;

        setHotel(hotelData as Hotel);
        setRooms((roomData || []) as Room[]);
        setLoading(false);

        /*
         * Debug information.
         * Check browser console if needed.
         */

        console.log("HOTEL LOADED:", hotelData);
        console.log("REAL HOTEL ID:", hotelData.id);
        console.log("ROOMS LOADED:", roomData);
      } catch (error) {
        console.error("UNEXPECTED HOTEL ERROR:", error);

        if (!cancelled) {
          setErrorMessage(
            "Something went wrong while loading this hotel."
          );
          setLoading(false);
        }
      }
    }

    loadHotel();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /*
   * ============================================================
   * CALCULATE LOWEST ROOM PRICE
   * ============================================================
   */

  const lowestRoomPrice = useMemo(() => {
    const prices = rooms
      .map((room) => getRoomPrice(room))
      .filter((price) => price > 0);

    if (prices.length === 0) {
      return 0;
    }

    return Math.min(...prices);
  }, [rooms]);

  /*
   * ============================================================
   * MAX GUESTS
   * ============================================================
   */

  const maxGuests = useMemo(() => {
    if (rooms.length === 0) {
      return 1;
    }

    const values = rooms.map((room) =>
      Math.max(1, getNumber(room.max_guests))
    );

    return Math.max(...values, 1);
  }, [rooms]);

  /*
   * ============================================================
   * HOTEL IMAGE
   * ============================================================
   */

  const hotelMainImage =
    hotel?.image ||
    hotel?.image_url ||
    hotel?.cover_image ||
    "";

  /*
   * ============================================================
   * ROOM IMAGES
   * ============================================================
   */

  const roomImages = rooms
    .map(
      (room) =>
        room.image ||
        room.image_url ||
        ""
    )
    .filter(Boolean);

  const galleryImages = Array.from(
    new Set(
      [
        hotelMainImage,
        ...roomImages,
      ].filter(Boolean)
    )
  );

  const safeGalleryImages =
    galleryImages.length > 0
      ? galleryImages
      : ["/placeholder-hotel.jpg"];

  /*
   * ============================================================
   * AMENITIES
   * ============================================================
   */

  const hotelAmenities = useMemo(() => {
    const amenities = new Set<string>();

    rooms.forEach((room) => {
      getAmenities(room.amenities).forEach(
        (amenity) => amenities.add(amenity)
      );
    });

    return Array.from(amenities);
  }, [rooms]);

  /*
   * ============================================================
   * DATE
   * ============================================================
   */

  const today = new Date()
    .toISOString()
    .split("T")[0];

  /*
   * ============================================================
   * IMAGE NAVIGATION
   * ============================================================
   */

  function nextImage() {
    setCurrentImage((current) => {
      if (safeGalleryImages.length <= 1) {
        return 0;
      }

      return (
        (current + 1) %
        safeGalleryImages.length
      );
    });
  }

  function previousImage() {
    setCurrentImage((current) => {
      if (safeGalleryImages.length <= 1) {
        return 0;
      }

      return (
        (current -
          1 +
          safeGalleryImages.length) %
        safeGalleryImages.length
      );
    });
  }

  /*
   * ============================================================
   * CHECK-IN
   * ============================================================
   */

  function handleCheckInChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value;

    setCheckIn(value);

    if (checkOut && value >= checkOut) {
      setCheckOut("");
    }
  }

  /*
   * ============================================================
   * CHECK-OUT
   * ============================================================
   */

  function handleCheckOutChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value;

    if (checkIn && value <= checkIn) {
      alert(
        "Check-out date must be after check-in date."
      );
      return;
    }

    setCheckOut(value);
  }

  /*
   * ============================================================
   * GUESTS
   * ============================================================
   */

  function handleGuestsChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    setGuests(Number(event.target.value));
  }

  /*
   * ============================================================
   * RESERVE
   * ============================================================
   */

  function handleReserveRoom() {
    if (rooms.length === 0) {
      alert(
        "No rooms are currently available for this hotel."
      );
      return;
    }

    if (!checkIn) {
      alert("Please select your check-in date.");
      return;
    }

    if (!checkOut) {
      alert("Please select your check-out date.");
      return;
    }

    if (checkOut <= checkIn) {
      alert(
        "Check-out date must be after check-in date."
      );
      return;
    }

    /*
     * Pick the cheapest room that can accommodate
     * the selected number of guests.
     */

    const suitableRooms = rooms.filter(
      (room) =>
        getNumber(room.max_guests) >= guests &&
        getRoomPrice(room) > 0
    );

    const selectedRoom =
      suitableRooms.sort(
        (a, b) =>
          getRoomPrice(a) -
          getRoomPrice(b)
      )[0] ||
      rooms.find(
        (room) => getRoomPrice(room) > 0
      );

    if (!selectedRoom) {
      alert(
        "No room with a valid price is available."
      );
      return;
    }

    const bookingParams =
      new URLSearchParams();

    bookingParams.set(
      "checkIn",
      checkIn
    );

    bookingParams.set(
      "checkOut",
      checkOut
    );

    bookingParams.set(
      "guests",
      String(guests)
    );

    router.push(
      `/hotel/${hotel?.slug}/room/${selectedRoom.id}?${bookingParams.toString()}`
    );
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />

          <p className="mt-5 text-sm text-neutral-400">
            Loading hotel details...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-semibold">
            Unable to load hotel
          </h1>

          <p className="mt-4 text-sm leading-6 text-neutral-400">
            {errorMessage}
          </p>

          <Link
            href="/search"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black"
          >
            <ArrowLeft size={17} />
            Back to stays
          </Link>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * HOTEL NOT FOUND
   * ============================================================
   */

  if (!hotel) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">
            Stay not found
          </h1>

          <p className="mt-3 text-neutral-400">
            This hotel does not exist.
          </p>

          <Link
            href="/search"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black"
          >
            <ArrowLeft size={17} />
            Back to stays
          </Link>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * DISPLAY VALUES
   * ============================================================
   */

  const location =
    hotel.location ||
    hotel.city ||
    "Location unavailable";

  const hotelType =
    hotel.type ||
    hotel.property_type ||
    "Hotel";

  const description =
    hotel.description ||
    "A beautiful stay with comfortable rooms and thoughtful amenities.";

  const rating = getNumber(
    hotel.rating
  );

  const reviewCount =
    getNumber(
      hotel.review_count
    ) ||
    getNumber(
      hotel.reviews
    );

  return (
    <main className="min-h-screen bg-white text-neutral-900">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">

          <Link
            href="/"
            className="text-xl font-semibold tracking-[0.22em] sm:text-2xl"
          >
            AURASTAYS
          </Link>

          <Link
            href="/search"
            className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100"
          >
            <ArrowLeft size={16} />

            <span className="hidden sm:inline">
              Back to stays
            </span>

            <span className="sm:hidden">
              Back
            </span>
          </Link>

        </div>
      </header>

      {/* ========================================================
          CONTENT
      ======================================================== */}

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">

        {/* ======================================================
            GALLERY
        ====================================================== */}

        <section className="relative overflow-hidden rounded-[2rem] bg-neutral-100">

          <div className="aspect-[16/9] w-full sm:aspect-[16/8] lg:aspect-[16/7]">

            <img
              src={safeGalleryImages[currentImage]}
              alt={`${hotel.name} image ${currentImage + 1}`}
              className="h-full w-full object-cover"
            />

          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

          <div className="absolute bottom-5 left-5 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
            {currentImage + 1} /{" "}
            {safeGalleryImages.length}
          </div>

          {safeGalleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={previousImage}
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg"
                aria-label="Previous image"
              >
                <ChevronLeft size={21} />
              </button>

              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg"
                aria-label="Next image"
              >
                <ChevronRight size={21} />
              </button>
            </>
          )}

          <div className="absolute bottom-5 right-5 hidden gap-2 sm:flex">

            {safeGalleryImages.map(
              (image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() =>
                    setCurrentImage(index)
                  }
                  className={`h-12 w-16 overflow-hidden rounded-xl border-2 ${
                    currentImage === index
                      ? "border-white"
                      : "border-white/40 opacity-70"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              )
            )}

          </div>

        </section>

        {/* ======================================================
            HOTEL INFORMATION
        ====================================================== */}

        <section className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">

          <div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">

              <span className="flex items-center gap-1.5">
                <MapPin size={16} />
                {location}
              </span>

              <span className="h-1 w-1 rounded-full bg-neutral-300" />

              <span>
                {hotelType}
              </span>

            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {hotel.name}
            </h1>

            {/* Rating */}

            <div className="mt-4 flex flex-wrap items-center gap-3">

              <div className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">

                <Star
                  size={15}
                  className="fill-current"
                />

                {rating > 0
                  ? rating.toFixed(1)
                  : "New"}

              </div>

              <span className="text-sm text-neutral-500">
                {reviewCount}{" "}
                {reviewCount === 1
                  ? "verified review"
                  : "verified reviews"}
              </span>

            </div>

            {/* Description */}

            <div className="mt-8">

              <h2 className="text-xl font-semibold">
                About this stay
              </h2>

              <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-600">
                {description}
              </p>

            </div>

            {/* Amenities */}

            <div className="mt-10">

              <h2 className="text-xl font-semibold">
                Amenities
              </h2>

              {hotelAmenities.length > 0 ? (

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">

                  {hotelAmenities.map(
                    (amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                          <Check size={17} />
                        </div>

                        <span className="text-sm font-medium">
                          {amenity}
                        </span>
                      </div>
                    )
                  )}

                </div>

              ) : (

                <div className="mt-5 rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-500">
                  Amenities information is currently unavailable.
                </div>

              )}

              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-neutral-200 p-4">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  <Wifi size={17} />
                </div>

                <span className="text-sm font-medium">
                  Free Wi-Fi
                </span>

              </div>

            </div>

            {/* Policies */}

            <div className="mt-10">

              <h2 className="text-xl font-semibold">
                Hotel policies
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-neutral-200 p-5">

                  <div className="flex items-center gap-3">

                    <Clock3 size={20} />

                    <span className="font-medium">
                      Check-in
                    </span>

                  </div>

                  <p className="mt-3 text-sm text-neutral-500">
                    From 2:00 PM
                  </p>

                </div>

                <div className="rounded-2xl border border-neutral-200 p-5">

                  <div className="flex items-center gap-3">

                    <Clock3 size={20} />

                    <span className="font-medium">
                      Check-out
                    </span>

                  </div>

                  <p className="mt-3 text-sm text-neutral-500">
                    Until 11:00 AM
                  </p>

                </div>

              </div>

            </div>

            {/* Reviews */}

            <HotelReviews
              hotelSlug={hotel.slug}
            />

          </div>

          {/* ====================================================
              BOOKING CARD
          ==================================================== */}

          <aside className="lg:sticky lg:top-8 lg:self-start">

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl shadow-neutral-200/40">

              <p className="text-sm text-neutral-500">
                Starting from
              </p>

              <div className="mt-1 flex items-end gap-2">

                <span className="text-3xl font-semibold">

                  {lowestRoomPrice > 0
                    ? `₹${lowestRoomPrice.toLocaleString("en-IN")}`
                    : "Price unavailable"}

                </span>

                {lowestRoomPrice > 0 && (
                  <span className="pb-1 text-sm text-neutral-500">
                    / night
                  </span>
                )}

              </div>

              {rooms.length === 0 && (
                <p className="mt-2 text-xs text-red-500">
                  No rooms found for this hotel.
                </p>
              )}

              {rooms.length > 0 &&
                lowestRoomPrice === 0 && (
                  <p className="mt-2 text-xs text-red-500">
                    Rooms exist, but no valid price was found.
                  </p>
                )}

              <div className="my-6 h-px bg-neutral-200" />

              {/* Dates */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">

                <div className="rounded-2xl border border-neutral-200 p-4">

                  <label
                    htmlFor="check-in"
                    className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
                  >
                    Check-in
                  </label>

                  <input
                    id="check-in"
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={
                      handleCheckInChange
                    }
                    className="mt-2 w-full bg-transparent text-sm font-medium outline-none"
                  />

                </div>

                <div className="rounded-2xl border border-neutral-200 p-4">

                  <label
                    htmlFor="check-out"
                    className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
                  >
                    Check-out
                  </label>

                  <input
                    id="check-out"
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    onChange={
                      handleCheckOutChange
                    }
                    className="mt-2 w-full bg-transparent text-sm font-medium outline-none"
                  />

                </div>

              </div>

              {/* Guests */}

              <div className="mt-3 rounded-2xl border border-neutral-200 p-4">

                <label
                  htmlFor="guests"
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Guests
                </label>

                <select
                  id="guests"
                  value={Math.min(
                    guests,
                    maxGuests
                  )}
                  onChange={
                    handleGuestsChange
                  }
                  className="mt-2 w-full bg-transparent text-sm font-medium outline-none"
                >

                  {Array.from(
                    {
                      length: maxGuests,
                    },
                    (_, index) =>
                      index + 1
                  ).map((number) => (
                    <option
                      key={number}
                      value={number}
                    >
                      {number}{" "}
                      {number === 1
                        ? "Guest"
                        : "Guests"}
                    </option>
                  ))}

                </select>

              </div>

              {/* Reserve */}

              <button
                type="button"
                onClick={
                  handleReserveRoom
                }
                disabled={
                  rooms.length === 0 ||
                  lowestRoomPrice === 0
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reserve Room
                <ArrowRight size={17} />
              </button>

              {/* Security */}

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-neutral-50 p-4">

                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-neutral-700"
                />

                <div>

                  <p className="text-sm font-medium">
                    Secure reservation
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Your booking details are protected and securely handled.
                  </p>

                </div>

              </div>

              <p className="mt-4 text-center text-xs text-neutral-400">
                You won't be charged yet
              </p>

            </div>

          </aside>

        </section>

        {/* ======================================================
            ROOM LIST
        ====================================================== */}

        <section className="mt-16">

          <div className="flex items-end justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
                Available rooms
              </p>

              <h2 className="mt-2 text-3xl font-semibold">
                Choose your room
              </h2>

            </div>

            <span className="text-sm text-neutral-500">
              {rooms.length}{" "}
              {rooms.length === 1
                ? "room"
                : "rooms"}
            </span>

          </div>

          {rooms.length === 0 ? (

            <div className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-center">

              <p className="font-medium">
                No rooms available.
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                Please check back later.
              </p>

            </div>

          ) : (

            <div className="mt-6 grid gap-5">

              {rooms.map((room) => {

                const roomPrice =
                  getRoomPrice(room);

                const roomImage =
                  room.image ||
                  room.image_url ||
                  "/placeholder-hotel.jpg";

                const roomAmenities =
                  getAmenities(
                    room.amenities
                  );

                return (
                  <div
                    key={room.id}
                    className="overflow-hidden rounded-3xl border border-neutral-200 bg-white"
                  >

                    <div className="grid md:grid-cols-[280px_1fr_auto]">

                      {/* Room Image */}

                      <div className="aspect-[4/3] md:aspect-auto">

                        <img
                          src={roomImage}
                          alt={
                            room.name ||
                            "Hotel room"
                          }
                          className="h-full w-full object-cover"
                        />

                      </div>

                      {/* Room Details */}

                      <div className="p-6">

                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                          {room.type ||
                            "Room"}
                        </p>

                        <h3 className="mt-2 text-xl font-semibold">
                          {room.name ||
                            "Room"}
                        </h3>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
                          {room.description ||
                            "Comfortable room with premium amenities."}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">

                          {room.bed && (
                            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-neutral-600">
                              {room.bed}
                            </span>
                          )}

                          {room.size && (
                            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-neutral-600">
                              {room.size}
                            </span>
                          )}

                          {room.max_guests && (
                            <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-neutral-600">
                              Up to{" "}
                              {getNumber(
                                room.max_guests
                              )}{" "}
                              guests
                            </span>
                          )}

                          {roomAmenities
                            .slice(0, 3)
                            .map(
                              (
                                amenity
                              ) => (
                                <span
                                  key={
                                    amenity
                                  }
                                  className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-neutral-600"
                                >
                                  {
                                    amenity
                                  }
                                </span>
                              )
                            )}

                        </div>

                      </div>

                      {/* Price */}

                      <div className="flex flex-col justify-between border-t border-neutral-200 p-6 md:border-l md:border-t-0">

                        <div>

                          <p className="text-xs text-neutral-400">
                            Per night
                          </p>

                          <p className="mt-1 text-2xl font-semibold">

                            {roomPrice > 0
                              ? `₹${roomPrice.toLocaleString("en-IN")}`
                              : "Price unavailable"}

                          </p>

                        </div>

                        <button
                          type="button"
                          onClick={() => {

                            const params =
                              new URLSearchParams();

                            if (
                              checkIn
                            ) {
                              params.set(
                                "checkIn",
                                checkIn
                              );
                            }

                            if (
                              checkOut
                            ) {
                              params.set(
                                "checkOut",
                                checkOut
                              );
                            }

                            params.set(
                              "guests",
                              String(
                                guests
                              )
                            );

                            router.push(
                              `/hotel/${hotel.slug}/room/${room.id}?${params.toString()}`
                            );
                          }}
                          disabled={
                            roomPrice ===
                            0
                          }
                          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Select room
                          <ArrowRight
                            size={16}
                          />
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </section>

      </div>
    </main>
  );
}