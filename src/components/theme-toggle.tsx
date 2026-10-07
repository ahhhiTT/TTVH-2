"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cx } from "./ui";

export const THEME_COOKIE = "ttvh2_theme";
type Theme = "light" | "dark";

// The effective theme: an explicit choice on <html data-theme>, else the OS setting.
function readTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

// Applied directly to <html> (no re-render needed) and saved so the server
// renders the same theme on the next request — no flash.
function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function ThemeToggle({ labels, className }: { labels: { light: string; dark: string }; className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => null);

  return (
    <div role="group" className={cx("flex rounded-md border border-hairline-strong p-0.5", className)}>
      {(
        [
          ["light", Sun, labels.light],
          ["dark", Moon, labels.dark],
        ] as const
      ).map(([value, Icon, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => applyTheme(value)}
          aria-pressed={theme === value}
          aria-label={label}
          title={label}
          className={cx(
            "flex h-8 w-8 items-center justify-center rounded-sm",
            theme === value ? "bg-primary text-on-primary" : "text-body hover:text-ink",
          )}
        >
          <Icon size={15} aria-hidden />
        </button>
      ))}
    </div>
  );
}
