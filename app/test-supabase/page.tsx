"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestSupabasePage() {
  const [status, setStatus] = useState("Testing Supabase...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase
        .from("hotels")
        .select("id")
        .limit(1);

      if (error) {
        console.error("Supabase error:", error);
        setStatus(`❌ Supabase Error: ${error.message}`);
      } else {
        setStatus("✅ Supabase connected successfully!");
      }
    }

    testConnection();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">
          AURASTAYS Supabase Test
        </h1>

        <p className="text-lg">{status}</p>
      </div>
    </main>
  );
}