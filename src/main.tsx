import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const rootEl = document.getElementById('root')!;

function showStartupError(err: unknown) {
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#0a0a0b;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:480px;text-align:center;">
        <h1 style="font-size:18px;font-weight:600;margin-bottom:8px;">Momentum couldn't start</h1>
        <p style="font-size:14px;color:#a1a1aa;line-height:1.5;">${err instanceof Error ? err.message : 'An unexpected error occurred during startup.'}</p>
      </div>
    </div>
  `;
  console.error(err);
}

import('./App.tsx')
  .then(({ default: App }) => {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch(showStartupError);
