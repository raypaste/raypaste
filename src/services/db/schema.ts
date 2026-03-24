import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const completions = sqliteTable("completions", {
  id: text("id").primaryKey(),
  timestamp: integer("timestamp").notNull(),
  inputText: text("input_text").notNull(),
  outputText: text("output_text").notNull().default(""),
  finalText: text("final_text"),
  wasApplied: integer("was_applied").notNull().default(0),
  isReviewMode: integer("is_review_mode").notNull().default(0),
  hadError: integer("had_error").notNull().default(0),
  errorMessage: text("error_message"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  completionMs: integer("completion_ms").notNull().default(0),
  appId: text("app_id").notNull(),
  promptId: text("prompt_id").notNull(),
  promptName: text("prompt_name").notNull(),
  promptText: text("prompt_text").notNull(),
  promptSource: text("prompt_source"),
  pageUrl: text("page_url"),
  matchedWebsitePattern: text("matched_website_pattern"),
  model: text("model").notNull(),
  provider: text("provider").notNull(),
});

export const usageStats = sqliteTable("usage_stats", {
  id: text("id").primaryKey().default("global"),
  totalCompletions: integer("total_completions").notNull().default(0),
  totalApplied: integer("total_applied").notNull().default(0),
  totalInputTokens: integer("total_input_tokens").notNull().default(0),
  totalOutputTokens: integer("total_output_tokens").notNull().default(0),
  totalCompletionMs: integer("total_completion_ms").notNull().default(0),
  promptStats: text("prompt_stats").notNull().default("{}"),
  appStats: text("app_stats").notNull().default("{}"),
});
