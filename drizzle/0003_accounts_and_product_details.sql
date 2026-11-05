CREATE TABLE `auth_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_owner`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_invite_token` ON `auth_invites` (`token_hash`);--> statement-breakpoint
CREATE INDEX `auth_invite_user` ON `auth_invites` (`user_id`);--> statement-breakpoint
ALTER TABLE `auth_owner` ADD `display_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_owner` ADD `role` text DEFAULT 'viewer' NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_owner` ADD `permissions` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_owner` ADD `active` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_owner` ADD `version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_owner` ADD `change_token` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_owner` ADD `updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `auth_email_unique` ON `auth_owner` (`email`);--> statement-breakpoint
ALTER TABLE `products` ADD `description` text DEFAULT '' NOT NULL;
--> statement-breakpoint
UPDATE auth_owner SET role='owner',display_name=CASE WHEN display_name='' THEN '店主' ELSE display_name END,updated_at=created_at WHERE id='owner';
