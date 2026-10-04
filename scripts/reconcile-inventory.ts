import "dotenv/config";

const { reconcileExpiredReservations } =
  await import("#/features/inventory/server/reconcile-reservations");

try {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Check your .env file.");
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is missing. Check your .env file.");
  }

  const summary = await reconcileExpiredReservations();

  console.log("Inventory reconciliation complete", summary);
  process.exit(0);
} catch (error) {
  console.error("Inventory reconciliation failed", error);
  process.exit(1);
}
