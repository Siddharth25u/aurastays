"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck, Tag, CalendarCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Alert = { id: string; hotel_id: string; room_id: string | null; hotel: { slug: string } | { slug: string }[] | null; alert_type: "price_drop" | "availability"; title: string; message: string; read_at: string | null; created_at: string };

export default function HotelAlertsPage() {
 const router=useRouter();
 const [rows,setRows]=useState<Alert[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const load=useCallback(async()=>{
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return;}
  const {data,error}=await supabase.from("hotel_watch_alerts").select("id,hotel_id,room_id,hotel:hotels(slug),alert_type,title,message,read_at,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100);
  if(error)setError(error.message);else setRows((data??[]) as Alert[]);
  setLoading(false);
 },[router]);
 useEffect(()=>{void load();},[load]);
 const markRead=async(id:string)=>{
  const {error}=await supabase.from("hotel_watch_alerts").update({read_at:new Date().toISOString()}).eq("id",id);
  if(error){setError(error.message);return;}
  setRows(old=>old.map(row=>row.id===id?{...row,read_at:new Date().toISOString()}:row));
 };
 const unread=rows.filter(row=>!row.read_at).length;
 return <main className="min-h-screen bg-[#11110e] px-5 py-10 text-white sm:px-8"><div className="mx-auto max-w-4xl">
  <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Back to profile</Link>
  <div className="mt-12 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[.28em] text-[#e7c78b]">Your saved stays</p><h1 className="mt-3 text-4xl font-semibold">Hotel alerts</h1><p className="mt-3 text-sm text-white/50">Price drops and room availability changes at hotels you have liked.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.04] px-5 py-3"><p className="text-2xl font-semibold">{unread}</p><p className="text-xs text-white/45">Unread alerts</p></div></div>
  <section className="mt-8 rounded-3xl border border-white/10 bg-white/[.04] p-6 sm:p-8">
   {loading?<p className="text-sm text-white/50">Loading alerts…</p>:error?<p className="text-sm text-red-300">{error}</p>:rows.length===0?<div className="py-12 text-center"><Bell size={34} className="mx-auto text-[#e7c78b]"/><h2 className="mt-4 text-lg font-medium">No alerts yet</h2><p className="mx-auto mt-2 max-w-md text-sm text-white/45">Like a hotel to watch it. You will see an alert here when a room price drops or becomes available.</p><Link href="/search" className="mt-6 inline-flex rounded-full bg-[#e7c78b] px-5 py-3 text-sm font-semibold text-black">Explore hotels</Link></div>:<div className="divide-y divide-white/10">{rows.map(row=><article key={row.id} className="flex gap-4 py-5"><div className="mt-1 rounded-xl bg-[#e7c78b]/10 p-3 text-[#e7c78b]">{row.alert_type==="price_drop"?<Tag size={19}/>:<CalendarCheck size={19}/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-medium">{row.title}</h2>{!row.read_at&&<span className="rounded-full bg-[#e7c78b]/15 px-2 py-1 text-[10px] text-[#e7c78b]">NEW</span>}</div><p className="mt-1 text-sm leading-6 text-white/55">{row.message}</p><p className="mt-2 text-xs text-white/35">{new Date(row.created_at).toLocaleString("en-IN")}</p><div className="mt-3 flex flex-wrap gap-4 text-xs"><Link href={`/hotel/${(Array.isArray(row.hotel) ? row.hotel[0]?.slug : row.hotel?.slug) ?? ""}`} className="text-[#e7c78b] hover:underline">View hotel</Link>{!row.read_at&&<button onClick={()=>void markRead(row.id)} className="inline-flex items-center gap-1 text-white/50 hover:text-white"><CheckCheck size={13}/> Mark as read</button>}</div></div></article>)}</div>}
  </section>
 </div></main>;
}