import type { ReactNode } from "react";

import "#/App.css";
import { NotificationPage } from "#/pages/NotificationPage";
import { ReviewPage } from "#/pages/ReviewPage";
import { ProgressPage } from "#/pages/ProgressPage";
import { PromptPickPage } from "#/pages/PromptPickPage";
import { OVERLAY, parseOverlayType } from "#/lib/overlay";
import { useApplyDocumentTheme } from "#/hooks/useApplyDocumentTheme";
import App from "#/App";

const overlayType = parseOverlayType(
  new URLSearchParams(window.location.search).get("overlay"),
);

function OverlayThemeRoot({ children }: { children: ReactNode }) {
  useApplyDocumentTheme();
  return <>{children}</>;
}

export function RenderWindow() {
  switch (overlayType) {
    case OVERLAY.review:
      return (
        <OverlayThemeRoot>
          <ReviewPage />
        </OverlayThemeRoot>
      );

    case OVERLAY.toast:
      return (
        <OverlayThemeRoot>
          <NotificationPage />
        </OverlayThemeRoot>
      );

    case OVERLAY.progress:
      return (
        <OverlayThemeRoot>
          <ProgressPage />
        </OverlayThemeRoot>
      );

    case OVERLAY.promptPick:
      return (
        <OverlayThemeRoot>
          <PromptPickPage />
        </OverlayThemeRoot>
      );

    default:
      return <App />;
  }
}
