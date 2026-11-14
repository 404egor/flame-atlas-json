/**
 * Base-path handling (architecture rule AD-9).
 *
 * The site is served from a sub-path on GitHub Pages. Internal links go through
 * next/link, which adds the base path by itself. Files in public/ do not get it
 * automatically, so every reference to one goes through assetPath().
 */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetPath(path: string): string {
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The routes of the site, in navigation order. */
export const ROUTES = [
  { href: "/", label: "Scenario" },
  { href: "/tests/", label: "Tests" },
  { href: "/coverage/", label: "Coverage" },
  { href: "/investigations/", label: "Investigations" },
  { href: "/methodology/", label: "Methodology" },
] as const;

export function investigationHref(id: string): string {
  return `/investigations/${id}/`;
}
