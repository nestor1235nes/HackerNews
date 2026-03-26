export function normalizeNewsItem(rawItem = {}) {
  return {
    id: Number(rawItem.id ?? 0),
    type: rawItem.type ?? 'unknown',
    title: rawItem.title ?? '(sin titulo)',
    by: rawItem.by ?? 'anon',
    time: Number(rawItem.time ?? 0),
    score: Number(rawItem.score ?? 0),
    url: rawItem.url ?? null,
    descendants: Number(rawItem.descendants ?? 0),
    kids: Array.isArray(rawItem.kids) ? rawItem.kids : [],
    text: rawItem.text ?? '',
    deleted: Boolean(rawItem.deleted),
    dead: Boolean(rawItem.dead),
  }
}

export function normalizeNewsItems(rawItems = []) {
  if (!Array.isArray(rawItems)) {
    return []
  }

  return rawItems.map((item) => normalizeNewsItem(item))
}
