import { NotificationPage } from "#/pages/NotificationPage";
import { ReviewPage } from "#/pages/ReviewPage";
import { ProgressPage } from "#/pages/ProgressPage";
import { OVERLAY, parseOverlayType } from "#/lib/overlay";
import App from "#/App";

const overlayType = parseOverlayType(
  new URLSearchParams(window.location.search).get("overlay"),
);

export function RenderWindow() {
  switch (overlayType) {
    case OVERLAY.review:
      return <ReviewPage />;

    case OVERLAY.toast:
      return <NotificationPage />;

    case OVERLAY.progress:
      return <ProgressPage />;

    default:
      return <App />;
  }
}
