
"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize,
  ShieldCheck,
  Star,
  Users,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type Hotel = {
  id: string;
  name: string;
  slug: string;
  location: string;
  type: string;
  description: string;
  rating: number | null;
  review_count: number | null;
  image: string | null;
};

type Room = {
  id: string;
  hotel_id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  max_guests: number;
  bed: string;
  size: string;
  image: string | null;
  amenities: string[] | null;
};

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = params.slug as string;
  const roomId = params.roomId as string;

  const [hotel, setHotel] = useState<Hotel | null>(
    null,
  );

  const [room, setRoom] = useState<Room | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [currentImage, setCurrentImage] = useState(0);

  const [roomCount, setRoomCount] = useState(1);

  const [checkIn, setCheckIn] = useState("");

  const [checkOut, setCheckOut] = useState("");

  const [guests, setGuests] = useState(2);

  /*
   * Fetch hotel and room from Supabase.
   */

  useEffect(() => {
    let isMounted = true;

    const fetchRoomDetails = async () => {
      if (!slug || !roomId) {
        if (isMounted) {
          setLoadError(
            "Invalid hotel or room URL.",
          );
          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setLoadError("");

      /*
       * First fetch hotel using slug.
       */

      const {
        data: hotelData,
        error: hotelError,
      } = await supabase
        .from("hotels")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (hotelError) {
        console.error(
          "Hotel fetch error:",
          hotelError,
        );

        setLoadError(
          "Unable to load hotel details.",
        );

        setIsLoading(false);
        return;
      }

      if (!hotelData) {
        setLoadError("Hotel not found.");
        setIsLoading(false);
        return;
      }

      /*
       * Fetch room using room UUID and hotel UUID.
       * This prevents loading a room from another hotel.
       */

      const {
        data: roomData,
        error: roomError,
      } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .eq("hotel_id", hotelData.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (roomError) {
        console.error(
          "Room fetch error:",
          roomError,
        );

        setLoadError(
          "Unable to load room details.",
        );

        setIsLoading(false);
        return;
      }

      if (!roomData) {
        setHotel(hotelData as Hotel);
        setRoom(null);
        setIsLoading(false);
        return;
      }

      setHotel(hotelData as Hotel);
      setRoom(roomData as Room);
      setIsLoading(false);
    };

    fetchRoomDetails();

    return () => {
      isMounted = false;
    };
  }, [slug, roomId]);

  /*
   * Read booking information from URL.
   */

  useEffect(() => {
    const urlCheckIn =
      searchParams.get("checkIn") || "";

    const urlCheckOut =
      searchParams.get("checkOut") || "";

    const urlGuests = Number(
      searchParams.get("guests") || "2",
    );

    setCheckIn(urlCheckIn);
    setCheckOut(urlCheckOut);

    if (
      Number.isFinite(urlGuests) &&
      urlGuests >= 1
    ) {
      setGuests(urlGuests);
    }
  }, [searchParams]);

  /*
   * Loading state.
   */

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />

          <p className="mt-5 text-sm text-neutral-400">
            Loading room details...
          </p>
        </div>
      </main>
    );
  }

  /*
   * Error state.
   */

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">
            Unable to load room
          </h1>

          <p className="mt-3 text-neutral-400">
            {loadError}
          </p>

          <Link
            href={`/hotel/${slug}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            <ArrowLeft size={17} />
            Back to hotel
          </Link>
        </div>
      </main>
    );
  }

  /*
   * Not found state.
   */

  if (!hotel || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">
            Room not found
          </h1>

          <p className="mt-3 text-neutral-400">
            The room you are looking for does not
            exist.
          </p>

          <Link
            href={`/hotel/${slug}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            <ArrowLeft size={17} />
            Back to hotel
          </Link>
        </div>
      </main>
    );
  }

  /*
   * Today's date.
   */

  const today = new Date()
    .toISOString()
    .split("T")[0];

  /*
   * Room gallery.
   * Uses room image and hotel image if available.
   */

  const galleryImages = Array.from(
    new Set(
      [room.image, hotel.image].filter(
        (image): image is string =>
          Boolean(image),
      ),
    ),
  );

  const safeGalleryImages =
    galleryImages.length > 0
      ? galleryImages
      : ["/placeholder-hotel.jpg"];

  /*
   * Calculate nights.
   */

  const calculateNights = () => {
    if (!checkIn || !checkOut) {
      return 0;
    }

    const start = new Date(
      `${checkIn}T00:00:00`,
    );

    const end = new Date(
      `${checkOut}T00:00:00`,
    );

    const difference =
      end.getTime() - start.getTime();

    const nights = Math.ceil(
      difference / (1000 * 60 * 60 * 24),
    );

    return Math.max(0, nights);
  };

  const nights = calculateNights();

  /*
   * Price calculation.
   */

  const pricePerNight = Number(room.price) || 0;

  const subtotal =
    pricePerNight * nights * roomCount;

  const tax = Math.round(subtotal * 0.12);

  const totalPrice = subtotal + tax;

  /*
   * Gallery controls.
   */

  const nextImage = () => {
    setCurrentImage(
      (current) =>
        (current + 1) %
        safeGalleryImages.length,
    );
  };

  const previousImage = () => {
    setCurrentImage(
      (current) =>
        (current - 1 +
          safeGalleryImages.length) %
        safeGalleryImages.length,
    );
  };

  /*
   * Check-in change.
   */

  const handleCheckInChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedDate = event.target.value;

    setCheckIn(selectedDate);

    if (
      checkOut &&
      checkOut <= selectedDate
    ) {
      setCheckOut("");
    }
  };

  /*
   * Check-out change.
   */

  const handleCheckOutChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedDate = event.target.value;

    if (
      checkIn &&
      selectedDate <= checkIn
    ) {
      alert(
        "Check-out date must be after check-in date.",
      );

      return;
    }

    setCheckOut(selectedDate);
  };

  /*
   * Guest change.
   */

  const handleGuestChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = Number(event.target.value);

    setGuests(
      Math.min(
        Math.max(value, 1),
        room.max_guests,
      ),
    );
  };

  /*
   * Booking.
   */

  const handleBooking = () => {
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
        "Check-out date must be after check-in date.",
      );

      return;
    }

    if (guests < 1) {
      alert("Please select at least one guest.");
      return;
    }

    if (guests > room.max_guests) {
      alert(
        `This room allows a maximum of ${room.max_guests} guests.`,
      );

      return;
    }

    if (roomCount < 1) {
      alert("Please select at least one room.");
      return;
    }

    if (nights <= 0) {
      alert("Please select valid booking dates.");
      return;
    }

    const bookingParams = new URLSearchParams();

    bookingParams.set("hotel", hotel.slug);
    bookingParams.set("room", room.id);
    bookingParams.set("checkIn", checkIn);
    bookingParams.set("checkOut", checkOut);
    bookingParams.set("rooms", String(roomCount));
    bookingParams.set("guests", String(guests));
    bookingParams.set("nights", String(nights));

    router.push(
      `/booking?${bookingParams.toString()}`,
    );
  };

  const roomAmenities = Array.isArray(
    room.amenities,
  )
    ? room.amenities
    : [];

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Header */}

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="text-xl font-semibold tracking-[0.22em] sm:text-2xl"
          >
            AURASTAYS
          </Link>

          <Link
            href={`/hotel/${hotel.slug}`}
            className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-medium transition hover:bg-neutral-100"
          >
            <ArrowLeft size={16} />

            <span className="hidden sm:inline">
              Back to hotel
            </span>

            <span className="sm:hidden">
              Back
            </span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
        {/* Breadcrumb */}

        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          <Link
            href="/"
            className="transition hover:text-neutral-900"
          >
            Home
          </Link>

          <span>/</span>

          <Link
            href={`/hotel/${hotel.slug}`}
            className="transition hover:text-neutral-900"
          >
            {hotel.name}
          </Link>

          <span>/</span>

          <span className="text-neutral-900">
            {room.name}
          </span>
        </div>

        {/* Gallery */}

        <section className="relative overflow-hidden rounded-[2rem] bg-neutral-100">
          <div className="aspect-[16/9] w-full sm:aspect-[16/8] lg:aspect-[16/7]">
            <img
              src={safeGalleryImages[currentImage]}
              alt={`${room.name} image ${
                currentImage + 1
              }`}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

          <div className="absolute bottom-5 left-5 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
            {currentImage + 1} /{" "}
            {safeGalleryImages.length}
          </div>

          <button
            type="button"
            onClick={previousImage}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg transition hover:bg-white sm:left-6"
          >
            <ChevronLeft size={21} />
          </button>

          <button
            type="button"
            onClick={nextImage}
            aria-label="Next image"
            className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg transition hover:bg-white sm:right-6"
          >
            <ChevronRight size={21} />
          </button>

          <div className="absolute bottom-5 right-5 hidden gap-2 sm:flex">
            {safeGalleryImages.map(
              (image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() =>
                    setCurrentImage(index)
                  }
                  aria-label={`View image ${
                    index + 1
                  }`}
                  className={`h-12 w-16 overflow-hidden rounded-xl border-2 transition ${
                    currentImage === index
                      ? "border-white"
                      : "border-white/40 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ),
            )}
          </div>
        </section>

        {/* Content */}

        <section className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left */}

          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              <span>{hotel.name}</span>

              <span className="h-1 w-1 rounded-full bg-neutral-300" />

              <span>{room.type}</span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {room.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
                <Star
                  size={15}
                  className="fill-current"
                />

                {hotel.rating ?? 0}
              </div>

              <span className="text-sm text-neutral-500">
                {hotel.review_count ?? 0} verified
                reviews
              </span>
            </div>

            {/* About */}

            <div className="mt-8">
              <h2 className="text-xl font-semibold">
                About this room
              </h2>

              <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-600">
                {room.description}
              </p>
            </div>

            {/* Room Information */}

            <div className="mt-10">
              <h2 className="text-xl font-semibold">
                Room information
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-neutral-200 p-5">
                  <Users size={20} />

                  <p className="mt-3 text-xs uppercase tracking-wider text-neutral-400">
                    Guests
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    Up to {room.max_guests}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 p-5">
                  <BedDouble size={20} />

                  <p className="mt-3 text-xs uppercase tracking-wider text-neutral-400">
                    Bed
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {room.bed}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 p-5">
                  <Maximize size={20} />

                  <p className="mt-3 text-xs uppercase tracking-wider text-neutral-400">
                    Size
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {room.size}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 p-5">
                  <Wifi size={20} />

                  <p className="mt-3 text-xs uppercase tracking-wider text-neutral-400">
                    Internet
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    Free Wi-Fi
                  </p>
                </div>
              </div>
            </div>

            {/* Amenities */}

            <div className="mt-10">
              <h2 className="text-xl font-semibold">
                Room amenities
              </h2>

              {roomAmenities.length > 0 ? (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {roomAmenities.map(
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
                    ),
                  )}
                </div>
              ) : (
                <p className="mt-5 text-sm text-neutral-500">
                  No amenities listed for this room.
                </p>
              )}
            </div>

            {/* Policies */}

            <div className="mt-10">
              <h2 className="text-xl font-semibold">
                Stay policies
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 p-5">
                  <p className="font-medium">
                    Check-in
                  </p>

                  <p className="mt-2 text-sm text-neutral-500">
                    From 2:00 PM
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 p-5">
                  <p className="font-medium">
                    Check-out
                  </p>

                  <p className="mt-2 text-sm text-neutral-500">
                    Until 11:00 AM
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 p-5">
                  <p className="font-medium">
                    Cancellation
                  </p>

                  <p className="mt-2 text-sm text-neutral-500">
                    Free cancellation before check-in.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 p-5">
                  <p className="font-medium">
                    Smoking
                  </p>

                  <p className="mt-2 text-sm text-neutral-500">
                    Non-smoking room.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Card */}

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl shadow-neutral-200/40">
              <p className="text-sm text-neutral-500">
                Room price
              </p>

              <div className="mt-1 flex items-end gap-2">
                <span className="text-3xl font-semibold">
                  ₹
                  {pricePerNight.toLocaleString(
                    "en-IN",
                  )}
                </span>

                <span className="pb-1 text-sm text-neutral-500">
                  / night
                </span>
              </div>

              <div className="my-6 h-px bg-neutral-200" />

              {/* Dates */}

              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-neutral-200 p-4">
                  <label
                    htmlFor="room-check-in"
                    className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
                  >
                    Check-in
                  </label>

                  <input
                    id="room-check-in"
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={
                      handleCheckInChange
                    }
                    className="mt-2 w-full bg-transparent text-sm font-medium text-neutral-900 outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-neutral-200 p-4">
                  <label
                    htmlFor="room-check-out"
                    className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
                  >
                    Check-out
                  </label>

                  <input
                    id="room-check-out"
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    onChange={
                      handleCheckOutChange
                    }
                    className="mt-2 w-full bg-transparent text-sm font-medium text-neutral-900 outline-none"
                  />
                </div>
              </div>

              {/* Nights */}

              {nights > 0 && (
                <div className="mt-3 rounded-2xl bg-neutral-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">
                      Stay duration
                    </span>

                    <span className="text-sm font-semibold">
                      {nights}{" "}
                      {nights === 1
                        ? "night"
                        : "nights"}
                    </span>
                  </div>
                </div>
              )}

              {/* Guests */}

              <div className="mt-3 rounded-2xl border border-neutral-200 p-4">
                <label
                  htmlFor="room-guests"
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Guests
                </label>

                <select
                  id="room-guests"
                  value={Math.min(
                    guests,
                    room.max_guests,
                  )}
                  onChange={handleGuestChange}
                  className="mt-2 w-full bg-transparent text-sm font-medium text-neutral-900 outline-none"
                >
                  {Array.from(
                    {
                      length: room.max_guests,
                    },
                    (_, index) => index + 1,
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

              {/* Rooms */}

              <div className="mt-3 rounded-2xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Rooms
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {roomCount}{" "}
                      {roomCount === 1
                        ? "room"
                        : "rooms"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRoomCount(
                          (count) =>
                            Math.max(
                              1,
                              count - 1,
                            ),
                        )
                      }
                      aria-label="Decrease room count"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-lg transition hover:bg-neutral-100"
                    >
                      −
                    </button>

                    <span className="w-5 text-center text-sm font-semibold">
                      {roomCount}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setRoomCount(
                          (count) =>
                            Math.min(
                              5,
                              count + 1,
                            ),
                        )
                      }
                      aria-label="Increase room count"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-lg transition hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-4 text-neutral-500">
                  <span>
                    ₹
                    {pricePerNight.toLocaleString(
                      "en-IN",
                    )}{" "}
                    × {nights}{" "}
                    {nights === 1
                      ? "night"
                      : "nights"}{" "}
                    × {roomCount}{" "}
                    {roomCount === 1
                      ? "room"
                      : "rooms"}
                  </span>

                  <span className="shrink-0">
                    ₹
                    {subtotal.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-neutral-500">
                  <span>Taxes & fees</span>

                  <span className="shrink-0">
                    ₹
                    {tax.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>

                <div className="h-px bg-neutral-200" />

                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>

                  <span>
                    ₹
                    {totalPrice.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
              </div>

              {/* Booking Button */}

              <button
                type="button"
                onClick={handleBooking}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-700"
              >
                Book This Room
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
                    Your reservation details are
                    protected.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-neutral-400">
                You won't be charged yet
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}