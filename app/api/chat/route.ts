
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GeminiMessage = {
  role: "user" | "model";
  parts: {
    text: string;
  }[];
};

type RequestBody = {
  messages?: ChatMessage[];
};

/**
 * Primary model + fallback models.
 *
 * If one model is temporarily unavailable,
 * the next model will be tried automatically.
 */
const MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

const MAX_RETRIES_PER_MODEL = 1;
const RETRY_DELAY_MS = 1500;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function getStatusCode(error: unknown): number | null {
  const message = getErrorMessage(error);

  const statusMatch = message.match(
    /\b(400|401|403|404|409|429|500|502|503|504)\b/
  );

  return statusMatch ? Number(statusMatch[1]) : null;
}

function isRetryableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  const statusCode = getStatusCode(error);

  return (
    statusCode === 429 ||
    statusCode === 500 ||
    statusCode === 502 ||
    statusCode === 503 ||
    statusCode === 504 ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("temporarily")
  );
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function createErrorResponse(
  message: string,
  status: number
): Response {
  return Response.json(
    {
      error: message,
    },
    {
      status,
    }
  );
}

export async function GET() {
  return Response.json({
    ok: true,
    message: "AuraStays Gemini API route is working.",
    models: MODELS,
  });
}

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // 1. CHECK API KEY
    // --------------------------------------------------

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");

      return createErrorResponse(
        "Gemini API key is missing. Check .env.local.",
        500
      );
    }

    // --------------------------------------------------
    // 2. READ REQUEST BODY
    // --------------------------------------------------

    let body: RequestBody;

    try {
      body = (await request.json()) as RequestBody;
    } catch {
      return createErrorResponse(
        "Invalid JSON request.",
        400
      );
    }

    if (!Array.isArray(body.messages)) {
      return createErrorResponse(
        "messages must be an array.",
        400
      );
    }

    // --------------------------------------------------
    // 3. VALIDATE MESSAGES
    // --------------------------------------------------

    const validMessages: ChatMessage[] = body.messages
      .filter(
        (message): message is ChatMessage =>
          (message?.role === "user" ||
            message?.role === "assistant") &&
          typeof message?.content === "string" &&
          message.content.trim().length > 0
      )
      .slice(-20);

    if (validMessages.length === 0) {
      return createErrorResponse(
        "No valid chat messages were provided.",
        400
      );
    }

    // Gemini conversation must start with a user message.
    const firstUserIndex = validMessages.findIndex(
      (message) => message.role === "user"
    );

    if (firstUserIndex === -1) {
      return createErrorResponse(
        "A user message is required.",
        400
      );
    }

    const conversation = validMessages.slice(firstUserIndex);

    // --------------------------------------------------
    // 4. CREATE GEMINI CLIENT
    // --------------------------------------------------

    const ai = new GoogleGenAI({
      apiKey,
    });

    // --------------------------------------------------
    // 5. CONVERT MESSAGES TO GEMINI FORMAT
    // --------------------------------------------------

    const contents: GeminiMessage[] = conversation.map(
      (message) => ({
        role:
          message.role === "assistant"
            ? "model"
            : "user",
        parts: [
          {
            text: message.content.trim(),
          },
        ],
      })
    );

    let lastError: unknown = null;

    // --------------------------------------------------
    // 6. TRY MODELS WITH FALLBACK
    // --------------------------------------------------

    for (const model of MODELS) {
      for (
        let attempt = 0;
        attempt <= MAX_RETRIES_PER_MODEL;
        attempt++
      ) {
        try {
          console.log(
            `Aura AI request: model=${model}, attempt=${attempt + 1}`
          );

          const response =
            await ai.models.generateContent({
              model,
              contents,
              config: {
                systemInstruction: `
You are Aura, the friendly AI assistant for AuraStays,
a hotel marketplace.

You can speak:
- English
- Hindi
- Hinglish

You help users with:
- Finding hotels
- Hotel facilities
- Room information
- Booking guidance
- Travel questions
- Hotel policies
- General stay-related questions

Rules:
1. Never invent live hotel availability.
2. Never invent hotel prices.
3. Never claim that a booking is confirmed unless
   the actual booking system confirms it.
4. Never pretend to access private customer data
   unless it is explicitly provided.
5. Be friendly and conversational.
6. Keep answers reasonably concise.
7. If you are unsure, say so honestly.
                `,
                temperature: 0.7,
                maxOutputTokens: 800,
              },
            });

          const text = response.text?.trim();

          if (!text) {
            throw new Error(
              "Gemini returned an empty response."
            );
          }

          console.log(
            `Aura AI success: model=${model}`
          );

          return Response.json({
            message: text,
            model,
          });
        } catch (error: unknown) {
          lastError = error;

          const errorMessage = getErrorMessage(error);
          const statusCode = getStatusCode(error);

          console.error(
            `Aura AI error: model=${model}, attempt=${attempt + 1}, status=${statusCode ?? "unknown"}`,
            errorMessage
          );

          // Do not retry authentication or invalid
          // request errors.
          if (!isRetryableError(error)) {
            break;
          }

          // Retry the same model once.
          if (attempt < MAX_RETRIES_PER_MODEL) {
            console.log(
              `Retrying ${model} in ${RETRY_DELAY_MS}ms...`
            );

            await sleep(RETRY_DELAY_MS);
          }
        }
      }

      console.warn(
        `Model ${model} failed. Trying fallback model...`
      );
    }

    // --------------------------------------------------
    // 7. HANDLE ALL MODEL FAILURES
    // --------------------------------------------------

    const lastErrorMessage = getErrorMessage(lastError);
    const lastStatusCode = getStatusCode(lastError);
    const lowerError = lastErrorMessage.toLowerCase();

    console.error(
      "All Aura AI models failed:",
      lastErrorMessage
    );

    // Authentication errors
    if (
      lastStatusCode === 401 ||
      lastStatusCode === 403 ||
      lowerError.includes("api key") ||
      lowerError.includes("permission denied") ||
      lowerError.includes("unauthenticated")
    ) {
      return createErrorResponse(
        "Gemini authentication failed. Check your API key and permissions.",
        401
      );
    }

    // Invalid or unavailable model
    if (
      lastStatusCode === 404 ||
      lowerError.includes("not_found") ||
      lowerError.includes("not found")
    ) {
      return createErrorResponse(
        "None of the configured Gemini models are available for this API configuration.",
        404
      );
    }

    // Quota or rate limit
    if (
      lastStatusCode === 429 ||
      lowerError.includes("quota") ||
      lowerError.includes("rate limit") ||
      lowerError.includes("too many requests")
    ) {
      return createErrorResponse(
        "Gemini API quota or rate limit reached. Please try again later.",
        429
      );
    }

    // Temporary provider issue
    if (
      lastStatusCode === 500 ||
      lastStatusCode === 502 ||
      lastStatusCode === 503 ||
      lastStatusCode === 504 ||
      lowerError.includes("unavailable") ||
      lowerError.includes("high demand") ||
      lowerError.includes("overloaded")
    ) {
      return createErrorResponse(
        "Aura is temporarily unavailable. Please try again in a moment.",
        503
      );
    }

    // General error
    return createErrorResponse(
      "Aura could not connect to the AI service. Please try again.",
      500
    );
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);

    console.error(
      "AuraStays unexpected API error:",
      errorMessage
    );

    return createErrorResponse(
      "Something went wrong while connecting to Aura.",
      500
    );
  }
}