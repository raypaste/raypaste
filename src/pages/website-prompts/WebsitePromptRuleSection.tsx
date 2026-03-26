import { ReactNode } from "react";

interface WebsitePromptRuleSectionProps {
  title: string;
  body: string;
  children: ReactNode;
}

export function WebsitePromptRuleSection({
  title,
  body,
  children,
}: WebsitePromptRuleSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-foreground text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{body}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
