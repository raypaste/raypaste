import type { Dispatch, SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "#/lib/utils";
import type {
  Prompt,
  WebsitePromptSite,
  WebsitePromptSiteRule,
} from "#/stores/promptsStore";
import { AppPromptCombobox } from "#/pages/apps/AppPromptCombobox";
import { WebsitePromptSiteIcon } from "#/components/website-prompts/WebsitePromptSiteIcon";
import { WebsitePromptRuleEditor } from "#/pages/website-prompts/WebsitePromptRuleEditor";
import { WebsitePromptRuleSection } from "#/pages/website-prompts/WebsitePromptRuleSection";

interface WebsitePromptSiteEditorProps {
  site: WebsitePromptSite;
  prompts: Prompt[];
  getDomainDraft: (siteId: string, domain: string) => string;
  setDomainDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  commitDomain: (siteId: string, rawValue: string) => Promise<void>;
  normalizeDomainInput: (raw: string) => string;
  getPathDraft: (ruleId: string, value: string) => string;
  setPathDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  normalizePathPrefixInput: (raw: string, domain: string) => string;
  addWebsitePromptSiteRule: (
    siteId: string,
    rule: { kind: "site" | "path-prefix" },
  ) => void;
  updateWebsitePromptSiteRule: (
    siteId: string,
    ruleId: string,
    updates: Partial<WebsitePromptSiteRule>,
  ) => void;
  removeWebsitePromptSiteRule: (siteId: string, ruleId: string) => void;
  onRequestRemoveSite: () => void;
}

export function WebsitePromptSiteEditor({
  site: selectedSite,
  prompts,
  getDomainDraft,
  setDomainDrafts,
  commitDomain,
  normalizeDomainInput,
  getPathDraft,
  setPathDrafts,
  normalizePathPrefixInput,
  addWebsitePromptSiteRule,
  updateWebsitePromptSiteRule,
  removeWebsitePromptSiteRule,
  onRequestRemoveSite,
}: WebsitePromptSiteEditorProps) {
  const domainInputValue = getDomainDraft(selectedSite.id, selectedSite.domain);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <WebsitePromptSiteIcon
            iconSrc={selectedSite.iconSrc}
            iconStatus={selectedSite.iconStatus}
            domain={selectedSite.domain}
            className="h-10 w-10"
            iconClassName="h-5 w-5"
          />
          <div className="min-w-0">
            <p className="text-foreground text-lg font-semibold">
              {selectedSite.domain || "New website"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Domain
        </label>
        <input
          type="text"
          value={domainInputValue}
          onChange={(event) =>
            setDomainDrafts((current) => ({
              ...current,
              [selectedSite.id]: event.target.value,
            }))
          }
          onBlur={(event) => commitDomain(selectedSite.id, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void commitDomain(selectedSite.id, domainInputValue);
            }
          }}
          placeholder="example.com"
          className={cn(
            "border-border bg-muted/20 text-foreground w-full rounded-xl border px-3 py-2.5 text-sm",
            "placeholder:text-muted-foreground focus:border-ring focus:outline-none",
          )}
        />
        <p className="text-muted-foreground text-xs">
          Enter a domain like <code>example.com</code>. Raypaste automatically
          gets the site&apos;s icon.
        </p>
        {domainInputValue.trim() && !normalizeDomainInput(domainInputValue) && (
          <p className="text-xs text-amber-600">
            Enter a complete domain before Raypaste can save or fetch its icon.
          </p>
        )}
      </div>

      <WebsitePromptRuleSection
        title="Site wide prompt"
        body="Use this when one prompt should apply across the entire site and its subdomains."
      >
        {selectedSite.rules.filter((rule) => rule.kind === "site").length ===
        0 ? (
          <button
            type="button"
            disabled={!selectedSite.domain}
            onClick={() =>
              addWebsitePromptSiteRule(selectedSite.id, { kind: "site" })
            }
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              selectedSite.domain
                ? "bg-secondary text-foreground hover:bg-secondary/80"
                : "bg-muted/50 text-muted-foreground cursor-not-allowed",
            )}
          >
            <Plus className="h-4 w-4" />
            Add site wide prompt
          </button>
        ) : (
          selectedSite.rules
            .filter((rule) => rule.kind === "site")
            .map((rule) => (
              <WebsitePromptRuleEditor
                key={rule.id}
                title="Entire website"
                description={`Matches ${selectedSite.domain} and subdomains.`}
                labelValue={rule.label}
                onLabelChange={(label) =>
                  updateWebsitePromptSiteRule(selectedSite.id, rule.id, {
                    label,
                  })
                }
                inputValue={selectedSite.domain}
                inputDisabled
                inputPlaceholder={selectedSite.domain || "Domain required"}
                promptCombobox={
                  <AppPromptCombobox
                    prompts={prompts}
                    assignedPromptId={rule.promptId}
                    placeholder="Choose prompt"
                    inputClassName="w-full min-w-0 max-w-none"
                    onAssign={(promptId) =>
                      updateWebsitePromptSiteRule(selectedSite.id, rule.id, {
                        promptId,
                      })
                    }
                  />
                }
                footer={
                  !rule.promptId ? (
                    <p className="text-xs text-amber-600">
                      Choose a prompt to finish this site wide connection.
                    </p>
                  ) : null
                }
                onDelete={() =>
                  removeWebsitePromptSiteRule(selectedSite.id, rule.id)
                }
              />
            ))
        )}
      </WebsitePromptRuleSection>

      <WebsitePromptRuleSection
        title="Subpath rules"
        body={`Use full URLs to connect a prompt to specific pages or sections of "${selectedSite.domain}", like docs, org pages, or admin paths. Longer URLs are prioritized.`}
      >
        <div className="space-y-3">
          {selectedSite.rules
            .filter((rule) => rule.kind === "path-prefix")
            .map((rule) => {
              const draftValue = getPathDraft(rule.id, rule.value);
              const hasDraft = draftValue.trim().length > 0;
              const normalizedValue = normalizePathPrefixInput(
                draftValue,
                selectedSite.domain,
              );
              const isInvalid =
                hasDraft && !!selectedSite.domain && !normalizedValue;
              return (
                <WebsitePromptRuleEditor
                  key={rule.id}
                  title={rule.label.trim() || "Subpath rule"}
                  description="Matches when the current page URL starts with this exact URL."
                  labelValue={rule.label}
                  onLabelChange={(label) =>
                    updateWebsitePromptSiteRule(selectedSite.id, rule.id, {
                      label,
                    })
                  }
                  inputValue={draftValue}
                  inputPlaceholder={`https://${selectedSite.domain || "example.com"}/docs`}
                  onInputChange={(value) =>
                    setPathDrafts((current) => ({
                      ...current,
                      [rule.id]: value,
                    }))
                  }
                  onInputBlur={(value) => {
                    updateWebsitePromptSiteRule(selectedSite.id, rule.id, {
                      value,
                    });
                    setPathDrafts((current) => {
                      const next = { ...current };
                      delete next[rule.id];
                      return next;
                    });
                  }}
                  promptCombobox={
                    <AppPromptCombobox
                      prompts={prompts}
                      assignedPromptId={rule.promptId}
                      placeholder="Choose prompt"
                      inputClassName="w-full min-w-0 max-w-none"
                      onAssign={(promptId) =>
                        updateWebsitePromptSiteRule(selectedSite.id, rule.id, {
                          promptId,
                        })
                      }
                    />
                  }
                  footer={
                    isInvalid ? (
                      <p className="text-xs text-amber-600">
                        Enter a full URL on this domain, like{" "}
                        <code>https://{selectedSite.domain}/docs</code>.
                      </p>
                    ) : !rule.promptId ? (
                      <p className="text-xs text-amber-600">
                        Choose a prompt to activate this subpath rule.
                      </p>
                    ) : null
                  }
                  onDelete={() =>
                    removeWebsitePromptSiteRule(selectedSite.id, rule.id)
                  }
                />
              );
            })}

          <button
            type="button"
            disabled={!selectedSite.domain}
            onClick={() =>
              addWebsitePromptSiteRule(selectedSite.id, {
                kind: "path-prefix",
              })
            }
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              selectedSite.domain
                ? "bg-secondary text-foreground hover:bg-secondary/80"
                : "bg-muted/50 text-muted-foreground cursor-not-allowed",
            )}
          >
            <Plus className="h-4 w-4" />
            Add subpath rule
          </button>
        </div>
      </WebsitePromptRuleSection>

      <button
        type="button"
        onClick={onRequestRemoveSite}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive mt-4 inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Remove website
      </button>
    </div>
  );
}
