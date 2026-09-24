
"use client";

import {
  CalendarDays,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox() {
  const router = useRouter();

  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [error, setError] = useState("");

  const handleSearch = () => {
    setError("");

    // Validate check-in and check-out dates
    if (checkIn && checkOut && checkOut < checkIn) {
      setError("Check-out date must be after check-in date.");
      return;
    }

    // Create search parameters
    const params = new URLSearchParams();

    if (location.trim()) {
      params.set("location", location.trim());
    }

    if (checkIn) {
      params.set("checkIn", checkIn);
    }

    if (checkOut) {
      params.set("checkOut", checkOut);
    }

    params.set("guests", guests);

    // Navigate to search page
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full">
      <div className="w-full rounded-[2rem] border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]">

          {/* LOCATION */}
          <div className="rounded-2xl px-4 py-3 transition hover:bg-neutral-100">
            <label
              htmlFor="location"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500"
            >
              <MapPin size={14} />
              Location
            </label>

            <input
              id="location"
              type="text"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Where are you going?"
              className="mt-1 w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
            />
          </div>

          {/* CHECK-IN */}
          <div className="rounded-2xl px-4 py-3 transition hover:bg-neutral-100">
            <label
              htmlFor="checkIn"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500"
            >
              <CalendarDays size={14} />
              Check-in
            </label>

            <input
              id="checkIn"
              type="date"
              value={checkIn}
              min={new Date().toISOString().split("T")[0]}
              onChange={(event) => {
                setCheckIn(event.target.value);
                setError("");
              }}
              className="mt-1 w-full cursor-pointer bg-transparent text-sm text-neutral-900 outline-none"
            />
          </div>

          {/* CHECK-OUT */}
          <div className="rounded-2xl px-4 py-3 transition hover:bg-neutral-100">
            <label
              htmlFor="checkOut"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500"
            >
              <CalendarDays size={14} />
              Check-out
            </label>

            <input
              id="checkOut"
              type="date"
              value={checkOut}
              min={checkIn || new Date().toISOString().split("T")[0]}
              onChange={(event) => {
                setCheckOut(event.target.value);
                setError("");
              }}
              className="mt-1 w-full cursor-pointer bg-transparent text-sm text-neutral-900 outline-none"
            />
          </div>

          {/* GUESTS */}
          <div className="rounded-2xl px-4 py-3 transition hover:bg-neutral-100">
            <label
              htmlFor="guests"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500"
            >
              <Users size={14} />
              Guests
            </label>

            <select
              id="guests"
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
              className="mt-1 w-full cursor-pointer bg-transparent text-sm text-neutral-900 outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((number) => (
                <option key={number} value={number}>
                  {number} {number === 1 ? "Guest" : "Guests"}
                </option>
              ))}
            </select>
          </div>

          {/* SEARCH BUTTON */}
          <button
            type="button"
            onClick={handleSearch}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-7 text-sm font-semibold text-white transition hover:bg-neutral-700 active:scale-[0.98]"
          >
            <Search size={18} />
            Search
          </button>
        </div>

        {/* VALIDATION ERROR */}
        {error && (
          <p className="px-4 pt-3 text-center text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}