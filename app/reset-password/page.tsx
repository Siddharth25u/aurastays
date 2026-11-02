"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    let active = true;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session && (event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (data.session) setReady(true);
      else if (sessionError) setError("This reset link is invalid or has expired. Request a new link to continue.");
      setChecking(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (!ready) {
      setError("This reset link is invalid or has expired. Request a new link to continue.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setUpdated(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f1eb] p-4">
      <section className="w-full max-w-md rounded-[28px] bg-white px-7 py-9 shadow-[0_20px_80px_rgba(30,25,15,0.12)] sm:px-10">
        <Link href="/login" className="mb-9 inline-flex items-center gap-2 text-xs text-gray-500 transition hover:text-[#1b1b17]">
          <ArrowLeft size={15} /> Back to login
        </Link>

        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-full bg-[#1b1b17]">
          <Sparkles size={19} className="text-[#e7c78b]" />
        </div>

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a763e]">Account recovery</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#1b1b17]">
          Create a new <span className="font-serif font-normal italic text-[#b28b4c]">password.</span>
        </h1>
        <p className="mt-4 text-sm leading-6 text-gray-500">
          Choose a new password for your AURASTAYS account.
        </p>

        {checking ? (
          <p className="mt-8 text-sm text-gray-500">Verifying your reset link...</p>
        ) : updated ? (
          <div className="mt-8 space-y-5">
            <div role="status" className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs leading-5 text-green-700">
              Your password has been updated successfully. You can now sign in with your new password.
            </div>
            <Link href="/login" className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#1b1b17] text-sm font-semibold text-white transition hover:bg-[#302f27]">
              Go to login
            </Link>
          </div>
        ) : !ready ? (
          <div className="mt-8 space-y-4">
            <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
              {error || "This reset link is invalid or has expired. Request a new link to continue."}
            </p>
            <Link href="/forgot-password" className="inline-flex text-sm font-semibold text-[#a77d3e] hover:underline">
              Request another reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="password" className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#5c5a52]">New Password</label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="h-14 w-full rounded-2xl border border-[#e7e4dc] bg-[#fcfbf8] pl-12 pr-4 text-sm text-[#1b1b17] outline-none transition placeholder:text-gray-400 focus:border-[#b28b4c] focus:bg-white focus:ring-4 focus:ring-[#b28b4c]/10" />
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#5c5a52]">Confirm New Password</label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="confirmPassword" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your new password again" className="h-14 w-full rounded-2xl border border-[#e7e4dc] bg-[#fcfbf8] pl-12 pr-4 text-sm text-[#1b1b17] outline-none transition placeholder:text-gray-400 focus:border-[#b28b4c] focus:bg-white focus:ring-4 focus:ring-[#b28b4c]/10" />
              </div>
            </div>

            {error && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#1b1b17] text-sm font-semibold text-white transition hover:bg-[#302f27] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.13em] text-gray-400">
          Secure authentication powered by Supabase
        </p>
      </section>
    </main>
  );
}
