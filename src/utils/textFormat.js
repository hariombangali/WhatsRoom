const TOKEN_REGEX = /(\*[^\*\n]+\*|_[^_\n]+_|~[^~\n]+~|\|\|[^|\n]+\|\|)/g;

export function parseFormattedSegments(text) {
  const value = String(text || "");
  if (!value) return [];

  const parts = value.split(TOKEN_REGEX).filter((s) => s !== undefined && s !== "");
  const segments = [];

  for (const part of parts) {
    if (part.startsWith("**") && part.length > 2) {
      segments.push({ type: "text", value: part });
      continue;
    }

    if (part.length >= 2 && part.startsWith("*") && part.endsWith("*")) {
      segments.push({ type: "bold", value: part.slice(1, -1) });
    } else if (part.length >= 2 && part.startsWith("_") && part.endsWith("_")) {
      segments.push({ type: "italic", value: part.slice(1, -1) });
    } else if (part.length >= 2 && part.startsWith("~") && part.endsWith("~")) {
      segments.push({ type: "strike", value: part.slice(1, -1) });
    } else if (part.length >= 4 && part.startsWith("||") && part.endsWith("||")) {
      segments.push({ type: "spoiler", value: part.slice(2, -2) });
    } else {
      segments.push({ type: "text", value: part });
    }
  }

  return segments;
}
