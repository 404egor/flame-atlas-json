"use client";

/**
 * A script that runs while the browser parses the static HTML, before the first paint.
 *
 * It is a Client Component on purpose: in the HTML file the type is JavaScript, so the
 * browser runs it; when React renders it again in the browser the type is plain text,
 * so React does not warn about a script it would never execute.
 * Pattern from the Next.js guide "Preventing flash before hydration".
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
