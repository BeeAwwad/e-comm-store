ALTER TABLE "orders" ADD COLUMN "inventory_reserved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reservation_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "reserved_stock" integer DEFAULT 0 NOT NULL;