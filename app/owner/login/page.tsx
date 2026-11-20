"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (loginError) throw loginError;
      if (!data.user) throw new Error("We could not verify this account.");

      const { data: role, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (roleError) throw roleError;
      if (!role || !["owner", "admin"].includes(role.role)) {
        await supabase.auth.signOut();
        throw new Error("This is not a property owner account. Please use guest login or create an owner account.");
      }
      router.replace("/owner");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Owner login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-4 py-10">
      <div className="mx-auto grid min-h-[min(720px,calc(100vh-80px))] max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-xl lg:grid-cols-2">
        <section className="relative hidden bg-[#171713] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="text-lg font-semibold tracking-[0.2em]">AURASTAYS</Link>
          <div>
            <Building2 size={34} className="mb-6 text-[#e7c78b]"/>
            <p className="text-xs uppercase tracking-[0.25em] text-[#e7c78b]">Owner portal</p>
            <h1 className="mt-4 text-5xl font-light leading-tight">Welcome<br/><span className="font-serif italic text-[#e7c78b]">back.</span></h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">Manage your properties, room inventory, reservations and guest reviews from one place.</p>
          </div>
          <p className="text-xs text-white/45">Secure owner access · AURASTAYS</p>
        </section>
        <section className="flex items-center px-6 py-10 sm:px-12">
          <div className="mx-auto w-full max-w-md">
            <Link href="/" className="text-xs text-gray-400 hover:text-black">← Back to AURASTAYS</Link>
            <p className="mt-9 text-xs font-semibold uppercase tracking-[0.2em] text-[#a77d3e]">Property partner access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#1b1b17]">Owner login</h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">Sign in with the email and password linked to your owner account.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block text-xs font-semibold text-gray-600">EMAIL ADDRESS
                <span className="relative mt-2 block"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="h-12 w-full rounded-xl border border-[#e7e4dc] pl-10 pr-3 text-sm outline-none focus:border-[#b28b4c]" placeholder="you@yourhotel.com"/></span>
              </label>
              <label className="block text-xs font-semibold text-gray-600">PASSWORD
                <span className="relative mt-2 block"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input required type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" className="h-12 w-full rounded-xl border border-[#e7e4dc] pl-10 pr-12 text-sm outline-none focus:border-[#b28b4c]" placeholder="Enter your password"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></span>
              </label>
              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
              <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1b1b17] text-sm font-semibold text-white transition hover:bg-[#343329] disabled:opacity-60">{loading?"Signing in...":"Sign in to owner dashboard"} <ArrowRight size={17}/></button>
            </form>
            <p className="mt-7 text-center text-sm text-gray-500">New property partner? <Link href="/owner/signup" className="font-semibold text-[#a77d3e] hover:underline">Create owner account</Link></p>
            <p className="mt-3 text-center text-xs text-gray-400">Booking a stay? <Link href="/login" className="underline">Guest login</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
