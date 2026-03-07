import { NotificationPage } from "#/pages/NotificationPage";
import { ReviewPage } from "#/pages/ReviewPage";
import { OVERLAY, parseOverlayType } from "#/lib/overlay";
import App from "#/App";

const overlayType = parseOverlayType(
  new URLSearchParams(window.location.search).get("overlay"),
);

export function RenderWindow() {
  if (overlayType === OVERLAY.review) {
    return <ReviewPage />;
  }
  if (overlayType === OVERLAY.toast) {
    return <NotificationPage />;
  }

  return <App />;
}
