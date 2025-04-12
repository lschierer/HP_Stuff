/**
 * SHARED CODE
 * This code runs on both client and server
 */

import { html, render } from "lit";

// Shared rendering logic that works on both client and server
export function renderApp(container?: HTMLElement) {
  const template = `
    <div class="app">
      <header>
        <h1>Vite + TypeScript + SSR</h1>
      </header>
      <main>
        <span>This is shared</span>
      </main>
    </div>
  `;

  if (container) {
    // Client-side rendering
    render(html`${template}`, container);
    return;
  } else {
    // Server-side rendering - return HTML string
    // Note: For a real SSR setup with Lit, you'd need a proper SSR renderer
    // This is simplified for demonstration
    return `<div id="app">${template}</div>`;
  }
}
