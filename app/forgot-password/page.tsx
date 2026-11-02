"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSent(false);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    // Supabase intentionally returns the same result whether or not an account exists.
    setSent(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f1eb] p-4">
      <section className="w-full max-w-md rounded-[28px] bg-white px-7 py-9 shadow-[0_20px_80px_rgba(30,25,15,0.12)] sm:px-10">
        <Link href="/login" className="mb-9 inline-flex items-center gap-2 text-xs text-gray-500 transition hover:text-[#1b1b17]">
          <ArrowLeft size={15} /> Back to login
        </Link>

        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-full bg-[#1b1b17]">
          <Sparkles size={19} className="text-[#e7c78b]" />
        </div>

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a763e]">Account recovery</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#1b1b17]">
          Forgot your <span className="font-serif font-normal italic text-[#b28b4c]">password?</span>
        </h1>
        <p className="mt-4 text-sm leading-6 text-gray-500">
          Enter the email address linked to your AURASTAYS account. We’ll send you a secure link to choose a new password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#5c5a52]">
              Email Address
            </label>
            <div className="relative">
              <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your registered email"
                className="h-14 w-full rounded-2xl border border-[#e7e4dc] bg-[#fcfbf8] pl-12 pr-4 text-sm text-[#1b1b17] outline-none transition placeholder:text-gray-400 focus:border-[#b28b4c] focus:bg-white focus:ring-4 focus:ring-[#b28b4c]/10"
              />
            </div>
          </div>

          {error && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">{error}</p>}
          {sent && (
            <div role="status" className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs leading-5 text-green-700">
              If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.
            </div>
          )}

          <button type="submit" disabled={loading} className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#1b1b17] text-sm font-semibold text-white transition hover:bg-[#302f27] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.13em] text-gray-400">
          Secure authentication powered by Supabase
        </p>
      </section>
    </main>
  );
}
