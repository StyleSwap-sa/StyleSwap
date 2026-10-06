import crypto from "crypto";
import { protectedProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import * as db from "../db";

const PINTEREST_AUTH_URL = "https://www.pinterest.com/oauth/";

function createPinterestState(userId: number): string {
  const payload = {
    userId,
    exp: Date.now() + 10 * 60 * 1000, // 10 minutes
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", ENV.cookieSecret)
    .update(encoded)
    .digest("base64url");

  return `${encoded}.${signature}`;
}

export function verifyPinterestState(state: string): { userId: number } {
  const [encoded, signature] = state.split(".");

  if (!encoded || !signature) {
    throw new Error("Invalid Pinterest OAuth state");
  }

  const expectedSignature = crypto
    .createHmac("sha256", ENV.cookieSecret)
    .update(encoded)
    .digest("base64url");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    throw new Error("Invalid Pinterest OAuth state");
  }

  const payload = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf8")
  ) as {
    userId: number;
    exp: number;
  };

  if (!payload.userId || Date.now() > payload.exp) {
    throw new Error("Expired Pinterest OAuth state");
  }

  return {
    userId: payload.userId,
  };
}

export const pinterestRouter = router({
  getAuthUrl: protectedProcedure.query(({ ctx }) => {
    if (
      !ENV.pinterestClientId ||
      !ENV.pinterestClientSecret ||
      !ENV.pinterestRedirectUri
    ) {
      throw new Error("Pinterest OAuth is not configured");
    }

    const state = createPinterestState(ctx.user.id);

    const params = new URLSearchParams({
      client_id: ENV.pinterestClientId,
      redirect_uri: ENV.pinterestRedirectUri,
      response_type: "code",
      scope: "pins:read boards:read",
      state,
    });

    return {
      url: `${PINTEREST_AUTH_URL}?${params.toString()}`,
    };
  }),

  getConnection: protectedProcedure.query(async ({ ctx }) => {
    const connection = await db.getPinterestConnection(ctx.user.id);

    return {
      connected: !!connection,
      expiresAt: connection?.expiresAt ?? null,
    };
  }),

  getPins: protectedProcedure.query(async ({ ctx }) => {
  const connection = await db.getPinterestConnection(ctx.user.id);

  if (!connection) {
    throw new Error("Pinterest account is not connected");
  }

  const response = await fetch("https://api.pinterest.com/v5/pins", {
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
    },
  });

  if (!response.ok) {
  const errorText = await response.text();

  console.error("[Pinterest] Failed to fetch pins:", {
    status: response.status,
    statusText: response.statusText,
    body: errorText,
  });

  throw new Error(
    `Pinterest API error ${response.status}: ${errorText}`
  );
}

  const data = await response.json();

  return {
    items: data.items ?? [],
    bookmark: data.bookmark ?? null,
  };
}),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await db.deletePinterestConnection(ctx.user.id);

    return {
      success: true,
    };
  }),
});