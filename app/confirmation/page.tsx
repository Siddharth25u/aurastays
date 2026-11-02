"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Download,
  Home,
  MapPin,
  CalendarDays,
  Users,
  BedDouble,
  Receipt,
} from "lucide-react";

import { hotels } from "@/data/hotels";
import { supabase } from "@/lib/supabase";

function ConfirmationContent() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("bookingId") || "";
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadBooking() {
      if (!bookingId) {
        setLoadError("Booking reference is missing.");
        setLoading(false);
        return;
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setLoadError("Please sign in to view this booking.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_number, check_in, check_out, guests, rooms, nights, room_price, subtotal, tax, total, status, hotel:hotels(name, location), room:rooms(name), payment:payments(status)")
        .eq("id", bookingId)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        setLoadError("Booking not found or you do not have permission to view it.");
      } else {
        setBooking(data);
      }
      setLoading(false);
    }
    loadBooking();
    return () => { active = false; };
  }, [bookingId]);

  if (loading) return <main className="flex min-h-screen items-center justify-center">Loading booking...</main>;
  if (loadError || !booking) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Booking unavailable</h1>
      <p className="text-neutral-500">{loadError}</p>
      <Link href="/bookings" className="rounded-xl bg-neutral-900 px-5 py-3 text-white">View my bookings</Link>
    </main>
  );

  const hotelName = (Array.isArray(booking.hotel) ? booking.hotels[0]?.name : booking.hotels?.name) || "Your hotel";
  const hotelLocation = (Array.isArray(booking.hotels) ? booking.hotels[0]?.location : booking.hotels?.location) || "";
  const roomName = (Array.isArray(booking.rooms) ? booking.room[0]?.name : booking.room?.name) || "Selected room";
  const checkIn = booking.check_in;
  const checkOut = booking.check_out;
  const guests = Number(booking.guests);
  const roomCount = Number(booking.rooms);
  const nights = Number(booking.nights);
  const subtotal = Number(booking.subtotal);
  const tax = Number(booking.tax);
  const finalTotal = Number(booking.total);
  const bookingNumber = booking.booking_number;
  const paymentStatus = Array.isArray(booking.payment) ? booking.payments[0]?.status : booking.payments?.status;
  const isPaid = paymentStatus === "paid";
  const isConfirmed = booking.status === "confirmed" && isPaid;

  /*
   * Browser print dialog.
   *
   * Later this can be replaced with
   * actual PDF invoice generation.
   */

  const handleDownloadInvoice = () => {
    window.print();
  };

  return (
    <>
      {/* Print-only styles */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-neutral-50 text-neutral-900">
        {/* Header */}

        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-5 sm:px-8">
            <Link
              href="/"
              className="text-xl font-semibold tracking-[0.22em] sm:text-2xl"
            >
              AURASTAYS
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
          {/* Success */}

          <section className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg">
              <Check size={38} strokeWidth={2.5} />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
              {isConfirmed ? "Reservation confirmed" : "Booking pending"}
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              {isConfirmed ? "Your stay is confirmed" : "Your booking is pending"}
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base">
              {isConfirmed ? "Your reservation is confirmed. We look forward to welcoming you." : "Your booking request has been saved. Payment is still pending; your stay is not confirmed yet."}
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm shadow-sm">
              <span className="text-neutral-500">
                Booking ID
              </span>

              <span className="font-semibold">
                {bookingNumber}
              </span>
            </div>
          </section>

          {/* Main Card */}

          <section className="print-card mt-10 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            {/* Hotel */}

            <div className="grid lg:grid-cols-[320px_1fr]">
              <div className="h-64 lg:h-full">
                <img
                  src={roomImage}
                  alt={roomName}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Your stay
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {hotelName}
                </h2>

                {hotelLocation && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                    <MapPin size={15} />
                    {hotelLocation}
                  </div>
                )}

                <div className="mt-6">
                  <p className="text-sm text-neutral-500">
                    Room
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {roomName}
                  </p>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {/* Check-in */}

                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-neutral-100 p-2.5">
                      <CalendarDays size={18} />
                    </div>

                    <div>
                      <p className="text-xs text-neutral-400">
                        Check-in
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {checkIn || "Not specified"}
                      </p>
                    </div>
                  </div>

                  {/* Check-out */}

                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-neutral-100 p-2.5">
                      <CalendarDays size={18} />
                    </div>

                    <div>
                      <p className="text-xs text-neutral-400">
                        Check-out
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {checkOut || "Not specified"}
                      </p>
                    </div>
                  </div>

                  {/* Guests */}

                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-neutral-100 p-2.5">
                      <Users size={18} />
                    </div>

                    <div>
                      <p className="text-xs text-neutral-400">
                        Guests
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {guests}{" "}
                        {guests === 1 ? "Guest" : "Guests"}
                      </p>
                    </div>
                  </div>

                  {/* Rooms */}

                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-neutral-100 p-2.5">
                      <BedDouble size={18} />
                    </div>

                    <div>
                      <p className="text-xs text-neutral-400">
                        Rooms
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {roomCount}{" "}
                        {roomCount === 1 ? "Room" : "Rooms"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}

            <div className="border-t border-neutral-200 p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <Receipt size={19} />

                <h3 className="text-lg font-semibold">
                  Payment summary
                </h3>
              </div>

              <div className="mt-6 max-w-xl space-y-4">
                {/* Room Charges */}

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">
                    Room charges
                  </span>

                  <span className="font-medium">
                    ₹
                    {subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Taxes */}

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">
                    Taxes & fees
                  </span>

                  <span className="font-medium">
                    ₹
                    {tax.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="h-px bg-neutral-200" />

                {/* Total */}

                <div className="flex justify-between gap-4 text-lg font-semibold">
                  <span>Total amount</span>

                  <span>
                    ₹
                    {finalTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Payment Status */}

              <div className="mt-6 flex max-w-xl items-center justify-between rounded-2xl bg-neutral-50 p-4">
                <div>
                  <p className="text-xs text-neutral-400">
                    Payment status
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {isPaid ? "Payment received" : "Awaiting payment verification"}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white">
                  <Check size={13} />
                  {isPaid ? "PAID" : "PENDING"}
                </div>
              </div>
            </div>
          </section>

          {/* Email Notice */}

          <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 text-center">
            <p className="text-sm font-semibold">
              Booking confirmation
            </p>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Your booking details are shown above. Payment confirmation will appear here after the payment provider verifies it.
            </p>
          </div>

          {/* Actions */}

          <div className="no-print mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white px-6 py-3.5 text-sm font-semibold transition hover:bg-neutral-100"
            >
              <Download size={17} />
              Download Invoice
            </button>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              <Home size={17} />
              Back to Home
            </Link>
          </div>

          {/* Footer */}

          <p className="no-print mt-8 text-center text-xs text-neutral-400">
            Thank you for choosing AURASTAYS.
          </p>
        </div>
      </main>
    </>
  );
}

/*
 * Suspense boundary is required because
 * useSearchParams() is used inside the page.
 */

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading confirmation...
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}