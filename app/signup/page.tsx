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
  Sparkles,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validate fields
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password
    ) {
      setError("Please complete all fields.");
      return;
    }

    // Validate password
    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      // Create Supabase account
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,

          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,

            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: fullName,
            },
          },
        });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      // If email confirmation is enabled,
      // Supabase may not return a session immediately.
      if (!data.session) {
        setSuccess(
          "Account created successfully. Please check your email to verify your account."
        );

        return;
      }

      // Send welcome email through Supabase Edge Function
      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("send-auth-email", {
          body: {
            type: "welcome",
          },
        });

      if (emailError) {
        console.error("Welcome email error:", emailError);

        // Account is already created.
        // Email failure should not make signup fail.
        setSuccess(
          "Account created successfully, but the welcome email could not be sent."
        );

        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);

        return;
      }

      console.log("Welcome email response:", emailData);

      setSuccess(
        "Account created successfully! Welcome email sent to your Gmail."
      );

      // Redirect to home page
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Signup error:", err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f1eb] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1500px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_80px_rgba(30,25,15,0.12)] sm:min-h-[calc(100vh-40px)] lg:min-h-[calc(100vh-56px)]">

        {/* LEFT SECTION */}
        <section className="relative hidden w-[48%] overflow-hidden bg-[#171713] lg:block">
          <img
            src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=90"
            alt="Luxury hotel bedroom"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />

          {/* BRAND */}
          <div className="absolute left-10 top-9 z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md">
              <Sparkles
                size={19}
                className="text-[#e7c78b]"
              />
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

          {/* LEFT CONTENT */}
          <div className="absolute bottom-10 left-10 right-10 z-10">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#e7c78b]">
              A world of beautiful stays
            </p>

            <h2 className="max-w-lg text-4xl font-light leading-[1.15] text-white xl:text-5xl">
              Find your next

              <span className="block font-serif italic text-[#e7c78b]">
                unforgettable escape.
              </span>
            </h2>

            <p className="mt-5 max-w-md text-sm leading-6 text-white/65">
              Join AURASTAYS and unlock a more thoughtful way to discover,
              reserve, and experience remarkable places.
            </p>
          </div>
        </section>

        {/* RIGHT SECTION */}
        <section className="flex w-full flex-col justify-between px-6 py-8 sm:px-12 sm:py-10 lg:w-[52%] lg:px-16 xl:px-24">

          {/* MOBILE BRAND */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b1b17]">
              <Sparkles
                size={17}
                className="text-[#e7c78b]"
              />
            </div>

            <p className="text-lg font-semibold tracking-[0.18em] text-[#1b1b17]">
              AURASTAYS
            </p>
          </div>

          <div className="mx-auto w-full max-w-md">

            {/* HEADING */}
            <div className="mb-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e9dfcb] bg-[#fbf8f1] px-3 py-2">
                <Sparkles
                  size={13}
                  className="text-[#ad8545]"
                />

                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a763e]">
                  Join AURASTAYS
                </span>
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#1b1b17] sm:text-5xl">
                Create your

                <span className="block font-serif font-normal italic text-[#b28b4c]">
                  account.
                </span>
              </h1>

              <p className="mt-4 text-sm leading-6 text-gray-500">
                Your next extraordinary stay starts with a few simple details.
              </p>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSignup}
              className="space-y-5"
            >

              {/* NAME FIELDS */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* FIRST NAME */}
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.13em] text-[#5c5a52]">
                    First Name
                  </label>

                  <div className="relative">
                    <User
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      placeholder="Siddharth"
                      value={firstName}
                      onChange={(e) =>
                        setFirstName(e.target.value)
                      }
                      autoComplete="given-name"
                      className="h-14 w-full rounded-2xl border border-[#e7e4dc] bg-[#fcfbf8] pl-11 pr-3 text-sm outline-none transition focus:border-[#b28b4c] focus:bg-white focus:ring-4 focus:ring-[#b28b4c]/10"
                    />
                  </div>
                </div>

                {/* LAST NAME */}
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.13em] text-[#5c5a52]">
                    Last Name
                  </label>

                  <input
                    type="text"
                    placeholder="Bhandari"
                    value={lastName}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                    autoComplete="family-name"
                    className="h-14 w-full rounded-2xl border border-[#e7e4dc] bg-[#fcfbf8] px-4 text-sm outline-none transition focus:border-[#b28b4c] focus:bg-white focus:ring-4 focus:ring-[#b28b4c]/10"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#5c5a52]">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="h-14 w-full rounded-2xl border border-[#e7e4dc] bg-[#fcfbf8] pl-12 pr-4 text-sm outline-none transition focus:border-[#b28b4c] focus:bg-white focus:ring-4 focus:ring-[#b28b4c]/10"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#5c5a52]">
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="h-14 w-full rounded-2xl border border-[#e7e4dc] bg-[#fcfbf8] pl-12 pr-12 text-sm outline-none transition focus:border-[#b28b4c] focus:bg-white focus:ring-4 focus:ring-[#b28b4c]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1b1b17]"
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

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#1b1b17] text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-[#302f27] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account

                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* LOGIN LINK */}
            <p className="mt-7 text-center text-sm text-gray-500">
              Already have an account?{" "}

              <Link
                href="/login"
                className="font-semibold text-[#a77d3e] underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* FOOTER */}
          <div className="mt-10 flex items-center justify-between border-t border-[#eeeae2] pt-5">
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