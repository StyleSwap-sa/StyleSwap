import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getUserFromRequest } from "./auth";
import { toContextUser } from "../db";

export type TrpcContextUser = {
  id: number;
  openId: string | null;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin" | "merchant";
  userType: "customer" | "merchant" | "admin";
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
  phone: string | null;
  currentBoutiqueId: number | null;
  freeTrialUsed: number;
  freeTrialUsedAt: string | null;
  freeTrialExpiresAt: string | null;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: TrpcContextUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: TrpcContextUser | null = null;
  try {
    const raw = await getUserFromRequest(opts.req);
    user = await toContextUser(raw ?? undefined);
  } catch (error) {
    console.error("[Context] Error authenticating user:", error);
    user = null;
  }
  return { req: opts.req, res: opts.res, user };
}