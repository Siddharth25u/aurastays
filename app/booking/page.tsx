
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

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

function BookingContent() {
  const searchParams = useSearchParams();

  const hotelSlug = searchParams.get("hotel") || "";
  const roomId = searchParams.get("room") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";

  const requestedRooms =
    Number(searchParams.get("rooms")) || 1;

  const requestedGuests =
    Number(searchParams.get("guests")) || 1;

  const [hotel, setHotel] = useState<Hotel | null>(
    null,
  );

  const [room, setRoom] = useState<Room | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [specialRequest, setSpecialRequest] =
    useState("");

  const [agreeTerms, setAgreeTerms] =
    useState(false);

  const [error, setError] = useState("");

  /*
   * Fetch hotel and room from Supabase.
   */

  useEffect(() => {
    let isMounted = true;

    const fetchBookingDetails = async () => {
      if (!hotelSlug || !roomId) {
        if (isMounted) {
          setLoadError(
            "Hotel or room information is missing.",
          );

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
        .eq("slug", hotelSlug)
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
          "Unable to load hotel information.",
        );

        setIsLoading(false);
        return;
      }

      if (!hotelData) {
        setLoadError("Hotel not found.");
        setIsLoading(false);
        return;
      }

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
          "Unable to load room information.",
        );

        setIsLoading(false);
        return;
      }

      if (!roomData) {
        setLoadError("Room not found.");
        setIsLoading(false);
        return;
      }

      setHotel(hotelData as Hotel);
      setRoom(roomData as Room);
      setIsLoading(false);
    };

    fetchBookingDetails();

    return () => {
      isMounted = false;
    };
  }, [hotelSlug, roomId]);

  const roomCount = Math.min(
    Math.max(requestedRooms, 1),
    5,
  );

  const guests = Math.max(requestedGuests, 1);

  const nights = useMemo(() => {
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

    return Math.max(
      0,
      Math.ceil(
        difference / (1000 * 60 * 60 * 24),
      ),
    );
  }, [checkIn, checkOut]);

  /*
   * Loading state.
   */

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />

          <p className="mt-5 text-sm text-neutral-400">
            Loading booking details...
          </p>
        </div>
      </main>
    );
  }

  /*
   * Error state.
   */

  if (loadError || !hotel || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-semibold">
            Booking details not found
          </h1>

          <p className="mt-3 text-neutral-400">
            {loadError ||
              "Please select a room again before continuing."}
          </p>

          <Link
            href="/search"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            <ArrowLeft size={17} />
            Browse stays
          </Link>
        </div>
      </main>
    );
  }

  const pricePerNight = Number(room.price) || 0;

  const subtotal =
    pricePerNight * nights * roomCount;

  const tax = Math.round(subtotal * 0.12);

  const total = subtotal + tax;

  const formatDate = (date: string) => {
    if (!date) {
      return "Not selected";
    }

    const [year, month, day] = date
      .split("-")
      .map(Number);

    const formatted = new Date(
      year,
      month - 1,
      day,
    );

    return formatted.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handlePhoneChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const numbersOnly = event.target.value
      .replace(/\D/g, "")
      .slice(0, 10);

    setPhone(numbersOnly);
  };

  const handleContinue = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }

    if (!lastName.trim()) {
      setError("Please enter your last name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!phone) {
      setError("Please enter your phone number.");
      return;
    }

    if (phone.length !== 10) {
      setError(
        "Please enter a valid 10-digit mobile number.",
      );

      return;
    }

    if (!checkIn || !checkOut) {
      setError(
        "Check-in and check-out dates are required.",
      );

      return;
    }

    if (nights <= 0) {
      setError(
        "Check-out must be after check-in.",
      );

      return;
    }

    if (guests > room.max_guests) {
      setError(
        `This room allows a maximum of ${room.max_guests} guests.`,
      );

      return;
    }

    if (!agreeTerms) {
      setError(
        "Please accept the booking terms to continue.",
      );

      return;
    }

    /*
     * Preserve all booking information
     * for the payment page.
     */

    const params = new URLSearchParams({
      hotel: hotel.slug,
      hotelId: hotel.id,
      room: room.id,
      roomId: room.id,
      checkIn,
      checkOut,
      rooms: String(roomCount),
      guests: String(guests),
      nights: String(nights),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone,
      specialRequest: specialRequest.trim(),
      total: String(total),
    });

    window.location.href =
      `/payment?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="text-xl font-semibold tracking-[0.22em] sm:text-2xl"
          >
            AURASTAYS
          </Link>

          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <ShieldCheck size={17} />
            Secure booking
          </div>
        </div>
      </header>

      {/* Progress */}

      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
              1
            </div>

            <span className="font-medium">
              Your details
            </span>

            <div className="h-px w-10 bg-neutral-200 sm:w-20" />

            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 text-xs text-neutral-400">
              2
            </div>

            <span className="hidden text-neutral-400 sm:inline">
              Payment
            </span>

            <div className="h-px w-10 bg-neutral-200 sm:w-20" />

            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 text-xs text-neutral-400">
              3
            </div>

            <span className="hidden text-neutral-400 sm:inline">
              Confirmation
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        {/* Back */}

        <Link
          href={`/hotel/${hotel.slug}/room/${room.id}`}
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          <ArrowLeft size={16} />
          Back to room
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
          {/* Main form */}

          <form
            onSubmit={handleContinue}
            className="space-y-6"
          >
            {/* Guest information */}

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Guest information
              </p>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Who's staying?
              </h1>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Enter the details of the primary guest
                for this reservation.
              </p>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                {/* First name */}

                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-medium"
                  >
                    First name
                  </label>

                  <div className="relative">
                    <User
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    />

                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(event) =>
                        setFirstName(
                          event.target.value,
                        )
                      }
                      placeholder="Enter first name"
                      autoComplete="given-name"
                      maxLength={50}
                      className="w-full rounded-2xl border border-neutral-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-neutral-900"
                    />
                  </div>
                </div>

                {/* Last name */}

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-medium"
                  >
                    Last name
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(event) =>
                      setLastName(
                        event.target.value,
                      )
                    }
                    placeholder="Enter last name"
                    autoComplete="family-name"
                    maxLength={50}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-neutral-900"
                  />
                </div>

                {/* Email */}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      maxLength={100}
                      className="w-full rounded-2xl border border-neutral-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-neutral-900"
                    />
                  </div>
                </div>

                {/* Phone */}

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium"
                  >
                    Phone number
                  </label>

                  <div className="relative">
                    <Phone
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    />

                    <div className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                      +91
                    </div>

                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="10-digit mobile number"
                      autoComplete="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      className="w-full rounded-2xl border border-neutral-200 bg-white py-3.5 pl-20 pr-4 text-sm outline-none transition focus:border-neutral-900"
                    />
                  </div>

                  <p className="mt-2 text-xs text-neutral-400">
                    {phone.length}/10 digits
                  </p>
                </div>
              </div>
            </section>

            {/* Stay details */}

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Stay details
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Your reservation
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-neutral-400">
                    Check-in
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(checkIn)}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    From 2:00 PM
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-neutral-400">
                    Check-out
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(checkOut)}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Until 11:00 AM
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-neutral-400">
                    Duration
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {nights}{" "}
                    {nights === 1
                      ? "night"
                      : "nights"}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    {roomCount}{" "}
                    {roomCount === 1
                      ? "room"
                      : "rooms"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
                <Clock3
                  size={18}
                  className="mt-0.5 shrink-0 text-neutral-500"
                />

                <div>
                  <p className="text-sm font-medium">
                    Check-in information
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Please carry a valid government-issued
                    ID matching the primary guest name.
                  </p>
                </div>
              </div>
            </section>

            {/* Special requests */}

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Optional
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Special requests
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Let the hotel know if you have any special
                requirements.
              </p>

              <textarea
                value={specialRequest}
                onChange={(event) =>
                  setSpecialRequest(
                    event.target.value,
                  )
                }
                placeholder="Early check-in, extra pillows, room preference..."
                rows={4}
                maxLength={500}
                className="mt-5 w-full resize-none rounded-2xl border border-neutral-200 px-4 py-3.5 text-sm outline-none transition focus:border-neutral-900"
              />

              <p className="mt-2 text-right text-xs text-neutral-400">
                {specialRequest.length}/500
              </p>
            </section>

            {/* Terms */}

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(event) =>
                    setAgreeTerms(
                      event.target.checked,
                    )
                  }
                  className="mt-1 h-4 w-4 accent-black"
                />

                <span className="text-sm leading-6 text-neutral-600">
                  I agree to the booking terms,
                  cancellation policy and hotel policies.
                  I confirm that the information provided
                  above is accurate.
                </span>
              </label>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </section>

            {/* Continue */}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              Continue to Payment
              <ArrowRight size={17} />
            </button>
          </form>

          {/* Booking summary */}

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/40">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={
                    room.image ||
                    hotel.image ||
                    "/placeholder-hotel.jpg"
                  }
                  alt={room.name}
                  className="h-full w-full object-cover"
                />

                <div className="absolute bottom-4 left-4 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                  {room.type}
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-semibold">
                  {hotel.name}
                </h2>

                <div className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                  <MapPin size={15} />
                  {hotel.location}
                </div>

                <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {room.name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {room.bed} · {room.size}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <Star
                        size={14}
                        className="fill-current"
                      />

                      {hotel.rating ?? 0}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-400">
                      Check-in
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {formatDate(checkIn)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-400">
                      Check-out
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {formatDate(checkOut)}
                    </p>
                  </div>
                </div>

                <div className="my-6 h-px bg-neutral-200" />

                <div className="space-y-3 text-sm">
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
                      {tax.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="h-px bg-neutral-200" />

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        Total
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        Inclusive of taxes
                      </p>
                    </div>

                    <p className="text-xl font-semibold">
                      ₹
                      {total.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    <p className="text-sm font-medium">
                      Secure booking
                    </p>

                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      Your payment will be processed securely
                      on the next step.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-neutral-50">
          <div className="text-sm text-neutral-500">
            Loading booking details...
          </div>
        </main>
      }
    >
      <BookingContent />
    </Suspense>
  );
}