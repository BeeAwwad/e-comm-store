import { createHmac, timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "#/db";
import { payments, processedWebhooks } from "#/db/schema";
import { completePayment } from "#/features/payment/server/complete-payment";
import type { PaystackVerification } from "#/lib/paystack";

type PaystackEvent = {
  event: string;
  data: PaystackVerification["data"];
};

function validSignature(body: string, signature: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not defined");
  }

  const expected = createHmac("sha512", secret).update(body).digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

export const Route = createFileRoute("/api/webhooks/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-paystack-signature") ?? "";

        const rawBody = await request.text();

        if (!validSignature(rawBody, signature)) {
          return new Response("Invalid signature", {
            status: 401,
          });
        }

        const event = JSON.parse(rawBody) as PaystackEvent;

        if (event.event !== "charge.success" || !event.data?.reference) {
          return new Response("OK");
        }

        const eventKey = `charge.success:${event.data.id}`;

        try {
          const existing = await db.query.processedWebhooks.findFirst({
            where: eq(processedWebhooks.eventKey, eventKey),
          });

          if (existing) {
            return new Response("OK");
          }

          const payment = await db.query.payments.findFirst({
            where: eq(payments.reference, event.data.reference),
          });

          if (!payment) {
            return new Response("Unknown reference", {
              status: 200,
            });
          }

          await completePayment(event.data);

          await db
            .insert(processedWebhooks)
            .values({
              provider: "paystack",
              eventKey,
              eventType: event.event,
            })
            .onConflictDoNothing({
              target: processedWebhooks.eventKey,
            });

          return new Response("OK");
        } catch (error) {
          console.error("Paystack webhook failed", error);

          return new Response("Webhook processing failed", {
            status: 500,
          });
        }
      },
    },
  },
});
