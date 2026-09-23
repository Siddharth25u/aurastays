"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Filter,
  MapPin,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import HotelCard from "@/components/HotelCard";
import { hotels } from "@/data/hotels";

function SearchResultsContent() {
  const searchParams = useSearchParams();

  const searchLocation = searchParams.get("location") || "Anywhere";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "2";

  const [maxPrice, setMaxPrice] = useState(12000);
  const [minRating, setMinRating] = useState(0);
  const [hotelType, setHotelType] = useState("All");
  const [selectedLocation, setSelectedLocation] =
    useState(searchLocation);
  const [selectedAmenities, setSelectedAmenities] =
    useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recommended");
  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  /* -----------------------------
     FILTER OPTIONS
  ----------------------------- */

  const locations = [
    "Anywhere",
    ...Array.from(
      new Set(hotels.map((hotel) => hotel.location))
    ),
  ];

  const hotelTypes = [
    "All",
    ...Array.from(
      new Set(hotels.map((hotel) => hotel.type))
    ),
  ];

  const amenities = Array.from(
    new Set(
      hotels.flatMap((hotel) => hotel.amenities)
    )
  );

  /* -----------------------------
     FILTER LOGIC
  ----------------------------- */

  const filteredHotels = useMemo(() => {
    let result = hotels.filter((hotel) => {
      const matchesLocation =
        selectedLocation === "Anywhere" ||
        hotel.location === selectedLocation;

      const matchesPrice =
        hotel.price <= maxPrice;

      const matchesRating =
        hotel.rating >= minRating;

      const matchesType =
        hotelType === "All" ||
        hotel.type === hotelType;

      const matchesAmenities =
        selectedAmenities.length === 0 ||
        selectedAmenities.every((amenity) =>
          hotel.amenities.includes(amenity)
        );

      return (
        matchesLocation &&
        matchesPrice &&
        matchesRating &&
        matchesType &&
        matchesAmenities
      );
    });

    if (sortBy === "rating") {
      result = [...result].sort(
        (a, b) => b.rating - a.rating
      );
    }

    if (sortBy === "low") {
      result = [...result].sort(
        (a, b) => a.price - b.price
      );
    }

    if (sortBy === "high") {
      result = [...result].sort(
        (a, b) => b.price - a.price
      );
    }

    return result;
  }, [
    selectedLocation,
    maxPrice,
    minRating,
    hotelType,
    selectedAmenities,
    sortBy,
  ]);

  /* -----------------------------
     HELPERS
  ----------------------------- */

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity]
    );
  };

  const clearFilters = () => {
    setMaxPrice(12000);
    setMinRating(0);
    setHotelType("All");
    setSelectedLocation("Anywhere");
    setSelectedAmenities([]);
  };

  const formatDate = (date: string) => {
    if (!date) {
      return "Select date";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* -----------------------------
     PAGE
  ----------------------------- */

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-neutral-900">

      {/* HEADER */}
      <section className="relative overflow-hidden bg-[#171717] pt-28 text-white sm:pt-32">
        <Navbar />

        <div className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            Discover stays
          </p>

          <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
            Stays in{" "}
            <span className="font-serif italic font-normal">
              {selectedLocation}
            </span>
          </h1>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">

            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
              <MapPin size={15} />
              {selectedLocation}
            </div>

            <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2">
              {formatDate(checkIn)} —{" "}
              {formatDate(checkOut)}
            </div>

            <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2">
              {guests}{" "}
              {guests === "1"
                ? "Guest"
                : "Guests"}
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">

        {/* TOP BAR */}
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm text-neutral-500">
              {filteredHotels.length}{" "}
              {filteredHotels.length === 1
                ? "stay"
                : "stays"}{" "}
              found
            </p>
          </div>

          <div className="flex items-center gap-3">

            {/* MOBILE FILTER BUTTON */}
            <button
              type="button"
              onClick={() =>
                setMobileFiltersOpen(true)
              }
              className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium md:hidden"
            >
              <Filter size={16} />
              Filters
            </button>

            {/* CLEAR FILTERS */}
            <button
              type="button"
              onClick={clearFilters}
              className="hidden text-sm font-medium text-neutral-500 hover:text-neutral-900 sm:block"
            >
              Clear filters
            </button>

            {/* SORT */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
                className="appearance-none rounded-full border border-neutral-300 bg-white py-2.5 pl-4 pr-10 text-sm font-medium outline-none"
              >
                <option value="recommended">
                  Recommended
                </option>

                <option value="rating">
                  Top Rated
                </option>

                <option value="low">
                  Price Low → High
                </option>

                <option value="high">
                  Price High → Low
                </option>
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
              />
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">

          {/* DESKTOP FILTERS */}
          <aside className="hidden lg:block">
            <FilterPanel
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              minRating={minRating}
              setMinRating={setMinRating}
              hotelType={hotelType}
              setHotelType={setHotelType}
              selectedLocation={selectedLocation}
              setSelectedLocation={
                setSelectedLocation
              }
              selectedAmenities={
                selectedAmenities
              }
              toggleAmenity={toggleAmenity}
              locations={locations}
              hotelTypes={hotelTypes}
              amenities={amenities}
              clearFilters={clearFilters}
            />
          </aside>

          {/* RESULTS */}
          <div>
            {filteredHotels.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredHotels.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl bg-white px-6 text-center">

                <div className="rounded-full bg-neutral-100 p-4">
                  <SlidersHorizontal size={24} />
                </div>

                <h2 className="mt-5 text-2xl font-semibold">
                  No stays found
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
                  No properties match your current
                  filters. Try changing your location,
                  price range, rating or amenities.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MOBILE FILTER DRAWER */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 lg:hidden">

          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-[2rem] bg-[#f7f5f0] p-6">

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Filters
              </h2>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="rounded-full bg-white p-2"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            <FilterPanel
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              minRating={minRating}
              setMinRating={setMinRating}
              hotelType={hotelType}
              setHotelType={setHotelType}
              selectedLocation={selectedLocation}
              setSelectedLocation={
                setSelectedLocation
              }
              selectedAmenities={
                selectedAmenities
              }
              toggleAmenity={toggleAmenity}
              locations={locations}
              hotelTypes={hotelTypes}
              amenities={amenities}
              clearFilters={clearFilters}
            />

            <button
              type="button"
              onClick={() =>
                setMobileFiltersOpen(false)
              }
              className="mt-6 w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white"
            >
              Show {filteredHotels.length}{" "}
              {filteredHotels.length === 1
                ? "stay"
                : "stays"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ================================================= */
/* FILTER PANEL */
/* ================================================= */

type FilterPanelProps = {
  maxPrice: number;
  setMaxPrice: (value: number) => void;

  minRating: number;
  setMinRating: (value: number) => void;

  hotelType: string;
  setHotelType: (value: string) => void;

  selectedLocation: string;
  setSelectedLocation: (value: string) => void;

  selectedAmenities: string[];
  toggleAmenity: (amenity: string) => void;

  locations: string[];
  hotelTypes: string[];
  amenities: string[];

  clearFilters: () => void;
};

function FilterPanel({
  maxPrice,
  setMaxPrice,
  minRating,
  setMinRating,
  hotelType,
  setHotelType,
  selectedLocation,
  setSelectedLocation,
  selectedAmenities,
  toggleAmenity,
  locations,
  hotelTypes,
  amenities,
  clearFilters,
}: FilterPanelProps) {
  return (
    <div className="rounded-3xl bg-white p-5">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} />

          <h2 className="font-semibold">
            Filters
          </h2>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
        >
          Clear
        </button>
      </div>

      {/* LOCATION */}
      <div className="mt-7">
        <h3 className="text-sm font-semibold">
          Location
        </h3>

        <div className="mt-3 space-y-2">
          {locations.map((location) => (
            <button
              key={location}
              type="button"
              onClick={() =>
                setSelectedLocation(location)
              }
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                selectedLocation === location
                  ? "bg-neutral-900 text-white"
                  : "hover:bg-neutral-100"
              }`}
            >
              {location}
            </button>
          ))}
        </div>
      </div>

      {/* PRICE */}
      <div className="mt-8">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Price per night
          </h3>

          <span className="text-xs text-neutral-500">
            ₹{maxPrice.toLocaleString("en-IN")}
          </span>
        </div>

        <input
          type="range"
          min="3000"
          max="12000"
          step="500"
          value={maxPrice}
          onChange={(event) =>
            setMaxPrice(
              Number(event.target.value)
            )
          }
          className="mt-4 w-full accent-neutral-900"
        />

        <div className="mt-1 flex justify-between text-xs text-neutral-400">
          <span>₹3,000</span>
          <span>₹12,000+</span>
        </div>
      </div>

      {/* RATING */}
      <div className="mt-8">

        <h3 className="text-sm font-semibold">
          Rating
        </h3>

        <div className="mt-3 space-y-2">
          {[0, 4.5, 4.7, 4.8, 4.9].map(
            (rating) => (
              <button
                key={rating}
                type="button"
                onClick={() =>
                  setMinRating(rating)
                }
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                  minRating === rating
                    ? "bg-neutral-900 text-white"
                    : "hover:bg-neutral-100"
                }`}
              >
                {rating === 0 ? (
                  "All ratings"
                ) : (
                  <>
                    <Star
                      size={14}
                      className="fill-current"
                    />
                    {rating}+
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>

      {/* HOTEL TYPE */}
      <div className="mt-8">

        <h3 className="text-sm font-semibold">
          Hotel type
        </h3>

        <div className="mt-3 space-y-2">
          {hotelTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                setHotelType(type)
              }
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                hotelType === type
                  ? "bg-neutral-900 text-white"
                  : "hover:bg-neutral-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* AMENITIES */}
      <div className="mt-8">

        <h3 className="text-sm font-semibold">
          Amenities
        </h3>

        <div className="mt-3 space-y-2">
          {amenities.map((amenity) => {
            const selected =
              selectedAmenities.includes(
                amenity
              );

            return (
              <button
                key={amenity}
                type="button"
                onClick={() =>
                  toggleAmenity(amenity)
                }
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                  selected
                    ? "bg-neutral-900 text-white"
                    : "hover:bg-neutral-100"
                }`}
              >
                <span>{amenity}</span>

                {selected && (
                  <span className="text-xs">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* PAGE EXPORT */
/* ================================================= */

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
          <div className="text-sm text-neutral-500">
            Loading stays...
          </div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}