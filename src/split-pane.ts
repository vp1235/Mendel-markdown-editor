export function initSplitPane(
  app: HTMLElement,
  divider: HTMLElement,
) {
  let dragging = false;

  divider.addEventListener("mousedown", (e) => {
    e.preventDefault();
    dragging = true;
    divider.classList.add("dragging");
    document.body.classList.add("resizing");
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const appRect = app.getBoundingClientRect();
    const fraction = (e.clientX - appRect.left) / appRect.width;
    const clamped = Math.min(0.8, Math.max(0.2, fraction));
    const dividerWidth = "var(--divider-width)";
    app.style.gridTemplateColumns = `${clamped}fr ${dividerWidth} ${1 - clamped}fr`;
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    divider.classList.remove("dragging");
    document.body.classList.remove("resizing");
  });
}
