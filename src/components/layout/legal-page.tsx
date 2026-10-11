/**
 * Renders the owner's legal documents (src/content/legal) as structured blocks,
 * so the wording lives in one data file per document and the page only lays
 * it out. ALL-CAPS passages are kept as written: conspicuous disclaimers are a
 * deliberate part of the text.
 */
export type LegalBlock =
  | { type: "h2" | "h3"; text: string }
  | { type: "p"; text: string; label?: string }
  | { type: "ul" | "ol"; items: string[] }

/** Email addresses and URLs in the text become links. */
function linkify(text: string) {
  return text.split(/(\S+@\S+\.\w+|https?:\/\/\S+)/g).map((part, index) => {
    if (/^\S+@\S+\.\w+$/.test(part)) {
      return (
        <a key={index} href={`mailto:${part}`} className="text-primary hover:underline">
          {part}
        </a>
      )
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={index} href={part} className="text-primary hover:underline">
          {part}
        </a>
      )
    }
    return part
  })
}

export function LegalPage({
  title,
  effective,
  blocks,
}: {
  title: string
  effective: string[]
  blocks: LegalBlock[]
}) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1 pb-2">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {effective.map((line) => (
          <p key={line} className="text-sm text-muted-foreground">
            {line}
          </p>
        ))}
      </header>

      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={index} className="pt-4 text-lg font-semibold text-foreground">
                {block.text}
              </h2>
            )
          case "h3":
            return (
              <h3 key={index} className="pt-1 text-base font-semibold text-foreground">
                {block.text}
              </h3>
            )
          case "ul":
          case "ol": {
            const List = block.type === "ul" ? "ul" : "ol"
            return (
              <List
                key={index}
                className={`flex flex-col gap-1 pl-6 text-sm leading-relaxed text-muted-foreground ${
                  block.type === "ul" ? "list-disc" : "list-decimal"
                }`}
              >
                {block.items.map((item) => (
                  <li key={item}>{linkify(item)}</li>
                ))}
              </List>
            )
          }
          default:
            return (
              <p key={index} className="text-sm leading-relaxed text-muted-foreground">
                {block.label && (
                  <span className="font-semibold text-foreground">{block.label}: </span>
                )}
                {linkify(block.text)}
              </p>
            )
        }
      })}
    </article>
  )
}
