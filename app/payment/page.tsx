"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Copy,
  Lock,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

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

  const [paymentMethod, setPaymentMethod] =
    useState<"upi" | "card">("upi");

  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [copied, setCopied] = useState(false);
  const [upiPaid, setUpiPaid] = useState(false);

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

  const merchantUpiId = "aurastays@upi";
  const merchantName = "AURASTAYS";

  const upiPaymentUrl =
    `upi://pay?pa=${encodeURIComponent(
      merchantUpiId,
    )}&pn=${encodeURIComponent(
      merchantName,
    )}&am=${total}&cu=INR`;

  const normalize = (value: unknown) => {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(
        merchantUpiId,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert("Unable to copy UPI ID.");
    }
  };

  const handleCardNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 16);

    const formatted = value
      .replace(/(.{4})/g, "$1 ")
      .trim();

    setCardNumber(formatted);
  };

  const handleExpiryChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 4);

    if (value.length >= 3) {
      setExpiry(
        `${value.slice(0, 2)}/${value.slice(2)}`,
      );
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 3);

    setCvv(value);
  };

  /*
   * Finds the database hotel and room.
   *
   * Room matching order:
   * 1. Database room ID
   * 2. Exact normalized room name
   * 3. Partial room name
   * 4. Matching room price
   *
   * This supports cases where the local room name
   * and database room name are slightly different.
   */
  const findDatabaseRoom = (
    databaseRooms: DatabaseRoom[],
  ) => {
    /*
     * Centralized room matching for every hotel.
     *
     * The frontend and database may use different room names, for example:
     *   Frontend: Deluxe Poolside Room
     *   Database: Palm Deluxe Room
     *
     * Matching therefore uses meaningful words from:
     * 1. Local room name
     * 2. Local room ID
     * 3. Room type
     * 4. Database room name
     * 5. Price proximity as a supporting signal only
     *
     * Price alone is never enough to select a room.
     */
    const stopWords = new Set([
      "room",
      "rooms",
      "the",
      "a",
      "an",
      "and",
      "of",
      "with",
      "sq",
      "ft",
    ]);

    const getTokens = (value: unknown) =>
      String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(
          (token) => token.length >= 3 && !stopWords.has(token),
        );

    const localNameTokens = getTokens(room.name);
    const localIdTokens = getTokens(room.id);
    const localTypeTokens = getTokens(room.type);
    const localPrice = Number(room.price);

    const scoredRooms = databaseRooms.map((databaseRoom) => {
      const databaseNameTokens = getTokens(databaseRoom.name);
      const databasePrice = Number(databaseRoom.price);

      const nameMatches = localNameTokens.filter((token) =>
        databaseNameTokens.includes(token),
      );

      const idMatches = localIdTokens.filter((token) =>
        databaseNameTokens.includes(token),
      );

      const typeMatches = localTypeTokens.filter((token) =>
        databaseNameTokens.includes(token),
      );

      let score = 0;

      // Strongest signal: exact database ID, if the IDs are shared.
      if (normalize(databaseRoom.id) === normalize(room.id)) {
        score += 200;
      }

      // Exact or contained normalized name match.
      const localNormalizedName = normalize(room.name);
      const databaseNormalizedName = normalize(databaseRoom.name);

      if (
        databaseNormalizedName &&
        databaseNormalizedName === localNormalizedName
      ) {
        score += 120;
      } else if (
        databaseNormalizedName &&
        (databaseNormalizedName.includes(localNormalizedName) ||
          localNormalizedName.includes(databaseNormalizedName))
      ) {
        score += 70;
      }

      // Meaningful word overlap handles different naming conventions.
      score += nameMatches.length * 30;
      score += idMatches.length * 12;
      score += typeMatches.length * 8;

      // Price proximity is only a supporting signal.
      if (databasePrice > 0 && localPrice > 0) {
        const differenceRatio =
          Math.abs(databasePrice - localPrice) / localPrice;

        if (differenceRatio <= 0.05) {
          score += 25;
        } else if (differenceRatio <= 0.15) {
          score += 12;
        } else if (differenceRatio <= 0.3) {
          score += 4;
        }
      }

      return {
        room: databaseRoom,
        score,
        nameMatches: nameMatches.length,
      };
    });

    scoredRooms.sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return second.nameMatches - first.nameMatches;
    });

    const bestMatch = scoredRooms[0];

    // Require a meaningful name/ID match; never match on price alone.
    if (!bestMatch || bestMatch.score < 30) {
      return null;
    }

    return bestMatch.room;
  };

  const handlePayment = async () => {
    if (!checkIn || !checkOut) {
      alert("Booking dates are missing.");
      return;
    }

    if (nights <= 0) {
      alert("Please select valid booking dates.");
      return;
    }

    if (paymentMethod === "upi" && !upiPaid) {
      alert(
        "Please scan the QR and complete the demo payment first.",
      );
      return;
    }

    if (paymentMethod === "card") {
      const cleanCardNumber =
        cardNumber.replace(/\s/g, "");

      if (cleanCardNumber.length !== 16) {
        alert(
          "Please enter a valid 16-digit card number.",
        );
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        alert(
          "Please enter expiry in MM/YY format.",
        );
        return;
      }

      if (cvv.length !== 3) {
        alert(
          "Please enter a valid 3-digit CVV.",
        );
        return;
      }

      if (!cardName.trim()) {
        alert("Please enter the name on card.");
        return;
      }
    }

    setIsProcessing(true);

    try {
      /*
       * Get logged-in user.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Please login before making a booking.",
        );
      }

      if (!user.email) {
        throw new Error(
          "Your account does not have an email address.",
        );
      }

      /*
       * Fetch all hotels using only columns
       * that are already present in your schema.
       *
       * We do not use .single() here because
       * we resolve the matching hotel manually.
       */
      const {
        data: databaseHotels,
        error: hotelError,
      } = await supabase
        .from("hotels")
        .select("id, slug");

      if (hotelError) {
        throw new Error(
          `Hotels could not be loaded: ${hotelError.message}`,
        );
      }

      if (
        !databaseHotels ||
        databaseHotels.length === 0
      ) {
        throw new Error(
          "No hotels were returned from the database. Please check Supabase RLS policies.",
        );
      }

      const normalizedHotelSlug =
        normalize(hotel.slug);

      const databaseHotel =
        (databaseHotels as DatabaseHotel[]).find(
          (item) =>
            normalize(item.slug) ===
            normalizedHotelSlug,
        );

      if (!databaseHotel) {
        const availableSlugs =
          databaseHotels
            .map((item) => item.slug)
            .filter(Boolean)
            .join(", ");

        throw new Error(
          `Hotel "${hotel.slug}" was not found. Available database slugs: ${availableSlugs}`,
        );
      }

      /*
       * Fetch rooms belonging to the selected hotel.
       */
      const {
        data: databaseRooms,
        error: roomsError,
      } = await supabase
        .from("rooms")
        .select("id, name, price")
        .eq("hotel_id", databaseHotel.id);

      if (roomsError) {
        throw new Error(
          `Rooms could not be loaded: ${roomsError.message}`,
        );
      }

      if (
        !databaseRooms ||
        databaseRooms.length === 0
      ) {
        throw new Error(
          `No rooms were found for "${hotel.name}" in the database.`,
        );
      }

      /*
       * Match local room with database room.
       */
      const databaseRoom = findDatabaseRoom(
        databaseRooms as DatabaseRoom[],
      );

      if (!databaseRoom) {
        const availableRooms =
          (databaseRooms as DatabaseRoom[])
            .map(
              (item) =>
                `${item.name || "Unnamed room"} (₹${item.price ?? "N/A"})`,
            )
            .join(", ");

        throw new Error(
          `Room "${room.name}" was not found for "${hotel.name}". Database rooms: ${availableRooms}`,
        );
      }

      /*
       * Use the database room price when available.
       * This keeps the booking amount connected
       * to the database record.
       */
      const databaseRoomPrice = Number(
        databaseRoom.price ?? room.price,
      );

      const databaseSubtotal =
        databaseRoomPrice * nights * roomCount;

      const databaseTax = Math.round(
        databaseSubtotal * 0.12,
      );

      const databaseTotal =
        databaseSubtotal + databaseTax;

      /*
       * Find customer by authenticated email.
       */
      const {
        data: existingCustomer,
        error: customerFetchError,
      } = await supabase
        .from("customers")
        .select("id")
        .ilike("email", user.email)
        .maybeSingle();

      if (customerFetchError) {
        throw new Error(
          `Customer could not be loaded: ${customerFetchError.message}`,
        );
      }

      let customerId = existingCustomer?.id;

      /*
       * Create customer if one does not exist.
       */
      if (!customerId) {
        const nameParts = (
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email.split("@")[0] ||
          "Guest"
        )
          .trim()
          .split(/\s+/);

        const firstName =
          nameParts[0] || "Guest";

        const lastName =
          nameParts.slice(1).join(" ") ||
          "Guest";

        const {
          data: newCustomer,
          error: customerInsertError,
        } = await supabase
          .from("customers")
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: user.email,
            phone: user.phone || null,
          })
          .select("id")
          .single();

        if (
          customerInsertError ||
          !newCustomer
        ) {
          throw new Error(
            customerInsertError?.message ||
              "Customer could not be created.",
          );
        }

        customerId = newCustomer.id;
      }

      /*
       * Create unique booking number.
       */
      const bookingNumber =
        `AURA-${Date.now()
          .toString()
          .slice(-8)}`;

      /*
       * Insert booking.
       */
      const {
        error: bookingError,
      } = await supabase
        .from("bookings")
        .insert({
          booking_number: bookingNumber,
          customer_id: customerId,
          hotel_id: databaseHotel.id,
          room_id: databaseRoom.id,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          rooms: roomCount,
          nights,
          room_price: databaseRoomPrice,
          subtotal: databaseSubtotal,
          tax: databaseTax,
          total: databaseTotal,
          status: "confirmed",
        });

      if (bookingError) {
        throw new Error(
          `Booking could not be created: ${bookingError.message}`,
        );
      }

      /*
       * Redirect to confirmation page.
       */
      const params = new URLSearchParams();

      params.set(
        "bookingId",
        bookingNumber,
      );

      params.set("hotel", hotel.slug);
      params.set("room", room.id);
      params.set("checkIn", checkIn);
      params.set("checkOut", checkOut);
      params.set("guests", String(guests));
      params.set("rooms", String(roomCount));
      params.set("nights", String(nights));
      params.set(
        "total",
        String(databaseTotal),
      );

      router.push(
        `/confirmation?${params.toString()}`,
      );
    } catch (error) {
      console.error(
        "Booking creation error:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Booking could not be completed. Please try again.",
      );

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

              {/* PAYMENT METHODS */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("upi");
                    setUpiPaid(false);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition ${
                    paymentMethod === "upi"
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <Smartphone size={18} />
                  UPI
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod("card")
                  }
                  className={`flex items-center justify-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition ${
                    paymentMethod === "card"
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <CreditCard size={18} />
                  Card
                </button>
              </div>

              {/* UPI PAYMENT */}
              {paymentMethod === "upi" && (
                <div className="mt-6">
                  <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
                    <div className="text-center">
                      <h2 className="text-lg font-semibold">
                        Scan & Pay
                      </h2>

                      <p className="mt-1 text-sm text-neutral-500">
                        Scan this QR code using any
                        supported UPI app
                      </p>
                    </div>

                    <div className="mx-auto mt-6 flex w-fit rounded-2xl bg-white p-5 shadow-sm">
                      <QRCodeSVG
                        value={upiPaymentUrl}
                        size={210}
                        bgColor="#ffffff"
                        fgColor="#111111"
                        level="M"
                        includeMargin
                      />
                    </div>

                    <div className="mt-5 text-center">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                        Amount to pay
                      </p>

                      <p className="mt-1 text-2xl font-semibold">
                        ₹
                        {total.toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="text-center text-xs text-neutral-500">
                        Or pay using UPI ID
                      </p>

                      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-2 pl-4">
                        <span className="flex-1 truncate text-sm font-medium">
                          {merchantUpiId}
                        </span>

                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="flex shrink-0 items-center gap-2 rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-neutral-700"
                        >
                          {copied ? (
                            <>
                              <Check size={14} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setUpiPaid(true)
                      }
                      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition ${
                        upiPaid
                          ? "bg-neutral-100 text-neutral-700"
                          : "bg-white text-neutral-900 ring-1 ring-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      {upiPaid ? (
                        <>
                          <Check size={17} />
                          Payment marked as paid
                        </>
                      ) : (
                        <>
                          <Check size={17} />
                          I've completed the payment
                        </>
                      )}
                    </button>

                    <p className="mt-3 text-center text-xs leading-5 text-neutral-400">
                      Demo mode: payment verification
                      is simulated. Real UPI verification
                      will be connected later.
                    </p>
                  </div>
                </div>
              )}

              {/* CARD PAYMENT */}
              {paymentMethod === "card" && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="cardNumber"
                      className="text-sm font-medium"
                    >
                      Card number
                    </label>

                    <div className="mt-2 rounded-2xl border border-neutral-200 px-4 py-3 focus-within:border-neutral-900">
                      <input
                        id="cardNumber"
                        type="text"
                        inputMode="numeric"
                        value={cardNumber}
                        onChange={
                          handleCardNumberChange
                        }
                        placeholder="1234 5678 9012 3456"
                        className="w-full bg-transparent text-sm tracking-wider outline-none placeholder:text-neutral-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="expiry"
                        className="text-sm font-medium"
                      >
                        Expiry
                      </label>

                      <div className="mt-2 rounded-2xl border border-neutral-200 px-4 py-3 focus-within:border-neutral-900">
                        <input
                          id="expiry"
                          type="text"
                          inputMode="numeric"
                          value={expiry}
                          onChange={
                            handleExpiryChange
                          }
                          placeholder="MM/YY"
                          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="cvv"
                        className="text-sm font-medium"
                      >
                        CVV
                      </label>

                      <div className="mt-2 rounded-2xl border border-neutral-200 px-4 py-3 focus-within:border-neutral-900">
                        <input
                          id="cvv"
                          type="password"
                          inputMode="numeric"
                          value={cvv}
                          onChange={
                            handleCvvChange
                          }
                          placeholder="•••"
                          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="cardName"
                      className="text-sm font-medium"
                    >
                      Name on card
                    </label>

                    <div className="mt-2 rounded-2xl border border-neutral-200 px-4 py-3 focus-within:border-neutral-900">
                      <input
                        id="cardName"
                        type="text"
                        value={cardName}
                        onChange={(event) =>
                          setCardName(
                            event.target.value.slice(
                              0,
                              80,
                            ),
                          )
                        }
                        placeholder="Enter name as shown on card"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                    Processing payment...
                  </>
                ) : (
                  <>
                    Pay ₹
                    {total.toLocaleString(
                      "en-IN",
                    )}
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