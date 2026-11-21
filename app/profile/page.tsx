
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserRound,
  Mail,
  ShieldCheck,
  LogOut,
  CalendarDays,
  Star,
  Loader2,
  Sparkles,
  Award,
  Bell,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type UserData = {
  id: string;
  email?: string;
  created_at?: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setUser({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      });

      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not available";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#11110e] text-white">
        <div className="flex items-center gap-3 text-white/70">
          <Loader2 className="animate-spin" size={22} />
          Loading your profile...
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const userInitial = (user.email?.charAt(0) || "U").toUpperCase();

  return (
    <main className="min-h-screen bg-[#11110e] px-5 py-8 text-white sm:px-8 lg:px-12">
      {/* BACK TO HOME */}
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>
      </div>

      {/* PAGE HEADER */}
      <section className="mx-auto mt-12 max-w-6xl">
        <div className="flex items-center gap-3">
          <Sparkles className="text-[#e7c78b]" size={22} />

          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#e7c78b]">
            AURASTAYS
          </p>
        </div>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          My Profile
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
          Manage your account and explore your journey with AURASTAYS.
        </p>
      </section>

      {/* PROFILE CONTENT */}
      <section className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* PROFILE CARD */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col items-center text-center">
            {/* AVATAR */}
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#e7c78b]/40 bg-[#e7c78b] text-4xl font-semibold text-black shadow-xl shadow-[#e7c78b]/10">
              {userInitial}
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              Welcome to AURASTAYS
            </h2>

            <p className="mt-2 max-w-full truncate text-sm text-white/50">
              {user.email}
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300">
              <ShieldCheck size={14} />
              Verified session
            </div>
          </div>

          <div className="my-8 h-px bg-white/10" />

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <LogOut size={17} />
            )}

            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        {/* ACCOUNT INFORMATION */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Account Information</h2>

            <UserRound className="text-[#e7c78b]" size={22} />
          </div>

          <div className="mt-8 space-y-4">
            {/* EMAIL */}
            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="rounded-xl bg-white/10 p-3">
                <Mail className="text-[#e7c78b]" size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Email Address
                </p>

                <p className="mt-1 break-all text-sm text-white/90">
                  {user.email || "Not available"}
                </p>
              </div>
            </div>

            {/* ACCOUNT CREATED */}
            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="rounded-xl bg-white/10 p-3">
                <CalendarDays className="text-[#e7c78b]" size={19} />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Member Since
                </p>

                <p className="mt-1 text-sm text-white/90">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* USER ID */}
            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="rounded-xl bg-white/10 p-3">
                <ShieldCheck className="text-[#e7c78b]" size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Account ID
                </p>

                <p className="mt-1 break-all text-xs text-white/60">
                  {user.id}
                </p>
              </div>
            </div>
          </div>

          {/* ACCOUNT SHORTCUTS */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link href="/bookings" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#e7c78b]/40">
              <CalendarDays className="text-[#e7c78b]" size={22}/>
              <h3 className="mt-4 text-sm font-semibold">My Bookings</h3>
              <p className="mt-2 text-xs leading-5 text-white/45">View and manage your hotel reservations.</p>
            </Link>
            <Link href="/rewards" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#e7c78b]/40">
              <Award className="text-[#e7c78b]" size={22}/>
              <h3 className="mt-4 text-sm font-semibold">Aura Rewards</h3>
              <p className="mt-2 text-xs leading-5 text-white/45">Track points earned from completed paid stays.</p>
            </Link>
            <Link href="/aura-match" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#e7c78b]/40">
              <Sparkles className="text-[#e7c78b]" size={22}/>
              <h3 className="mt-4 text-sm font-semibold">Aura Match</h3>
              <p className="mt-2 text-xs leading-5 text-white/45">Discover stays matched to your mood and budget.</p>
            </Link>
            <Link href="/hotel-alerts" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#e7c78b]/40">
              <Bell className="text-[#e7c78b]" size={22}/>
              <h3 className="mt-4 text-sm font-semibold">Hotel Alerts</h3>
              <p className="mt-2 text-xs leading-5 text-white/45">See price drops and newly available rooms at liked hotels.</p>
            </Link>
            <Link href="/favorites" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#e7c78b]/40">
              <Star className="text-[#e7c78b]" size={22}/>
              <h3 className="mt-4 text-sm font-semibold">Liked Hotels</h3>
              <p className="mt-2 text-xs leading-5 text-white/45">Manage the properties you are watching for updates.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto mt-14 max-w-6xl border-t border-white/10 pt-6">
        <p className="text-center text-xs tracking-wider text-white/35">
          © {new Date().getFullYear()} AURASTAYS. EXCEPTIONAL STAYS.
        </p>
      </footer>
    </main>
  );
}