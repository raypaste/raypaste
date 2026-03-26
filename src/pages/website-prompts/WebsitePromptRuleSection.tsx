import { ReactNode } from "react";

interface RuleSectionProps {
  title: string;
  body: string;
  children: ReactNode;
}

export function RuleSection({ title, body, children }: RuleSectionProps) {
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
