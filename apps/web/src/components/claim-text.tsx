import type { Claim } from "@/generated/contract";

/**
 * The only way a statement from a card reaches the screen (architecture rule AD-8):
 * the text is always followed by its sources.
 */
export function ClaimText({ claim }: { claim: Claim }) {
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
            {citation.quote ? <q className="ml-1 italic">{citation.quote}</q> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
