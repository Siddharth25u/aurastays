
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  UserRound,
  LogOut,
  ChevronDown,
  Sparkles,
  CalendarCheck,
  Heart,
  Building2,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email ?? null);
      setUserId(user?.id ?? null);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email ?? null);
        setUserId(session?.user?.id ?? null);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadRole() {
      if (!userId) {
        setUserRole(null);
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (active) setUserRole(error ? null : data?.role ?? null);
    }
    loadRole();
    return () => { active = false; };
  }, [userId]);

  const isPropertyOwner = userRole === "owner" || userRole === "admin";

  const handleLogout = async () => {
    setLoggingOut(true);

    await supabase.auth.signOut();

    setUserEmail(null);
    setProfileOpen(false);
    setIsOpen(false);
    setLoggingOut(false);
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  const closeProfileMenu = () => {
    setProfileOpen(false);
  };

  return (
    <header className="absolute left-0 right-0 top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        {/* LOGO */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="group flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition group-hover:bg-white/20">
            <Sparkles
              size={15}
              className="text-[#e7c78b]"
            />
          </div>

          <div>
            <p className="text-lg font-semibold tracking-[0.18em] text-white sm:text-xl">
              AURASTAYS
            </p>

            <p className="hidden text-[8px] tracking-[0.28em] text-white/55 sm:block">
              EXCEPTIONAL STAYS
            </p>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden items-center gap-6 md:flex lg:gap-8">
          <Link
            href="/#explore"
            className="relative text-sm text-white/80 transition hover:text-white"
          >
            Explore
          </Link>

          <Link
            href="/search"
            className="text-sm text-white/80 transition hover:text-white"
          >
            Stays
          </Link>

          <Link
            href="/aura-match"
            className="flex items-center gap-1.5 text-sm text-[#e7c78b] transition hover:text-white"
          >
            <Sparkles size={14} />
            Aura Match
          </Link>

          <Link
            href="/#experiences"
            className="text-sm text-white/80 transition hover:text-white"
          >
            Experiences
          </Link>

          <Link
            href="/favorites"
            className="flex items-center gap-1.5 text-sm text-white/80 transition hover:text-white"
          >
            <Heart size={15} />
            Liked Hotels
          </Link>
        </div>

        {/* DESKTOP AUTH */}
        <div className="relative hidden items-center gap-3 md:flex">
          {!isPropertyOwner && (
            <Link href="/owner/signup" className="hidden rounded-full border border-white/35 px-4 py-2.5 text-xs font-medium text-white/90 transition hover:bg-white hover:text-black lg:inline-flex">
              <Building2 size={14} className="mr-2"/> List your property
            </Link>
          )}
          {userEmail ? (
            <>
              <button
                type="button"
                onClick={() =>
                  setProfileOpen((value) => !value)
                }
                className="flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-md transition hover:bg-white/20"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e7c78b] text-xs font-bold text-black">
                  {userEmail.charAt(0).toUpperCase()}
                </span>

                <span className="max-w-[130px] truncate text-xs text-white">
                  {userEmail}
                </span>

                <ChevronDown
                  size={14}
                  className={`text-white transition ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-14 w-60 rounded-2xl border border-white/15 bg-[#171713]/95 p-3 shadow-2xl backdrop-blur-xl">
                  <div className="mb-2 border-b border-white/10 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                      Signed in as
                    </p>

                    <p className="mt-1 truncate text-xs text-white/90">
                      {userEmail}
                    </p>
                  </div>

                  {isPropertyOwner && (
                    <Link href="/owner" onClick={closeProfileMenu} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#e7c78b] transition hover:bg-white/10">
                      <LayoutDashboard size={16}/> Owner Dashboard
                    </Link>
                  )}

                  {/* MY PROFILE */}
                  <Link
                    href="/profile"
                    onClick={closeProfileMenu}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <UserRound size={16} />
                    My Profile
                  </Link>

                  {/* MY BOOKINGS */}
                  <Link
                    href="/bookings"
                    onClick={closeProfileMenu}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <CalendarCheck size={16} />
                    My Bookings
                  </Link>

                  {/* LIKED HOTELS */}
                  <Link
                    href="/favorites"
                    onClick={closeProfileMenu}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <Heart size={16} />
                    Liked Hotels
                  </Link>

                  {/* LOGOUT */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                  >
                    <LogOut size={16} />

                    {loggingOut
                      ? "Logging out..."
                      : "Logout"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/35 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:border-white hover:bg-white hover:text-black"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e7c78b]"
              >
                Join Now
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={
            isOpen ? "Close menu" : "Open menu"
          }
          aria-expanded={isOpen}
          className="rounded-full border border-white/30 bg-white/5 p-2.5 text-white backdrop-blur-md transition hover:bg-white/15 md:hidden"
        >
          {isOpen ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div
        className={`mx-4 overflow-hidden rounded-3xl border border-white/15 bg-[#171713]/95 shadow-2xl backdrop-blur-xl transition-all duration-300 md:hidden ${
          isOpen
            ? "max-h-[700px] translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 p-4">
          {/* MOBILE NAVIGATION */}
          <Link
            href="/#explore"
            onClick={closeMobileMenu}
            className="rounded-xl px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
          >
            Explore
          </Link>

          <Link
            href="/search"
            onClick={closeMobileMenu}
            className="rounded-xl px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
          >
            Stays
          </Link>

          <Link
            href="/aura-match"
            onClick={closeMobileMenu}
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-[#e7c78b] transition hover:bg-white/10"
          >
            <Sparkles size={16} />
            Aura Match
          </Link>

          <Link
            href="/#experiences"
            onClick={closeMobileMenu}
            className="rounded-xl px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
          >
            Experiences
          </Link>

          <Link
            href="/favorites"
            onClick={closeMobileMenu}
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
          >
            <Heart size={16} />
            Liked Hotels
          </Link>

          {!isPropertyOwner && (
            <Link href="/owner/signup" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#e7c78b] transition hover:bg-white/10">
              <Building2 size={16}/> List your property
            </Link>
          )}

          <div className="my-2 h-px bg-white/10" />

          {/* MOBILE AUTH */}
          {userEmail ? (
            <>
              {/* USER INFORMATION */}
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7c78b] text-sm font-bold text-black">
                  {userEmail.charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-white/45">
                    Signed in
                  </p>

                  <p className="truncate text-xs text-white/90">
                    {userEmail}
                  </p>
                </div>
              </div>

              {isPropertyOwner && (
                <Link href="/owner" onClick={closeMobileMenu} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#e7c78b] transition hover:bg-white/10">
                  <LayoutDashboard size={17}/> Owner Dashboard
                </Link>
              )}

              {/* MOBILE PROFILE */}
              <Link
                href="/profile"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
              >
                <UserRound size={17} />
                My Profile
              </Link>

              {/* MOBILE BOOKINGS */}
              <Link
                href="/bookings"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
              >
                <CalendarCheck size={17} />
                My Bookings
              </Link>

              {/* MOBILE LIKED HOTELS */}
              <Link
                href="/favorites"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
              >
                <Heart size={17} />
                Liked Hotels
              </Link>

              {/* MOBILE LOGOUT */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
              >
                <LogOut size={17} />

                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </button>
            </>
          ) : (
            <>
              {/* MOBILE LOGIN */}
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="rounded-xl border border-white/25 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-white/10"
              >
                Login
              </Link>

              {/* MOBILE SIGNUP */}
              <Link
                href="/signup"
                onClick={closeMobileMenu}
                className="mt-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black transition hover:bg-[#e7c78b]"
              >
                Join Now
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}