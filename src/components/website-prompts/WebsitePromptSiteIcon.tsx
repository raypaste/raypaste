import { Globe, LoaderCircle } from "lucide-react";
import { cn } from "#/lib/utils";
import type { WebsitePromptSiteIconStatus } from "#/stores";

interface WebsitePromptSiteIconProps {
  iconSrc: string | null;
  iconStatus?: WebsitePromptSiteIconStatus;
  domain: string;
  className?: string;
  iconClassName?: string;
}

export function WebsitePromptSiteIcon({
  iconSrc,
  iconStatus = "idle",
  domain,
  className,
  iconClassName,
}: WebsitePromptSiteIconProps) {
  return (
    <div
      className={cn(
        "bg-muted/40 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
        className,
      )}
      aria-label={domain || "Website icon"}
    >
      {iconSrc ? (
        <img
          src={iconSrc}
          alt=""
          className={cn(
            "h-5 w-5 shrink-0 object-contain [image-rendering:auto]",
            iconClassName,
          )}
        />
      ) : iconStatus === "loading" ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <Globe className="h-4 w-4" />
      )}
    </div>
  );
}
