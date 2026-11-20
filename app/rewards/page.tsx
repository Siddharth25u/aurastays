"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Award, Sparkles, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Reward = { id: string; booking_id: string; points: number; amount_basis: number; created_at: string };

export default function AuraRewardsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data, error } = await supabase.from("aura_reward_ledger")
        .select("id,booking_id,points,amount_basis,created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      if (!active) return;
      if (error) setError(error.message);
      else setRows((data ?? []) as Reward[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [router]);

  const total = rows.reduce((sum, row) => sum + Number(row.points || 0), 0);
  return <main className="min-h-screen bg-[#11110e] px-5 py-10 text-white sm:px-8">
    <div className="mx-auto max-w-4xl">
      <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Back to profile</Link>
      <div className="mt-12 rounded-3xl border border-[#e7c78b]/20 bg-gradient-to-br from-[#292319] to-[#171713] p-8 sm:p-12">
        <div className="flex items-center gap-3 text-[#e7c78b]"><Sparkles size={20}/><span className="text-xs uppercase tracking-[.28em]">AURASTAYS MEMBERSHIP</span></div>
        <h1 className="mt-5 text-4xl font-semibold">Aura Rewards</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">Earn 1 point for every ₹100 of an eligible completed and paid stay. Points are added automatically after your stay is completed.</p>
        <div className="mt-8 flex items-end gap-3"><Award size={36} className="mb-1 text-[#e7c78b]"/><span className="text-6xl font-semibold tabular-nums">{loading ? "—" : total.toLocaleString("en-IN")}</span><span className="pb-2 text-sm text-white/55">points earned</span></div>
      </div>
      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:p-8">
        <div className="flex items-center gap-3"><History className="text-[#e7c78b]"/><h2 className="text-xl font-semibold">Rewards history</h2></div>
        {loading ? <p className="mt-6 text-sm text-white/50">Loading rewards…</p> : error ? <p className="mt-6 text-sm text-red-300">{error}</p> : rows.length === 0 ? <p className="mt-6 text-sm text-white/50">No points yet. Complete an eligible paid stay to start earning Aura Rewards.</p> : <div className="mt-6 divide-y divide-white/10">{rows.map(row=><div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="text-sm font-medium">Completed stay</p><p className="mt-1 text-xs text-white/45">{new Date(row.created_at).toLocaleDateString("en-IN")} · Booking {row.booking_id.slice(0,8).toUpperCase()}</p></div><div className="text-right"><p className="font-semibold text-[#e7c78b]">+{row.points} points</p><p className="text-xs text-white/40">₹{Number(row.amount_basis).toLocaleString("en-IN")} eligible spend</p></div></div>)}</div>}
      </section>
    </div>
  </main>;
}