export function WebsitePromptsNoPromptsHint() {
  return (
    <div className="border-border bg-muted/15 rounded-xl border px-4 py-3 text-sm">
      <p className="text-foreground font-medium">Create a prompt first</p>
      <p className="text-muted-foreground mt-1">
        Website cards point to your saved prompts. Create one in New Prompt,
        then come back here to map it to specific websites or paths.
      </p>
    </div>
  );
}
