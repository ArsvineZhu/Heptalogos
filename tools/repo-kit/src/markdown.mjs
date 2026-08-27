const LINK_PATTERN = /\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^)]*["'])?\)/gu;

function stripFencedCode(text) {
  return text.replace(/```[\s\S]*?```/gu, "");
}

export function markdownLinks(source, { ignoreFencedCode = false } = {}) {
  const links = [];
  const text = ignoreFencedCode ? stripFencedCode(source) : source;
  for (const match of text.matchAll(LINK_PATTERN)) {
    let target = match[1];
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1);
    }
    if (
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("mailto:") ||
      target.startsWith("#")
    ) {
      continue;
    }
    const path = target.split("#", 1)[0];
    if (path) links.push({ target: path });
  }
  return links;
}

export function markdownTargets(source, options) {
  return markdownLinks(source, options).map(({ target }) => target);
}

export function section(source, heading) {
  const marker = `## ${heading}`;
  const start = source.indexOf(marker);
  if (start < 0) return "";
  const body = source.slice(start + marker.length);
  const nextHeading = body.search(/^##\s+/mu);
  return nextHeading < 0 ? body : body.slice(0, nextHeading);
}
