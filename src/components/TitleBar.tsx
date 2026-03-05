export function TitleBar() {
  return (
    // Full-width drag region for Overlay titlebar
    <div
      className="absolute top-0 right-0 left-0 z-20 h-8 select-none"
      data-tauri-drag-region
    />
  );
}
