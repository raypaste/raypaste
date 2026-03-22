export const OVERLAY = {
  review: "review",
  toast: "toast",
  progress: "progress",
} as const;

export type OverlayType = (typeof OVERLAY)[keyof typeof OVERLAY];

const overlayValues = new Set<string>(Object.values(OVERLAY));

export function parseOverlayType(
  value: string | null,
): OverlayType | undefined {
  if (!value || !overlayValues.has(value)) {
    return undefined;
  }

  return value as OverlayType;
}
