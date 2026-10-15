import { createServerFn } from "@tanstack/react-start";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "#/db";
import { orders, productVariants, products } from "#/db/schema";
import { getAdminSession } from "#/lib/auth.functions";

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("Unauthorized");
  }
}

export const getAdminDashboard = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();

  const [activeProducts, allOrders, variants, recentOrders] = await Promise.all(
    [
      db
        .select({
          id: products.id,
        })
        .from(products)
        .where(eq(products.status, "active")),

      db
        .select({
          id: orders.id,
          status: orders.status,
          totalKobo: orders.totalKobo,
        })
        .from(orders),

      db
        .select({
          id: productVariants.id,
          sku: productVariants.sku,
          size: productVariants.size,
          color: productVariants.color,
          stock: productVariants.stock,
          reservedStock: productVariants.reservedStock,
          productName: products.name,
          productStatus: products.status,
          active: productVariants.active,
        })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId)),

      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          firstName: orders.firstName,
          lastName: orders.lastName,
          totalKobo: orders.totalKobo,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(6),
    ],
  );

  const paidStatuses = ["paid", "processing", "shipped", "delivered"] as const;

  const paidOrders = allOrders.filter((order) =>
    paidStatuses.includes(order.status as (typeof paidStatuses)[number]),
  );

  const ordersNeedingAction = allOrders.filter(
    (order) => order.status === "paid" || order.status === "processing",
  );

  const lowStockVariants = variants
    .map((variant) => ({
      ...variant,
      availableStock: Math.max(variant.stock - (variant.reservedStock ?? 0), 0),
    }))
    .filter(
      (variant) =>
        variant.active &&
        variant.productStatus === "active" &&
        variant.availableStock <= 3,
    )
    .sort((first, second) => first.availableStock - second.availableStock)
    .slice(0, 6);

  return {
    activeProductCount: activeProducts.length,
    paidOrderCount: paidOrders.length,
    revenueKobo: paidOrders.reduce(
      (total, order) => total + order.totalKobo,
      0,
    ),
    ordersNeedingAction: ordersNeedingAction.length,
    lowStockVariants,
    recentOrders,
  };
});
