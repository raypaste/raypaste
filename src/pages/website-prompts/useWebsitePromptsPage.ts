import { useEffect, useMemo, useState } from "react";
import {
  normalizeDomainInput,
  normalizePathPrefixInput,
  usePromptsStore,
} from "#/stores/promptsStore";
import { fetchWebsiteIcon } from "#/services/websiteIcons";

export interface WebsitePromptsPageProps {
  selectedSiteId: string | null;
  onSelectSite: (siteId: string | null) => void;
}

export function useWebsitePromptsPage({
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

  return {
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
  };
}
