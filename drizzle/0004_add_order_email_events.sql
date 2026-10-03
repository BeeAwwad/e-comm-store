CREATE TYPE "public"."order_email_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."order_email_type" AS ENUM('payment_confirmation', 'shipment_confirmation', 'delivery_confirmation');--> statement-breakpoint
CREATE TABLE "order_email_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"type" "order_email_type" NOT NULL,
	"recipient" text NOT NULL,
	"status" "order_email_status" DEFAULT 'pending' NOT NULL,
	"provider_message_id" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "order_email_events" ADD CONSTRAINT "order_email_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_email_events_order_type_unique" ON "order_email_events" USING btree ("order_id","type");--> statement-breakpoint
CREATE INDEX "order_email_events_order_id_idx" ON "order_email_events" USING btree ("order_id");