
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Hotel,
  MapPin,
  Receipt,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { hotels } from "@/data/hotels";
import { rooms } from "@/data/rooms";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: string;
  booking_number: string;
  customer_id: string | null;
  hotel_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  rooms: number;
  nights: number;
  room_price: number;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
};

type DatabaseHotel = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  image: string | null;
};

type DatabaseRoom = {
  id: string;
  name: string;
  price: number | null;
};

type BookingWithDetails = Booking & {
  hotel: DatabaseHotel | null;
  room: DatabaseRoom | null;
};

type LoadingState =
  | "loading"
  | "success"
  | "error";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<
    BookingWithDetails[]
  >([]);

  const [loadingState, setLoadingState] =
    useState<LoadingState>("loading");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const normalizeValue = (
    value: unknown,
  ) => {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  };

  const formatDate = (
    dateValue: string,
  ) => {
    if (!dateValue) {
      return "Not specified";
    }

    const date = new Date(
      `${dateValue}T00:00:00`,
    );

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    );
  };

  const formatCurrency = (
    amount: number,
  ) => {
    return `₹${Number(amount || 0).toLocaleString(
      "en-IN",
    )}`;
  };

  const getStatusLabel = (
    status: string,
  ) => {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      );
  };

  const getStatusClasses = (
    status: string,
  ) => {
    const normalizedStatus =
      status.toLowerCase();

    if (
      normalizedStatus === "confirmed" ||
      normalizedStatus === "completed"
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      normalizedStatus === "cancelled" ||
      normalizedStatus === "canceled"
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      normalizedStatus === "pending"
    ) {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-neutral-100 text-neutral-700";
  };

  const getStatusIcon = (
    status: string,
  ) => {
    const normalizedStatus =
      status.toLowerCase();

    if (
      normalizedStatus === "confirmed" ||
      normalizedStatus === "completed"
    ) {
      return <CheckCircle2 size={14} />;
    }

    if (
      normalizedStatus === "cancelled" ||
      normalizedStatus === "canceled"
    ) {
      return <XCircle size={14} />;
    }

    return <Clock size={14} />;
  };

  const findLocalHotel = (
    databaseHotel: DatabaseHotel,
  ) => {
    return hotels.find(
      (localHotel) =>
        normalizeValue(localHotel.slug) ===
        normalizeValue(databaseHotel.slug),
    );
  };

  const findLocalRoom = (
    databaseRoom: DatabaseRoom,
    databaseHotel: DatabaseHotel,
  ) => {
    const localHotel =
      findLocalHotel(databaseHotel);

    if (!localHotel) {
      return undefined;
    }

    return rooms.find((localRoom) => {
      const sameHotel =
        localRoom.hotelSlug ===
        localHotel.slug;

      const sameRoomId =
        String(localRoom.id) ===
        String(databaseRoom.id);

      const sameRoomName =
        normalizeValue(localRoom.name) ===
        normalizeValue(databaseRoom.name);

      return (
        sameHotel &&
        (sameRoomId || sameRoomName)
      );
    });
  };

  const loadBookings = async () => {
    try {
      setErrorMessage("");

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(
          `Authentication error: ${authError.message}`,
        );
      }

      const user = authData.user;

      if (!user) {
        throw new Error(
          "Please login to view your bookings.",
        );
      }

      if (!user.email) {
        throw new Error(
          "Your account does not have an email address.",
        );
      }

      /*
       * STEP 1:
       * Find the customer linked to the
       * currently logged-in user's email.
       */
      const {
        data: customer,
        error: customerError,
      } = await supabase
        .from("customers")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (customerError) {
        throw new Error(
          `Customer could not be loaded: ${customerError.message}`,
        );
      }

      if (!customer) {
        setBookings([]);
        setLoadingState("success");
        return;
      }

      /*
       * STEP 2:
       * Fetch bookings belonging to this customer.
       */
      const {
        data: bookingData,
        error: bookingError,
      } = await supabase
        .from("bookings")
        .select(
          `
          id,
          booking_number,
          customer_id,
          hotel_id,
          room_id,
          check_in,
          check_out,
          guests,
          rooms,
          nights,
          room_price,
          subtotal,
          tax,
          total,
          status
          `,
        )
        .eq("customer_id", customer.id)
        .order("check_in", {
          ascending: false,
        });

      if (bookingError) {
        throw new Error(
          `Bookings could not be loaded: ${bookingError.message}`,
        );
      }

      const databaseBookings =
        (bookingData || []) as Booking[];

      if (databaseBookings.length === 0) {
        setBookings([]);
        setLoadingState("success");
        return;
      }

      /*
       * STEP 3:
       * Fetch all hotel records used by bookings.
       */
      const {
        data: hotelData,
        error: hotelError,
      } = await supabase
        .from("hotels")
        .select(
          "id, name, slug, location, image",
        );

      if (hotelError) {
        throw new Error(
          `Hotels could not be loaded: ${hotelError.message}`,
        );
      }

      const databaseHotels =
        (hotelData || []) as DatabaseHotel[];

      /*
       * STEP 4:
       * Fetch all room records used by bookings.
       */
      const {
        data: roomData,
        error: roomError,
      } = await supabase
        .from("rooms")
        .select("id, name, price");

      if (roomError) {
        throw new Error(
          `Rooms could not be loaded: ${roomError.message}`,
        );
      }

      const databaseRooms =
        (roomData || []) as DatabaseRoom[];

      /*
       * STEP 5:
       * Combine booking, hotel and room details.
       */
      const combinedBookings =
        databaseBookings.map((booking) => {
          const matchingHotel =
            databaseHotels.find(
              (hotel) =>
                String(hotel.id) ===
                String(booking.hotel_id),
            ) || null;

          const matchingRoom =
            databaseRooms.find(
              (room) =>
                String(room.id) ===
                String(booking.room_id),
            ) || null;

          return {
            ...booking,
            hotel: matchingHotel,
            room: matchingRoom,
          };
        });

      setBookings(combinedBookings);
      setLoadingState("success");
    } catch (error) {
      console.error(
        "My bookings loading error:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Bookings could not be loaded.",
      );

      setLoadingState("error");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBookings();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  if (loadingState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex items-center gap-3 text-neutral-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          Loading your bookings...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="text-xl font-semibold tracking-[0.22em] sm:text-2xl"
          >
            AURASTAYS
          </Link>

          <Link
            href="/profile"
            className="text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
          >
            My Profile
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Your account
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              My Bookings
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              View and manage your AURASTAYS reservations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                isRefreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {loadingState === "error" && (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <XCircle
                size={21}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load bookings
                </h2>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  {errorMessage}
                </p>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="mt-4 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
                >
                  Try again
                </button>
              </div>
            </div>
          </section>
        )}

        {loadingState === "success" &&
          bookings.length === 0 && (
            <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <Hotel
                  size={28}
                  className="text-neutral-500"
                />
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                No bookings yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                You haven't made any reservations yet.
                Explore our stays and plan your next
                getaway.
              </p>

              <Link
                href="/search"
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
              >
                Explore stays
              </Link>
            </section>
          )}

        {loadingState === "success" &&
          bookings.length > 0 && (
            <div className="mt-8 space-y-6">
              {bookings.map((booking) => {
                const localHotel =
                  booking.hotel
                    ? findLocalHotel(
                        booking.hotel,
                      )
                    : undefined;

                const localRoom =
                  booking.hotel &&
                  booking.room
                    ? findLocalRoom(
                        booking.room,
                        booking.hotel,
                      )
                    : undefined;

                const hotelName =
                  booking.hotel?.name ||
                  localHotel?.name ||
                  "AURASTAYS Hotel";

                const roomName =
                  booking.room?.name ||
                  localRoom?.name ||
                  "Selected Room";

                const hotelLocation =
                  booking.hotel?.location ||
                  localHotel?.location ||
                  "Location unavailable";

                const hotelImage =
                  localRoom?.image ||
                  localHotel?.image ||
                  booking.hotel?.image ||
                  "/placeholder.jpg";

                return (
                  <article
                    key={booking.id}
                    className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="grid lg:grid-cols-[280px_1fr]">
                      <div className="h-56 lg:h-full">
                        <img
                          src={hotelImage}
                          alt={hotelName}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="p-6 sm:p-8">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                              Booking
                            </p>

                            <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                              {hotelName}
                            </h2>

                            <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                              <MapPin size={15} />
                              {hotelLocation}
                            </div>

                            <p className="mt-2 text-sm text-neutral-500">
                              {roomName}
                            </p>
                          </div>

                          <span
                            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                              booking.status,
                            )}`}
                          >
                            {getStatusIcon(
                              booking.status,
                            )}
                            {getStatusLabel(
                              booking.status,
                            )}
                          </span>
                        </div>

                        <div className="mt-6 grid gap-4 border-t border-neutral-200 pt-6 sm:grid-cols-2">
                          <div className="flex items-start gap-3">
                            <CalendarDays
                              size={18}
                              className="mt-0.5 text-neutral-400"
                            />

                            <div>
                              <p className="text-xs text-neutral-400">
                                Check-in
                              </p>

                              <p className="mt-1 text-sm font-medium">
                                {formatDate(
                                  booking.check_in,
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <CalendarDays
                              size={18}
                              className="mt-0.5 text-neutral-400"
                            />

                            <div>
                              <p className="text-xs text-neutral-400">
                                Check-out
                              </p>

                              <p className="mt-1 text-sm font-medium">
                                {formatDate(
                                  booking.check_out,
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Hotel
                              size={18}
                              className="mt-0.5 text-neutral-400"
                            />

                            <div>
                              <p className="text-xs text-neutral-400">
                                Room and guests
                              </p>

                              <p className="mt-1 text-sm font-medium">
                                {booking.rooms}{" "}
                                {booking.rooms === 1
                                  ? "Room"
                                  : "Rooms"}{" "}
                                ·{" "}
                                {booking.guests}{" "}
                                {booking.guests === 1
                                  ? "Guest"
                                  : "Guests"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Receipt
                              size={18}
                              className="mt-0.5 text-neutral-400"
                            />

                            <div>
                              <p className="text-xs text-neutral-400">
                                Booking number
                              </p>

                              <p className="mt-1 text-sm font-medium">
                                {booking.booking_number}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-xs text-neutral-400">
                              Total amount
                            </p>

                            <p className="mt-1 text-xl font-semibold">
                              {formatCurrency(
                                booking.total,
                              )}
                            </p>
                          </div>

                          <Link
                            href={`/confirmation?bookingId=${encodeURIComponent(
                              booking.booking_number,
                            )}&hotel=${encodeURIComponent(
                              booking.hotel?.slug ||
                                localHotel?.slug ||
                                "",
                            )}&room=${encodeURIComponent(
                              localRoom?.id ||
                                booking.room_id,
                            )}&checkIn=${encodeURIComponent(
                              booking.check_in,
                            )}&checkOut=${encodeURIComponent(
                              booking.check_out,
                            )}&guests=${booking.guests}&rooms=${booking.rooms}&nights=${booking.nights}&total=${booking.total}`}
                            className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
                          >
                            View booking
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </div>
    </main>
  );
}