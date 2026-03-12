CREATE TABLE IF NOT EXISTS `completions` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` integer NOT NULL,
	`input_text` text NOT NULL,
	`output_text` text DEFAULT '' NOT NULL,
	`final_text` text,
	`was_applied` integer DEFAULT 0 NOT NULL,
	`is_review_mode` integer DEFAULT 0 NOT NULL,
	`had_error` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`input_tokens` integer,
	`output_tokens` integer,
	`completion_ms` integer DEFAULT 0 NOT NULL,
	`app_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`prompt_name` text NOT NULL,
	`prompt_text` text NOT NULL,
	`model` text NOT NULL,
	`provider` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `usage_stats` (
	`id` text PRIMARY KEY DEFAULT 'global' NOT NULL,
	`total_completions` integer DEFAULT 0 NOT NULL,
	`total_applied` integer DEFAULT 0 NOT NULL,
	`total_input_tokens` integer DEFAULT 0 NOT NULL,
	`total_output_tokens` integer DEFAULT 0 NOT NULL,
	`total_completion_ms` integer DEFAULT 0 NOT NULL,
	`prompt_stats` text DEFAULT '{}' NOT NULL,
	`app_stats` text DEFAULT '{}' NOT NULL
);
