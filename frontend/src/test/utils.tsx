import { vi } from 'vitest';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

export function renderWithRouter(
  ui: React.ReactElement,
  opts?: { initialRoute?: string } & Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[opts?.initialRoute ?? '/']}>{children}</MemoryRouter>
    ),
    ...opts,
  });
}

export function setupFetchMock(routes: Record<string, { status?: number; body: unknown }>) {
  const mock = vi.fn((url: string) => {
    for (const [pattern, res] of Object.entries(routes)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: (res.status ?? 200) < 400,
          status: res.status ?? 200,
          json: () => Promise.resolve(res.body),
          text: () => Promise.resolve(JSON.stringify(res.body)),
        } as Response);
      }
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    } as Response);
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}
