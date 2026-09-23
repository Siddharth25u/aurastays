"use client";

import { CalendarDays, MapPin, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox() {
  const router = useRouter();

  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const handleSearch = () => {
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

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full rounded-[2rem] border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]">

        {/* Location */}
        <div className="rounded-2xl px-4 py-3 transition hover:bg-neutral-100">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <MapPin size={14} />
            Location
          </label>

          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Where are you going?"
            className="mt-1 w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
        </div>

        {/* Check In */}
        <div className="rounded-2xl px-4 py-3 transition hover:bg-neutral-100">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <CalendarDays size={14} />
            Check-in
          </label>

          <input
            type="date"
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
            className="mt-1 w-full bg-transparent text-sm text-neutral-900 outline-none"
          />
        </div>

        {/* Check Out */}
        <div className="rounded-2xl px-4 py-3 transition hover:bg-neutral-100">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <CalendarDays size={14} />
            Check-out
          </label>

          <input
            type="date"
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            className="mt-1 w-full bg-transparent text-sm text-neutral-900 outline-none"
          />
        </div>

        {/* Guests */}
        <div className="rounded-2xl px-4 py-3 transition hover:bg-neutral-100">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <Users size={14} />
            Guests
          </label>

          <select
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            className="mt-1 w-full bg-transparent text-sm text-neutral-900 outline-none"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((number) => (
              <option key={number} value={number}>
                {number} {number === 1 ? "Guest" : "Guests"}
              </option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <button
          type="button"
          onClick={handleSearch}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-7 text-sm font-semibold text-white transition hover:bg-neutral-700"
        >
          <Search size={18} />
          Search
        </button>
      </div>
    </div>
  );
}