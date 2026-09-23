"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    setSuccess("Welcome back to AURASTAYS.");

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 800);
  };

  return (
    <main className="min-h-screen bg-[#f4f1eb] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1500px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_80px_rgba(30,25,15,0.12)] sm:min-h-[calc(100vh-40px)] lg:min-h-[calc(100vh-56px)]">

        {/* LEFT VISUAL SECTION */}
        <section className="relative hidden w-[52%] overflow-hidden bg-[#171713] lg:block">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=90"
            alt="Luxury hotel interior"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />

          {/* BRAND */}
          <div className="absolute left-10 top-9 z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md">
              <Sparkles size={19} className="text-[#e7c78b]" />
            </div>

            <div>
              <p className="text-xl font-semibold tracking-[0.18em] text-white">
                AURASTAYS
              </p>

              <p className="text-[9px] tracking-[0.35em] text-white/60">
                EXCEPTIONAL STAYS
              </p>
            </div>
          </div>

          {/* IMAGE CONTENT */}
          <div className="absolute bottom-10 left-10 right-10 z-10">
            <div className="mb-5 flex items-center gap-2">
              <Star
                size={14}
                fill="#e7c78b"
                className="text-[#e7c78b]"
              />
              <Star
                size={14}
                fill="#e7c78b"
                className="text-[#e7c78b]"
              />
              <Star
                size={14}
                fill="#e7c78b"
                className="text-[#e7c78b]"
              />
              <Star
                size={14}
                fill="#e7c78b"
                className="text-[#e7c78b]"
              />
              <Star
                size={14}
                fill="#e7c78b"
                className="text-[#e7c78b]"
              />

              <span className="ml-2 text-xs text-white/70">
                Curated hospitality
              </span>
            </div>

            <h2 className="max-w-lg text-4xl font-light leading-[1.15] tracking-tight text-white xl:text-5xl">
              Every stay deserves
              <span className="block font-serif italic text-[#e7c78b]">
                a beautiful story.
              </span>
            </h2>

            <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
              Discover thoughtfully selected spaces, unforgettable
              experiences, and stays designed around you.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-px w-12 bg-[#e7c78b]" />

              <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">
                Your journey begins here
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT LOGIN SECTION */}
        <section className="flex w-full flex-col justify-between px-6 py-8 sm:px-12 sm:py-10 lg:w-[48%] lg:px-16 xl:px-24">

          {/* MOBILE BRAND */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b1b17]">
              <Sparkles size={17} className="text-[#e7c78b]" />
            </div>

            <div>
              <p className="text-lg font-semibold tracking-[0.18em] text-[#1b1b17]">
                AURASTAYS
              </p>

              <p className="text-[8px] tracking-[0.3em] text-gray-400">
                EXCEPTIONAL STAYS
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">

            {/* HEADING */}
            <div className="mb-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e9dfcb] bg-[#fbf8f1] px-3 py-2">
                <Sparkles size={13} className="text-[#ad8545]" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a763e]">
                  Member Access
                </span>
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#1b1b17] sm:text-5xl">
                Welcome
                <span className="block font-serif font-normal italic text-[#b28b4c]">
                  back.
                </span>
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-6 text-gray-500">
                Sign in to manage your reservations and continue discovering
                exceptional stays.
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleLogin} className="space-y-6">

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#5c5a52]"
                >
                  Email Address
                </label>

                <div className="group relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-[#b28b4c]"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-[#e7e4dc] bg-[#fcfbf8] pl-12 pr-4 text-sm text-[#1b1b17] outline-none transition placeholder:text-gray-400 focus:border-[#b28b4c] focus:bg-white focus:ring-4 focus:ring-[#b28b4c]/10"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5c5a52]"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-[11px] font-medium text-[#ad8545] transition hover:text-[#80602d]"
                    onClick={() => {
                      setError("Password reset will be added soon.");
                      setSuccess("");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="group relative">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition group-focus-within:text-[#b28b4c]"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-[#e7e4dc] bg-[#fcfbf8] pl-12 pr-12 text-sm text-[#1b1b17] outline-none transition placeholder:text-gray-400 focus:border-[#b28b4c] focus:bg-white focus:ring-4 focus:ring-[#b28b4c]/10"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#1b1b17]"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* ALERTS */}
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs leading-5 text-green-700">
                  {success}
                </div>
              )}

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1b1b17] text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-[#302f27] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing you in...
                  </>
                ) : (
                  <>
                    Continue to AURASTAYS

                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* SIGNUP */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                New to AURASTAYS?{" "}

                <Link
                  href="/signup"
                  className="font-semibold text-[#a77d3e] underline-offset-4 transition hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>

            {/* SECURITY NOTE */}
            <div className="mt-10 flex items-center justify-center gap-2 text-center text-[10px] uppercase tracking-[0.13em] text-gray-400">
              <ShieldCheck size={14} className="text-[#b28b4c]" />
              Secure authentication powered by Supabase
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-12 flex items-center justify-between border-t border-[#eeeae2] pt-5">
            <Link
              href="/"
              className="text-xs text-gray-400 transition hover:text-[#1b1b17]"
            >
              ← Back to home
            </Link>

            <p className="text-[10px] tracking-wide text-gray-400">
              © {new Date().getFullYear()} AURASTAYS
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}