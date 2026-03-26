import { WebsitePromptSiteEditor } from "#/pages/website-prompts/WebsitePromptSiteEditor";
import { WebsitePromptSiteEditorEmpty } from "#/pages/website-prompts/WebsitePromptSiteEditorEmpty";
import { WebsitePromptSiteList } from "#/pages/website-prompts/WebsitePromptSiteList";
import { WebsitePromptsIntro } from "#/pages/website-prompts/WebsitePromptsIntro";
import { WebsitePromptsNoPromptsHint } from "#/pages/website-prompts/WebsitePromptsNoPromptsHint";
import { WebsitePromptsToolbar } from "#/pages/website-prompts/WebsitePromptsToolbar";
import { RemoveWebsiteDialog } from "#/pages/website-prompts/RemoveWebsiteDialog";
import {
  type WebsitePromptsPageProps,
  useWebsitePromptsPage,
} from "#/pages/website-prompts/useWebsitePromptsPage";

export type { WebsitePromptsPageProps };

export function WebsitePromptsPage(props: WebsitePromptsPageProps) {
  const {
    prompts,
    websitePromptSites,
    hasPrompts,
    selectedSite,
    removingSiteId,
    setRemovingSiteId,
    pendingRemoveSite,
    getDomainDraft,
    setDomainDrafts,
    getPathDraft,
    setPathDrafts,
    commitDomain,
    handleAddWebsite,
    handleRemoveSelectedSite,
    sitePromptSummary,
    addWebsitePromptSiteRule,
    updateWebsitePromptSiteRule,
    removeWebsitePromptSiteRule,
    normalizeDomainInput,
    normalizePathPrefixInput,
    onEditPrompt,
  } = useWebsitePromptsPage(props);

  const { onSelectSite } = props;

  return (
    <>
      <div className="flex h-full flex-col gap-6 px-6 pb-12">
        <WebsitePromptsIntro />

        <WebsitePromptsToolbar
          hasPrompts={hasPrompts}
          onAddWebsite={handleAddWebsite}
        />

        {!hasPrompts && <WebsitePromptsNoPromptsHint />}

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-border bg-muted/10 rounded-xl border p-2">
            <WebsitePromptSiteList
              sites={websitePromptSites}
              selectedSiteId={selectedSite?.id ?? null}
              onSelectSite={onSelectSite}
              sitePromptSummary={sitePromptSummary}
            />
          </div>

          <div className="border-border bg-background rounded-xl border p-3">
            {!selectedSite ? (
              <WebsitePromptSiteEditorEmpty />
            ) : (
              <WebsitePromptSiteEditor
                site={selectedSite}
                prompts={prompts}
                getDomainDraft={getDomainDraft}
                setDomainDrafts={setDomainDrafts}
                commitDomain={commitDomain}
                normalizeDomainInput={normalizeDomainInput}
                getPathDraft={getPathDraft}
                setPathDrafts={setPathDrafts}
                normalizePathPrefixInput={normalizePathPrefixInput}
                addWebsitePromptSiteRule={addWebsitePromptSiteRule}
                updateWebsitePromptSiteRule={updateWebsitePromptSiteRule}
                removeWebsitePromptSiteRule={removeWebsitePromptSiteRule}
                onRequestRemoveSite={() => setRemovingSiteId(selectedSite.id)}
                onEditPrompt={onEditPrompt}
              />
            )}
          </div>
        </div>
      </div>

      <RemoveWebsiteDialog
        open={removingSiteId !== null}
        onOpenChange={(open) => !open && setRemovingSiteId(null)}
        pendingSite={pendingRemoveSite}
        onConfirmRemove={() => {
          if (removingSiteId) {
            handleRemoveSelectedSite(removingSiteId);
            setRemovingSiteId(null);
          }
        }}
      />
    </>
  );
}
