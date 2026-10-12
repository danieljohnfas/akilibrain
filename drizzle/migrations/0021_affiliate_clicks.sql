CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner" varchar(50) NOT NULL,
	"placement" varchar(50),
	"query" text,
	"clicked_at" timestamp DEFAULT now() NOT NULL
);
