import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", requestUrl.origin)
    );
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },

          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Cookies may not be writable in some contexts.
            }
          },
        },
      }
    );

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error.message);

      return NextResponse.redirect(
        new URL(
          "/login?error=verification_failed",
          requestUrl.origin
        )
      );
    }

    const safeNext = next.startsWith("/") ? next : "/";

    return NextResponse.redirect(
      new URL(safeNext, requestUrl.origin)
    );
  } catch (error) {
    console.error("Unexpected auth callback error:", error);

    return NextResponse.redirect(
      new URL(
        "/login?error=unexpected_error",
        requestUrl.origin
      )
    );
  }
}