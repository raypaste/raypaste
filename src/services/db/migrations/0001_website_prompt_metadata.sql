ALTER TABLE `completions` ADD COLUMN `prompt_source` text;
--> statement-breakpoint
ALTER TABLE `completions` ADD COLUMN `page_url` text;
--> statement-breakpoint
ALTER TABLE `completions` ADD COLUMN `matched_website_pattern` text;
