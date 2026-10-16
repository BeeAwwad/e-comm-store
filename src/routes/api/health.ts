import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";
import { db } from "#/db";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await db.execute(sql`select 1`);

          return Response.json({
            status: "ok",
            database: "connected",
          });
        } catch (error) {
          console.error("Health check failed", error);

          return Response.json(
            {
              status: "error",
              database: "unavailable",
            },
            {
              status: 503,
            },
          );
        }
      },
    },
  },
});
