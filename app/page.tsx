import Link from "next/link";
import {
  ArrowRight,
  Award,
  BedDouble,
  ConciergeBell,
  ShieldCheck,
  Sparkles,
  Utensils,
  Waves,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import SearchBox from "@/components/SearchBox";
import HotelCard from "@/components/HotelCard";
import { hotels } from "@/data/hotels";

const destinations = [
  {
    name: "Dehradun",
    subtitle: "Mountain escapes",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Goa",
    subtitle: "Coastal luxury",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Jaipur",
    subtitle: "Royal heritage",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Manali",
    subtitle: "Alpine retreats",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85",
  },
];

const experiences = [
  {
    icon: Waves,
    title: "Unwind",
    text: "Private pools, serene spas and peaceful spaces designed for slow living.",
  },
  {
    icon: Utensils,
    title: "Dine",
    text: "Discover memorable dining experiences crafted around local flavours.",
  },
  {
    icon: ConciergeBell,
    title: "Indulge",
    text: "Thoughtful service and curated experiences throughout your stay.",
  },
];

export default function Home() {
  return (
    <main className="bg-[#f7f5f0] text-neutral-900">

      {/* HERO */}
      <section className="relative min-h-[760px] overflow-hidden lg:min-h-[850px]">
        <img
          src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=90"
          alt="Luxury hotel interior"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/15 to-black/65" />

        <Navbar />

        <div className="relative mx-auto flex min-h-[760px] max-w-7xl flex-col justify-center px-5 pb-20 pt-32 sm:px-8 lg:min-h-[850px] lg:px-10">
          <div className="max-w-3xl text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] backdrop-blur-md">
              <Sparkles size={14} />
              Exceptional stays, thoughtfully selected
            </div>

            <h1 className="text-5xl font-medium leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
              Find Your
              <span className="block font-serif italic font-normal">
                Perfect Stay.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Discover extraordinary hotels, beautiful spaces and memorable
              experiences with AURASTAYS.
            </p>
          </div>

          <div className="mt-12 w-full">
            <SearchBox />
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section id="explore" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
              Explore
            </p>

            <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
              Places worth discovering
            </h2>
          </div>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm font-semibold"
          >
            Explore all stays
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {destinations.map((destination) => (
            <Link
              href={`/search?location=${encodeURIComponent(destination.name)}`}
              key={destination.name}
              className="group relative aspect-[4/5] overflow-hidden rounded-3xl"
            >
              <img
                src={destination.image}
                alt={destination.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              <div className="absolute bottom-0 left-0 p-5 text-white sm:p-6">
                <p className="text-xs uppercase tracking-wider text-white/70">
                  {destination.subtitle}
                </p>
                <h3 className="mt-1 text-xl font-medium sm:text-2xl">
                  {destination.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED STAYS */}
      <section className="bg-white py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
                Featured stays
              </p>

              <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
                Stay somewhere unforgettable
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base">
                Handpicked properties combining exceptional design, comfort and
                hospitality.
              </p>
            </div>

            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-sm font-semibold"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </div>
      </section>

      {/* WHY AURASTAYS */}
      <section className="bg-[#f7f5f0] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
              Why AURASTAYS
            </p>

            <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
              More than a booking.
              <span className="block font-serif italic font-normal">
                It is the experience.
              </span>
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-7 sm:p-8">
              <ShieldCheck size={28} strokeWidth={1.5} />
              <h3 className="mt-7 text-xl font-semibold">
                Trusted stays
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-500">
                Discover thoughtfully selected properties with transparent
                information and reliable booking experiences.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 sm:p-8">
              <Award size={28} strokeWidth={1.5} />
              <h3 className="mt-7 text-xl font-semibold">
                Curated quality
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-500">
                From boutique hideaways to grand resorts, explore stays chosen
                for comfort, character and atmosphere.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 sm:p-8">
              <BedDouble size={28} strokeWidth={1.5} />
              <h3 className="mt-7 text-xl font-semibold">
                Made for you
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-500">
                Search by destination, dates and guests to find a stay that
                fits the way you travel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EXPERIENCES */}
      <section id="experiences" className="bg-[#171717] py-20 text-white sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                Experiences
              </p>

              <h2 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
                Travel beautifully.
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
                Every destination has a different rhythm. AURASTAYS helps you
                discover the places and experiences that make yours memorable.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {experiences.map((experience) => {
                const Icon = experience.icon;

                return (
                  <div
                    key={experience.title}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.08]"
                  >
                    <Icon size={24} strokeWidth={1.5} />

                    <h3 className="mt-8 text-lg font-semibold">
                      {experience.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-white/50">
                      {experience.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#d7c6a5]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-700/70">
              Your next escape
            </p>

            <h2 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
              Somewhere beautiful
              <span className="block font-serif italic font-normal">
                is waiting for you.
              </span>
            </h2>

            <Link
              href="/search"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              Discover stays
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111111] text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="text-xl font-semibold tracking-[0.22em]">
                AURASTAYS
              </div>

              <p className="mt-4 max-w-sm text-sm leading-6 text-white/45">
                Exceptional stays, thoughtful experiences and places worth
                remembering.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Explore</h3>

              <div className="mt-4 flex flex-col gap-3 text-sm text-white/50">
                <Link href="/search" className="hover:text-white">
                  Stays
                </Link>
                <Link href="/#experiences" className="hover:text-white">
                  Experiences
                </Link>
                <Link href="/search" className="hover:text-white">
                  Destinations
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">AURASTAYS</h3>

              <div className="mt-4 flex flex-col gap-3 text-sm text-white/50">
                <span>About</span>
                <span>Contact</span>
                <span>Privacy</span>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/35">
            © {new Date().getFullYear()} AURASTAYS. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}