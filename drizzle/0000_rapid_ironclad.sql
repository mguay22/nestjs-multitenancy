CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text,
	"password" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
