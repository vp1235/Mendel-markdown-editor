export interface Tab {
  id: string;
  filePath: string | null;
  content: string;
  isDirty: boolean;
}

export interface TabCallbacks {
  onSwitch: (newTab: Tab, oldTab: Tab | null) => void;
  onAllClosed: () => void;
}

export class TabManager {
  private tabs: Tab[] = [];
  private activeId: string | null = null;
  private counter = 0;
  private container: HTMLElement;
  private callbacks: TabCallbacks;

  constructor(container: HTMLElement, callbacks: TabCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  createTab(filePath: string | null, content: string): Tab {
    this.counter++;
    const id = `tab-${this.counter}`;
    const tab: Tab = { id, filePath, content, isDirty: false };
    this.tabs.push(tab);

    const el = document.createElement("div");
    el.className = "tab";
    el.dataset.tabId = id;
    el.innerHTML =
      `<span class="tab-dirty">\u25CF</span>` +
      `<span class="tab-title">${this.titleFor(filePath)}</span>` +
      `<span class="tab-close">\u00D7</span>`;

    el.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("tab-close")) {
        this.closeTab(id);
      } else {
        this.switchTo(id);
      }
    });

    this.container.appendChild(el);
    this.switchTo(id);
    return tab;
  }

  closeTab(id: string): void {
    const index = this.tabs.findIndex((t) => t.id === id);
    if (index === -1) return;

    // Remove DOM element
    const el = this.elementFor(id);
    if (el) el.remove();

    // Remove from array
    this.tabs.splice(index, 1);

    // If the closed tab was active, switch to an adjacent tab or signal all closed
    if (this.activeId === id) {
      this.activeId = null;
      if (this.tabs.length === 0) {
        this.callbacks.onAllClosed();
      } else {
        const nextIndex = index < this.tabs.length ? index : this.tabs.length - 1;
        this.switchTo(this.tabs[nextIndex].id);
      }
    }
  }

  switchTo(id: string): void {
    const newTab = this.tabs.find((t) => t.id === id);
    if (!newTab) return;

    const oldTab = this.activeId
      ? this.tabs.find((t) => t.id === this.activeId) ?? null
      : null;

    // Update DOM classes
    if (this.activeId) {
      const oldEl = this.elementFor(this.activeId);
      if (oldEl) oldEl.classList.remove("active");
    }
    const newEl = this.elementFor(id);
    if (newEl) newEl.classList.add("active");

    this.activeId = id;
    this.callbacks.onSwitch(newTab, oldTab);
  }

  getActive(): Tab {
    const tab = this.tabs.find((t) => t.id === this.activeId);
    if (!tab) throw new Error("No active tab");
    return tab;
  }

  updateContent(content: string): void {
    const tab = this.getActive();
    tab.content = content;
  }

  markDirty(dirty: boolean): void {
    const tab = this.getActive();
    tab.isDirty = dirty;
    const el = this.elementFor(tab.id);
    if (el) {
      if (dirty) {
        el.classList.add("dirty");
      } else {
        el.classList.remove("dirty");
      }
    }
  }

  markSaved(filePath: string): void {
    const tab = this.getActive();
    tab.filePath = filePath;
    const el = this.elementFor(tab.id);
    if (el) {
      const titleSpan = el.querySelector(".tab-title");
      if (titleSpan) titleSpan.textContent = this.titleFor(filePath);
    }
    this.markDirty(false);
  }

  findByPath(filePath: string): Tab | null {
    return this.tabs.find((t) => t.filePath === filePath) ?? null;
  }

  private titleFor(filePath: string | null): string {
    if (!filePath) return "Untitled";
    return filePath.split(/[\\/]/).pop() || "Untitled";
  }

  private elementFor(id: string): HTMLElement | null {
    return this.container.querySelector(`[data-tab-id="${id}"]`);
  }
}
