
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
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  ShieldCheck,
  Star,
  Wifi,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

import { supabase } from "@/lib/supabase";
import HotelReviews from "@/components/HotelReviews";

type Hotel = {
  id: string;
  name: string;
  slug: string;
  location: string;
  type: string;
  description: string;
  rating: number | null;
  review_count: number | null;
  image: string;
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
  image: string;
  amenities: string[] | null;
};

export default function HotelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = params.slug as string;

  const initialCheckIn =
    searchParams.get("checkIn") || "";

  const initialCheckOut =
    searchParams.get("checkOut") || "";

  const initialGuests = Number(
    searchParams.get("guests") || "2",
  );

  const [hotel, setHotel] = useState<Hotel | null>(
    null,
  );

  const [hotelRooms, setHotelRooms] = useState<
    Room[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [currentImage, setCurrentImage] = useState(0);

  const [checkIn, setCheckIn] =
    useState(initialCheckIn);

  const [checkOut, setCheckOut] =
    useState(initialCheckOut);

  const [guests, setGuests] = useState(
    Number.isFinite(initialGuests) &&
      initialGuests >= 1
      ? initialGuests
      : 2,
  );

  useEffect(() => {
    let isMounted = true;

    const fetchHotelDetails = async () => {
      if (!slug) {
        if (isMounted) {
          setLoadError("Invalid hotel URL.");
          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setLoadError("");

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
        setHotel(null);
        setHotelRooms([]);
        setIsLoading(false);
        return;
      }

      const {
        data: roomData,
        error: roomError,
      } = await supabase
        .from("rooms")
        .select("*")
        .eq("hotel_id", hotelData.id)
        .order("price", {
          ascending: true,
        });

      if (!isMounted) {
        return;
      }

      if (roomError) {
        console.error(
          "Rooms fetch error:",
          roomError,
        );

        setLoadError(
          "Unable to load available rooms.",
        );

        setIsLoading(false);
        return;
      }

      setHotel(hotelData as Hotel);
      setHotelRooms((roomData || []) as Room[]);
      setIsLoading(false);
    };

    fetchHotelDetails();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />

          <p className="mt-5 text-sm text-neutral-400">
            Loading hotel details...
          </p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">
            Unable to load hotel
          </h1>

          <p className="mt-3 text-neutral-400">
            {loadError}
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

  if (!hotel) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">
            Stay not found
          </h1>

          <p className="mt-3 text-neutral-400">
            The hotel you are looking for does not
            exist.
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

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const roomImages = hotelRooms
    .map((room) => room.image)
    .filter(
      (image): image is string =>
        Boolean(image),
    );

  const galleryImages = Array.from(
    new Set([
      hotel.image,
      ...roomImages,
    ].filter(Boolean)),
  );

  const safeGalleryImages =
    galleryImages.length > 0
      ? galleryImages
      : ["/placeholder-hotel.jpg"];

  const hotelAmenities = Array.from(
    new Set(
      hotelRooms.flatMap((room) =>
        Array.isArray(room.amenities)
          ? room.amenities
          : [],
      ),
    ),
  );

  const lowestRoomPrice =
    hotelRooms.length > 0
      ? Math.min(
          ...hotelRooms.map((room) =>
            Number(room.price) || 0,
          ),
        )
      : 0;

  const maxGuests = Math.max(
    ...hotelRooms.map((room) =>
      Number(room.max_guests) || 1,
    ),
    1,
  );

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

  const handleCheckInChange = (
    event: ChangeEvent<HTMLInputElement>,
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

  const handleCheckOutChange = (
    event: ChangeEvent<HTMLInputElement>,
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

  const handleGuestsChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = Number(event.target.value);

    setGuests(value);
  };

  const handleReserveRoom = () => {
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

    if (hotelRooms.length === 0) {
      alert(
        "No rooms are currently available for this stay.",
      );

      return;
    }

    const selectedRoom =
      hotelRooms.find(
        (room) =>
          Number(room.max_guests) >= guests,
      ) || hotelRooms[0];

    const bookingParams = new URLSearchParams();

    bookingParams.set("checkIn", checkIn);
    bookingParams.set("checkOut", checkOut);
    bookingParams.set("guests", String(guests));

    router.push(
      `/hotel/${hotel.slug}/room/${selectedRoom.id}?${bookingParams.toString()}`,
    );
  };

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

      {/* Main */}

      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
        {/* Gallery */}

        <section className="relative overflow-hidden rounded-[2rem] bg-neutral-100">
          <div className="aspect-[16/9] w-full sm:aspect-[16/8] lg:aspect-[16/7]">
            <img
              src={safeGalleryImages[currentImage]}
              alt={`${hotel.name} gallery image ${
                currentImage + 1
              }`}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

          {/* Image Counter */}

          <div className="absolute bottom-5 left-5 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
            {currentImage + 1} /{" "}
            {safeGalleryImages.length}
          </div>

          {/* Previous */}

          <button
            type="button"
            onClick={previousImage}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg backdrop-blur transition hover:bg-white sm:left-6"
          >
            <ChevronLeft size={21} />
          </button>

          {/* Next */}

          <button
            type="button"
            onClick={nextImage}
            aria-label="Next image"
            className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg backdrop-blur transition hover:bg-white sm:right-6"
          >
            <ChevronRight size={21} />
          </button>

          {/* Thumbnails */}

          <div className="absolute bottom-5 right-5 hidden gap-2 sm:flex">
            {safeGalleryImages.map(
              (image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() =>
                    setCurrentImage(index)
                  }
                  className={`h-12 w-16 overflow-hidden rounded-xl border-2 transition ${
                    currentImage === index
                      ? "border-white"
                      : "border-white/40 opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`View image ${
                    index + 1
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

        {/* Hotel Information */}

        <section className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left */}

          <div>
            {/* Location */}

            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={16} />
                {hotel.location}
              </span>

              <span className="h-1 w-1 rounded-full bg-neutral-300" />

              <span>{hotel.type}</span>
            </div>

            {/* Title */}

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

                {hotel.rating ?? 0}
              </div>

              <span className="text-sm text-neutral-500">
                {hotel.review_count ?? 0} verified
                reviews
              </span>
            </div>

            {/* Description */}

            <div className="mt-8">
              <h2 className="text-xl font-semibold">
                About this stay
              </h2>

              <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-600">
                {hotel.description}
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
                    ),
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-500">
                  Amenities information is
                  currently unavailable.
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

            <HotelReviews hotelSlug={hotel.slug} />
          </div>

          {/* Booking Card */}

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl shadow-neutral-200/40">
              <p className="text-sm text-neutral-500">
                Starting from
              </p>

              <div className="mt-1 flex items-end gap-2">
                <span className="text-3xl font-semibold">
                  ₹
                  {lowestRoomPrice.toLocaleString(
                    "en-IN",
                  )}
                </span>

                <span className="pb-1 text-sm text-neutral-500">
                  / night
                </span>
              </div>

              <div className="my-6 h-px bg-neutral-200" />

              {/* Dates */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {/* Check-in */}

                <div className="rounded-2xl border border-neutral-200 p-4 transition focus-within:border-neutral-900">
                  <label
                    htmlFor="hotel-check-in"
                    className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
                  >
                    Check-in
                  </label>

                  <input
                    id="hotel-check-in"
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={
                      handleCheckInChange
                    }
                    className="mt-2 w-full bg-transparent text-sm font-medium text-neutral-900 outline-none"
                  />
                </div>

                {/* Check-out */}

                <div className="rounded-2xl border border-neutral-200 p-4 transition focus-within:border-neutral-900">
                  <label
                    htmlFor="hotel-check-out"
                    className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
                  >
                    Check-out
                  </label>

                  <input
                    id="hotel-check-out"
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

              {/* Selected dates summary */}

              {checkIn && checkOut && (
                <div className="mt-3 rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Selected stay
                  </p>

                  <p className="mt-2 text-sm font-medium text-neutral-900">
                    {checkIn} → {checkOut}
                  </p>
                </div>
              )}

              {/* Guests */}

              <div className="mt-3 rounded-2xl border border-neutral-200 p-4 transition focus-within:border-neutral-900">
                <label
                  htmlFor="hotel-guests"
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Guests
                </label>

                <select
                  id="hotel-guests"
                  value={Math.min(guests, maxGuests)}
                  onChange={handleGuestsChange}
                  className="mt-2 w-full bg-transparent text-sm font-medium text-neutral-900 outline-none"
                >
                  {Array.from(
                    {
                      length: maxGuests,
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

              {/* Reserve */}

              <button
                type="button"
                onClick={handleReserveRoom}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-700 active:scale-[0.99]"
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
                    Your booking details are
                    protected and securely
                    handled.
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