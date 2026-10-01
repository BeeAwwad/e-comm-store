import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { db } from "#/db";
import { account, session, user, verification } from "#/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ["http://localhost:3000", process.env.APP_URL].filter(
    (origin): origin is string => Boolean(origin),
  ),
  plugins: [admin(), tanstackStartCookies()],
});
