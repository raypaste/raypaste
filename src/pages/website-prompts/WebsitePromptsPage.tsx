import { useEffect, useMemo, useState } from "react";
import { Globe, Plus, Trash2 } from "lucide-react";
import { cn } from "#/lib/utils";
import {
  normalizeDomainInput,
  normalizePathPrefixInput,
  usePromptsStore,
} from "#/stores/promptsStore";
import { AppPromptCombobox } from "#/pages/apps/AppPromptCombobox";
import { WebsitePromptSiteIcon } from "#/components/website-prompts/WebsitePromptSiteIcon";
import { fetchWebsiteIcon } from "#/services/websiteIcons";
import { Button } from "#/components/ui/button";
import { RuleEditor } from "#/pages/website-prompts/WebsitePromptRuleEditor";
import { RuleSection } from "#/pages/website-prompts/WebsitePromptRuleSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";

interface WebsitePromptsPageProps {
  selectedSiteId: string | null;
  onSelectSite: (siteId: string | null) => void;
}

export function WebsitePromptsPage({
  selectedSiteId,
  onSelectSite,
}: WebsitePromptsPageProps) {
  const {
    prompts,
    websitePromptSites,
    addWebsitePromptSite,
    updateWebsitePromptSite,
    removeWebsitePromptSite,
    addWebsitePromptSiteRule,
    updateWebsitePromptSiteRule,
    removeWebsitePromptSiteRule,
    fetchWebsitePromptSiteIcon,
  } = usePromptsStore();
  const [domainDrafts, setDomainDrafts] = useState<Record<string, string>>({});
  const [pathDrafts, setPathDrafts] = useState<Record<string, string>>({});
  const [removingSiteId, setRemovingSiteId] = useState<string | null>(null);

  useEffect(() => {
    if (websitePromptSites.length === 0) {
      if (selectedSiteId !== null) onSelectSite(null);
      return;
    }
    const selectedExists = websitePromptSites.some(
      (site) => site.id === selectedSiteId,
    );
    if (!selectedExists) {
      onSelectSite(websitePromptSites[0]?.id ?? null);
    }
  }, [onSelectSite, selectedSiteId, websitePromptSites]);

  useEffect(() => {
    const nextSite = websitePromptSites.find(
      (site) => site.domain && !site.iconSrc && site.iconStatus === "idle",
    );
    if (!nextSite) {
      return;
    }
    void fetchWebsitePromptSiteIcon(nextSite.id, fetchWebsiteIcon);
  }, [fetchWebsitePromptSiteIcon, websitePromptSites]);

  const selectedSite =
    websitePromptSites.find((site) => site.id === selectedSiteId) ??
    websitePromptSites[0] ??
    null;

  const hasPrompts = prompts.length > 0;

  const promptNameById = useMemo(
    () => Object.fromEntries(prompts.map((prompt) => [prompt.id, prompt.name])),
    [prompts],
  );

  function getDomainDraft(siteId: string, domain: string) {
    return domainDrafts[siteId] ?? domain;
  }

  function getPathDraft(ruleId: string, value: string) {
    return pathDrafts[ruleId] ?? value;
  }

  async function commitDomain(siteId: string, rawValue: string) {
    const normalizedDomain = normalizeDomainInput(rawValue);
    updateWebsitePromptSite(siteId, { domain: normalizedDomain });
    setDomainDrafts((current) => {
      const next = { ...current };
      delete next[siteId];
      return next;
    });
    if (normalizedDomain) {
      await fetchWebsitePromptSiteIcon(siteId, fetchWebsiteIcon);
    }
  }

  function handleAddWebsite() {
    const siteId = addWebsitePromptSite();
    onSelectSite(siteId);
    setDomainDrafts((current) => ({ ...current, [siteId]: "" }));
  }

  function handleRemoveSelectedSite(siteId: string) {
    const currentIndex = websitePromptSites.findIndex(
      (site) => site.id === siteId,
    );
    const fallbackSite =
      websitePromptSites[currentIndex + 1] ??
      websitePromptSites[currentIndex - 1] ??
      null;
    removeWebsitePromptSite(siteId);
    onSelectSite(fallbackSite?.id ?? null);
  }

  function sitePromptSummary(siteId: string) {
    const site = websitePromptSites.find((item) => item.id === siteId);
    const names = Array.from(
      new Set(
        site?.rules
          .map((rule) => promptNameById[rule.promptId])
          .filter((name): name is string => !!name) ?? [],
      ),
    );
    if (names.length === 0) {
      return "No prompts assigned";
    }
    if (names.length === 1) {
      return names[0];
    }

    return `${names[0]} +${names.length - 1}`;
  }

  const pendingRemoveSite = useMemo(
    () =>
      removingSiteId
        ? (websitePromptSites.find((s) => s.id === removingSiteId) ?? null)
        : null,
    [removingSiteId, websitePromptSites],
  );

  return (
    <>
      <div className="flex h-full flex-col gap-6 px-6 pb-6">
        <div className="from-primary/6 via-background to-primary/2 border-border rounded-xl border bg-linear-to-br p-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary/12 text-primary rounded-xl p-3">
              <Globe className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-foreground text-sm font-medium">
                  How it works
                </p>
                <p className="text-muted-foreground mt-1 max-w-3xl text-xs leading-relaxed">
                  Set prompts for use on specific websites. Optionally assign
                  prompts for specific pages or sections of a site.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-foreground text-sm font-semibold">
              Your website prompt connections
            </p>
            <p className="text-muted-foreground text-xs">
              Select or add a website, then set the prompts that will be used
              for it.
            </p>
          </div>

          <Button
            type="button"
            disabled={!hasPrompts}
            onClick={handleAddWebsite}
            className={cn(
              hasPrompts
                ? ""
                : "bg-muted/50 text-muted-foreground cursor-not-allowed",
            )}
          >
            <Plus className="h-4 w-4" />
            Add website
          </Button>
        </div>

        {!hasPrompts && (
          <div className="border-border bg-muted/15 rounded-xl border px-4 py-3 text-sm">
            <p className="text-foreground font-medium">Create a prompt first</p>
            <p className="text-muted-foreground mt-1">
              Website cards point to your saved prompts. Create one in New
              Prompt, then come back here to map it to specific websites or
              paths.
            </p>
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-border bg-muted/10 rounded-xl border p-2">
            {websitePromptSites.length === 0 ? (
              <div className="flex h-full min-h-60 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
                <Globe className="text-muted-foreground mb-3 h-5 w-5" />
                <p className="text-foreground text-sm font-medium">
                  No websites yet
                </p>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  Add a website to start connecting prompts for use in your
                  common workflows.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {websitePromptSites.map((site) => {
                  const isSelected = site.id === selectedSite?.id;
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => onSelectSite(site.id)}
                      className={cn(
                        "w-full rounded-xl border p-2 text-left transition-colors",
                        isSelected
                          ? "border-primary/30 bg-primary/8"
                          : "border-border bg-background/70 hover:bg-background",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <WebsitePromptSiteIcon
                          iconSrc={site.iconSrc}
                          iconStatus={site.iconStatus}
                          domain={site.domain}
                          iconClassName="h-[18px] w-[18px]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-foreground truncate text-sm font-semibold">
                              {site.domain || "New website"}
                            </p>
                            <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                              {site.rules.length}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-0.5 truncate text-xs">
                            {sitePromptSummary(site.id)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-border bg-background rounded-xl border p-3">
            {!selectedSite ? (
              <div className="flex h-full min-h-60 flex-col items-center justify-center text-center">
                <Globe className="text-muted-foreground mb-3 h-6 w-6" />
                <p className="text-foreground font-medium">
                  Select a website card
                </p>
                <p className="text-muted-foreground mt-1 max-w-md text-sm leading-relaxed">
                  Choose a website from the list to edit its domain, favicon,
                  and nested matching rules.
                </p>
              </div>
            ) : (
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
                    value={getDomainDraft(selectedSite.id, selectedSite.domain)}
                    onChange={(event) =>
                      setDomainDrafts((current) => ({
                        ...current,
                        [selectedSite.id]: event.target.value,
                      }))
                    }
                    onBlur={(event) =>
                      commitDomain(selectedSite.id, event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void commitDomain(
                          selectedSite.id,
                          getDomainDraft(selectedSite.id, selectedSite.domain),
                        );
                      }
                    }}
                    placeholder="example.com"
                    className={cn(
                      "border-border bg-muted/20 text-foreground w-full rounded-xl border px-3 py-2.5 text-sm",
                      "placeholder:text-muted-foreground focus:border-ring focus:outline-none",
                    )}
                  />
                  <p className="text-muted-foreground text-xs">
                    Enter a domain like <code>example.com</code>. Raypaste
                    automatically gets the site's icon.
                  </p>
                  {getDomainDraft(
                    selectedSite.id,
                    selectedSite.domain,
                  ).trim() &&
                    !normalizeDomainInput(
                      getDomainDraft(selectedSite.id, selectedSite.domain),
                    ) && (
                      <p className="text-xs text-amber-600">
                        Enter a complete domain before Raypaste can save or
                        fetch its icon.
                      </p>
                    )}
                </div>

                <RuleSection
                  title="Site wide prompt"
                  body="Use this when one prompt should apply across the entire site and its subdomains."
                >
                  {selectedSite.rules.filter((rule) => rule.kind === "site")
                    .length === 0 ? (
                    <button
                      type="button"
                      disabled={!selectedSite.domain}
                      onClick={() =>
                        addWebsitePromptSiteRule(selectedSite.id, {
                          kind: "site",
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
                      Add site wide prompt
                    </button>
                  ) : (
                    selectedSite.rules
                      .filter((rule) => rule.kind === "site")
                      .map((rule) => (
                        <RuleEditor
                          key={rule.id}
                          title="Entire website"
                          description={`Matches ${selectedSite.domain} and subdomains.`}
                          labelValue={rule.label}
                          onLabelChange={(label) =>
                            updateWebsitePromptSiteRule(
                              selectedSite.id,
                              rule.id,
                              {
                                label,
                              },
                            )
                          }
                          inputValue={selectedSite.domain}
                          inputDisabled
                          inputPlaceholder={
                            selectedSite.domain || "Domain required"
                          }
                          promptCombobox={
                            <AppPromptCombobox
                              prompts={prompts}
                              assignedPromptId={rule.promptId}
                              placeholder="Choose prompt"
                              onAssign={(promptId) =>
                                updateWebsitePromptSiteRule(
                                  selectedSite.id,
                                  rule.id,
                                  {
                                    promptId,
                                  },
                                )
                              }
                            />
                          }
                          footer={
                            !rule.promptId ? (
                              <p className="text-xs text-amber-600">
                                Choose a prompt to finish this site wide
                                connection.
                              </p>
                            ) : null
                          }
                          onDelete={() =>
                            removeWebsitePromptSiteRule(
                              selectedSite.id,
                              rule.id,
                            )
                          }
                        />
                      ))
                  )}
                </RuleSection>

                <RuleSection
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
                          hasDraft && selectedSite.domain && !normalizedValue;
                        return (
                          <RuleEditor
                            key={rule.id}
                            title={rule.label.trim() || "Subpath rule"}
                            description="Matches when the current page URL starts with this exact URL."
                            labelValue={rule.label}
                            onLabelChange={(label) =>
                              updateWebsitePromptSiteRule(
                                selectedSite.id,
                                rule.id,
                                {
                                  label,
                                },
                              )
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
                              updateWebsitePromptSiteRule(
                                selectedSite.id,
                                rule.id,
                                {
                                  value,
                                },
                              );
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
                                onAssign={(promptId) =>
                                  updateWebsitePromptSiteRule(
                                    selectedSite.id,
                                    rule.id,
                                    {
                                      promptId,
                                    },
                                  )
                                }
                              />
                            }
                            footer={
                              isInvalid ? (
                                <p className="text-xs text-amber-600">
                                  Enter a full URL on this domain, like{" "}
                                  <code>
                                    https://{selectedSite.domain}/docs
                                  </code>
                                  .
                                </p>
                              ) : !rule.promptId ? (
                                <p className="text-xs text-amber-600">
                                  Choose a prompt to activate this subpath rule.
                                </p>
                              ) : null
                            }
                            onDelete={() =>
                              removeWebsitePromptSiteRule(
                                selectedSite.id,
                                rule.id,
                              )
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
                </RuleSection>

                <button
                  type="button"
                  onClick={() => setRemovingSiteId(selectedSite.id)}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive mt-4 inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove website
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={removingSiteId !== null}
        onOpenChange={(open) => !open && setRemovingSiteId(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-muted/40">
              <Trash2 className="text-muted-foreground" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-[15px] font-semibold">
              {pendingRemoveSite?.domain?.trim()
                ? `Remove ${pendingRemoveSite.domain}?`
                : "Remove this website?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This removes the website connection to your prompts for this site.
              Your saved prompts are not deleted. To delete a specific prompt,
              open that prompt from the sidebar and delete it there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removingSiteId) {
                  handleRemoveSelectedSite(removingSiteId);
                  setRemovingSiteId(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
