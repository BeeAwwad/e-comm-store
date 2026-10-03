import "@tanstack/react-start/server-only";

import { Resend } from "resend";
import { and, eq } from "drizzle-orm";

import { db } from "#/db";
import { orderEmailEvents, orderItems, orders } from "#/db/schema";
import { formatNaira } from "#/lib/utils";

type OrderEmailType =
  "payment_confirmation" | "shipment_confirmation" | "delivery_confirmation";

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not defined");
  }

  return new Resend(apiKey);
}

function getAppUrl() {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not defined");
  }

  return appUrl.replace(/\/$/, "");
}

function emailShell(input: { heading: string; body: string }) {
  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;background:#080808;color:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
        <main style="max-width:620px;margin:0 auto;padding:40px 24px">
          <p style="margin:0;color:#ef4444;font-size:11px;letter-spacing:2px;text-transform:uppercase">
            Your Store
          </p>

          <h1 style="margin:18px 0 0;font-size:32px;line-height:1.1;text-transform:uppercase">
            ${input.heading}
          </h1>

          <section style="margin-top:28px;padding:24px;border:1px solid #262626;background:#101010">
            ${input.body}
          </section>

          <p style="margin:28px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6">
            Please keep this email for your records.
          </p>
        </main>
      </body>
    </html>
  `;
}

export async function sendOrderEmail(input: {
  orderId: string;
  type: OrderEmailType;
  force?: boolean;
}) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, input.orderId),
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const existingEvent = await db.query.orderEmailEvents.findFirst({
    where: and(
      eq(orderEmailEvents.orderId, order.id),
      eq(orderEmailEvents.type, input.type),
    ),
  });

  if (existingEvent?.status === "sent") {
    return {
      sent: false,
      reason: "already_sent" as const,
    };
  }

  if (existingEvent && !input.force) {
    return {
      sent: false,
      reason: "already_attempted" as const,
    };
  }

  if (existingEvent && input.force) {
    await db
      .update(orderEmailEvents)
      .set({
        status: "pending",
        errorMessage: null,
      })
      .where(eq(orderEmailEvents.id, existingEvent.id));
  }

  if (!existingEvent) {
    await db
      .insert(orderEmailEvents)
      .values({
        orderId: order.id,
        type: input.type,
        recipient: order.email,
      })
      .onConflictDoNothing({
        target: [orderEmailEvents.orderId, orderEmailEvents.type],
      });
  }

  const emailEvent = await db.query.orderEmailEvents.findFirst({
    where: and(
      eq(orderEmailEvents.orderId, order.id),
      eq(orderEmailEvents.type, input.type),
    ),
  });

  if (!emailEvent) {
    throw new Error("Could not create email event");
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #262626">
            <strong>${escapeHtml(item.productName)}</strong><br />
            <span style="color:#a3a3a3;font-size:12px">
              ${escapeHtml(item.color)} / ${escapeHtml(item.size)} × ${item.quantity}
            </span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #262626;text-align:right">
            ${formatNaira(item.lineTotalKobo)}
          </td>
        </tr>
      `,
    )
    .join("");

  const orderUrl = `${getAppUrl()}/order/${order.publicToken}`;

  let subject = "";
  let heading = "";
  let message = "";

  if (input.type === "payment_confirmation") {
    subject = `Order confirmed: ${order.orderNumber}`;
    heading = "Order received";
    message = `
      <p>Hi ${escapeHtml(order.firstName)},</p>
      <p>Your payment has been confirmed. We are preparing your order.</p>
    `;
  }

  if (input.type === "shipment_confirmation") {
    subject = `Your order has shipped: ${order.orderNumber}`;
    heading = "Your order is on the way";
    message = `
      <p>Hi ${escapeHtml(order.firstName)},</p>
      <p>Your order has been shipped.</p>
      ${
        order.courier
          ? `<p><strong>Courier:</strong> ${escapeHtml(order.courier)}</p>`
          : ""
      }
      ${
        order.trackingNumber
          ? `<p><strong>Tracking number:</strong> ${escapeHtml(order.trackingNumber)}</p>`
          : ""
      }
    `;
  }

  if (input.type === "delivery_confirmation") {
    subject = `Order delivered: ${order.orderNumber}`;
    heading = "Order delivered";
    message = `
      <p>Hi ${escapeHtml(order.firstName)},</p>
      <p>Your order has been marked as delivered. We hope you enjoy it.</p>
    `;
  }

  const html = emailShell({
    heading,
    body: `
      ${message}

      <p style="margin-top:24px">
        <strong>Order:</strong> ${escapeHtml(order.orderNumber)}
      </p>

      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        ${itemRows}
      </table>

      <p style="margin-top:20px;font-size:18px">
        <strong>Total: ${formatNaira(order.totalKobo)}</strong>
      </p>

      <p style="margin-top:28px">
        <a
          href="${orderUrl}"
          style="display:inline-block;background:#ef4444;color:#ffffff;padding:14px 20px;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase"
        >
          View order
        </a>
      </p>
    `,
  });

  try {
    const { data, error } = await getResend().emails.send(
      {
        from: process.env.EMAIL_FROM!,
        to: [order.email],
        subject,
        html,
      },
      {
        idempotencyKey: `order-email/${order.id}/${input.type}`,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    await db
      .update(orderEmailEvents)
      .set({
        status: "sent",
        providerMessageId: data?.id ?? null,
        errorMessage: null,
        sentAt: new Date(),
      })
      .where(eq(orderEmailEvents.id, emailEvent.id));

    return {
      sent: true,
      providerMessageId: data?.id ?? null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email error";

    await db
      .update(orderEmailEvents)
      .set({
        status: "failed",
        errorMessage: message,
      })
      .where(eq(orderEmailEvents.id, emailEvent.id));

    throw error;
  }
}
