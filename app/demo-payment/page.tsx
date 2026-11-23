"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type DemoBooking = {
  id: string;
  booking_number: string | null;
  total: number;
  status: string;
  payment: { status: string }[] | { status: string } | null;
};

function DemoPaymentContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";
  const [booking, setBooking] = useState<DemoBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("UPI");
  const [result, setResult] = useState<"success" | "failed" | null>(null);

  useEffect(() => {
    let active = true;
    async function loadBooking() {
      if (!bookingId) {
        setError("Booking reference is missing.");
        setLoading(false);
        return;
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("Please sign in to continue.");
        setLoading(false);
        return;
      }
      const { data, error: bookingError } = await supabase
        .from("bookings")
        .select("id, booking_number, total, status, payment:payments(status)")
        .eq("id", bookingId)
        .maybeSingle();
      if (!active) return;
      if (bookingError || !data) {
        setError("We couldn't find this booking or you don't have permission to view it.");
      } else {
        setBooking(data as unknown as DemoBooking);
      }
      setLoading(false);
    }
    loadBooking();
    return () => { active = false; };
  }, [bookingId]);

  if (loading) return <main className="flex min-h-screen items-center justify-center">Loading demo payment...</main>;
  if (error || !booking) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Demo payment unavailable</h1>
      <p className="max-w-lg text-neutral-500">{error}</p>
      <Link href="/bookings" className="rounded-xl bg-neutral-900 px-5 py-3 text-white">View my bookings</Link>
    </main>
  );

  const payment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment;
  const alreadyPaid = payment?.status === "paid";

  return (
    <main className="min-h-screen bg-neutral-50 px-5 py-10 text-neutral-900 sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link href="/bookings" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900">
          <ArrowLeft size={16} /> Back to bookings
        </Link>
        <div className="mt-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="bg-neutral-900 px-7 py-8 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-3"><CreditCard size={22} /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">AURASTAYS</p>
                <h1 className="mt-1 text-2xl font-semibold">Demo payment</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/75">This is a payment-flow preview. No real payment is processed and no payment details are collected.</p>
          </div>

          <div className="p-7">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">DEMO MODE — NO MONEY WILL BE CHARGED</p>
              <p className="mt-1 text-xs leading-5 text-amber-900">The buttons below only demonstrate success and failure states. Your booking and payment records will not be changed.</p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-neutral-500">Booking reference</span>
              <span className="text-sm font-semibold">{booking.booking_number || booking.id.slice(0, 8)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-neutral-500">Amount shown</span>
              <span className="text-2xl font-semibold">₹{Number(booking.total || 0).toLocaleString("en-IN")}</span>
            </div>

            <fieldset className="mt-7">
              <legend className="text-sm font-semibold">Choose a demo method</legend>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["UPI", "Card", "Net banking"].map((item) => (
                  <button key={item} type="button" onClick={() => setMethod(item)} className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${method === item ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:bg-neutral-50"}`}>
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            {alreadyPaid ? (
              <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">This booking is already marked as paid in the booking system.</div>
            ) : (
              <>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setResult("success")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-white hover:bg-neutral-700">
                    <CheckCircle2 size={17} /> Simulate success
                  </button>
                  <button type="button" onClick={() => setResult("failed")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 px-4 py-3.5 text-sm font-semibold hover:bg-neutral-50">
                    <XCircle size={17} /> Simulate failure
                  </button>
                </div>
                {result && (
                  <div className={`mt-5 rounded-2xl p-4 text-sm ${result === "success" ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
                    <p className="font-semibold">{result === "success" ? "Demo payment successful" : "Demo payment failed"}</p>
                    <p className="mt-1 leading-5">{result === "success" ? `The ${method} success screen was simulated. No money was collected, and your actual booking remains pending.` : `The ${method} failure screen was simulated. No money was collected, and your actual booking remains pending.`}</p>
                  </div>
                )}
              </>
            )}

            <div className="mt-7 flex items-center gap-2 text-xs text-neutral-400">
              <ShieldCheck size={15} /> Demo only · No gateway · No transaction
            </div>
            <Link href={`/confirmation?bookingId=${encodeURIComponent(booking.id)}`} className="mt-6 block w-full rounded-xl border border-neutral-300 px-5 py-3.5 text-center text-sm font-semibold hover:bg-neutral-50">
              View booking confirmation
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DemoPaymentPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center">Loading demo payment...</main>}><DemoPaymentContent /></Suspense>;
}
