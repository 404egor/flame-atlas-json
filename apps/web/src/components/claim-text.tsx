import type { Claim } from "@/generated/contract";

/**
 * The only way a statement from a card reaches the screen (architecture rule AD-8):
 * the text is always followed by its sources.
 */
const normalize = (text: string) => text.replace(/\s+/g, " ").trim().toLowerCase();

export function ClaimText({ claim }: { claim: Claim }) {
  const text = normalize(claim.text);
  return (
    <div>
      <p className="text-fg">{claim.text}</p>
      <ul className="mt-1 space-y-1 text-xs text-fg-subtle">
        {claim.citations.map((citation, index) => (
          <li key={`${citation.url}-${index}`}>
            <span>Source: </span>
            <a
              href={citation.url}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-line-strong underline-offset-2 hover:text-fg"
            >
              {citation.label}
            </a>
            {/* A quote that repeats the text above word for word adds nothing: the link is enough. */}
            {citation.quote && normalize(citation.quote) !== text ? (
              <q className="ml-1 italic">{citation.quote}</q>
            ) : citation.quote ? (
              <span className="ml-1">(quoted word for word)</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
