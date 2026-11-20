"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function OwnerSignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Please complete every field.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/owner`,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: fullName,
            account_type: "owner",
          },
        },
      });
      if (signupError) throw signupError;

      if (!data.session) {
        setMessage("Owner account created. Check your email and verify your address. After verification, sign in here to manage your property.");
        return;
      }

      const { data: role, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user?.id ?? "")
        .maybeSingle();
      if (roleError) throw roleError;
      if (!role || role.role !== "owner") {
        throw new Error("Your owner role could not be confirmed. Please contact support before listing a property.");
      }
      router.replace("/owner");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Owner registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-4 py-10">
      <div className="mx-auto grid min-h-[min(760px,calc(100vh-80px))] max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-xl lg:grid-cols-2">
        <section className="relative hidden bg-[#171713] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="text-lg font-semibold tracking-[0.2em]">AURASTAYS</Link>
          <div>
            <Building2 size={34} className="mb-6 text-[#e7c78b]" />
            <p className="text-xs uppercase tracking-[0.25em] text-[#e7c78b]">Partner with us</p>
            <h1 className="mt-4 text-5xl font-light leading-tight">Your property.<br/><span className="font-serif italic text-[#e7c78b]">More possibilities.</span></h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">Create an owner account to list and manage your hotels, rooms and reservations.</p>
          </div>
          <p className="text-xs text-white/45">Secure owner registration · AURASTAYS</p>
        </section>

        <section className="flex items-center px-6 py-10 sm:px-12">
          <div className="mx-auto w-full max-w-md">
            <Link href="/" className="text-xs text-gray-400 hover:text-black">← Back to AURASTAYS</Link>
            <p className="mt-9 text-xs font-semibold uppercase tracking-[0.2em] text-[#a77d3e]">Property partner account</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#1b1b17]">Create owner account</h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">Use a dedicated account for your hotel business. You can add your property after signing in.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-600">FIRST NAME
                  <span className="relative mt-2 block"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input required value={firstName} onChange={e=>setFirstName(e.target.value)} autoComplete="given-name" className="h-12 w-full rounded-xl border border-[#e7e4dc] pl-10 pr-3 text-sm outline-none focus:border-[#b28b4c]" placeholder="First name"/></span>
                </label>
                <label className="text-xs font-semibold text-gray-600">LAST NAME
                  <input required value={lastName} onChange={e=>setLastName(e.target.value)} autoComplete="family-name" className="mt-2 h-12 w-full rounded-xl border border-[#e7e4dc] px-3 text-sm outline-none focus:border-[#b28b4c]" placeholder="Last name"/>
                </label>
              </div>
              <label className="block text-xs font-semibold text-gray-600">BUSINESS EMAIL
                <span className="relative mt-2 block"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="h-12 w-full rounded-xl border border-[#e7e4dc] pl-10 pr-3 text-sm outline-none focus:border-[#b28b4c]" placeholder="you@yourhotel.com"/></span>
              </label>
              <label className="block text-xs font-semibold text-gray-600">PASSWORD
                <span className="relative mt-2 block"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input required type={showPassword?"text":"password"} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" className="h-12 w-full rounded-xl border border-[#e7e4dc] pl-10 pr-12 text-sm outline-none focus:border-[#b28b4c]" placeholder="At least 8 characters"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></span>
              </label>

              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
              {message && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">{message}</p>}

              <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1b1b17] text-sm font-semibold text-white transition hover:bg-[#343329] disabled:opacity-60">
                {loading ? "Creating account..." : "Create owner account"} <ArrowRight size={17}/>
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-gray-500">Already a property partner? <Link href="/owner/login" className="font-semibold text-[#a77d3e] hover:underline">Owner login</Link></p>
            <p className="mt-3 text-center text-xs text-gray-400">Looking to book a stay? <Link href="/signup" className="underline">Create a guest account</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
