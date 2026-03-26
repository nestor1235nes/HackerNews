import { normalizeNewsItem, normalizeNewsItems } from '../models/newsItem'

const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0'
const BEST_STORIES_CACHE_KEY = 'hn-best-story-ids'
const ITEM_CACHE_KEY = 'hn-items-cache'

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readJsonFromStorage(key, fallbackValue) {
  if (!hasLocalStorage()) {
    return fallbackValue
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) {
      return fallbackValue
    }

    return JSON.parse(rawValue)
  } catch {
    return fallbackValue
  }
}

function writeJsonToStorage(key, value) {
  if (!hasLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage write failures to avoid blocking API usage.
  }
}

function readCachedItemById(id) {
  const cache = readJsonFromStorage(ITEM_CACHE_KEY, {})
  if (!cache || typeof cache !== 'object') {
    return null
  }

  const rawItem = cache[String(id)]
  return rawItem ? normalizeNewsItem(rawItem) : null
}

function saveCachedItem(item) {
  if (!item || !item.id) {
    return
  }

  const cache = readJsonFromStorage(ITEM_CACHE_KEY, {})
  const nextCache = {
    ...cache,
    [String(item.id)]: item,
  }

  writeJsonToStorage(ITEM_CACHE_KEY, nextCache)
}

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}/${path}`)

  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar Hacker News API`) 
  }

  return response.json()
}

export async function getBestStoryIds() {
  try {
    const ids = await getJson('beststories.json')
    const normalizedIds = Array.isArray(ids) ? ids : []
    writeJsonToStorage(BEST_STORIES_CACHE_KEY, normalizedIds)
    return normalizedIds
  } catch (networkError) {
    const cachedIds = readJsonFromStorage(BEST_STORIES_CACHE_KEY, [])
    if (Array.isArray(cachedIds) && cachedIds.length > 0) {
      return cachedIds
    }

    throw networkError
  }
}

export async function getItemById(id) {
  try {
    const item = await getJson(`item/${id}.json`)
    const normalizedItem = normalizeNewsItem(item)
    saveCachedItem(normalizedItem)
    return normalizedItem
  } catch (networkError) {
    const cachedItem = readCachedItemById(id)
    if (cachedItem) {
      return cachedItem
    }

    throw networkError
  }
}

export async function getItemsByIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return []
  }

  const results = await Promise.allSettled(ids.map((id) => getItemById(id)))
  const items = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)

  if (items.length === 0) {
    const firstRejected = results.find((result) => result.status === 'rejected')
    if (firstRejected && firstRejected.reason) {
      throw firstRejected.reason
    }
  }

  return normalizeNewsItems(items)
}

async function buildCommentNode(id, context) {
  if (!id || context.visited.has(id) || context.loadedCount >= context.maxNodes) {
    return null
  }

  try {
    context.visited.add(id)
    context.loadedCount += 1

    const comment = await getItemById(id)
    const childIds = Array.isArray(comment.kids) ? comment.kids : []
    const childNodes = await Promise.all(childIds.map((childId) => buildCommentNode(childId, context)))

    return {
      ...comment,
      children: childNodes.filter(Boolean),
    }
  } catch {
    return null
  }
}

export async function getStoryWithComments(storyId, options = {}) {
  const maxNodes = Number(options.maxNodes ?? 400)
  const story = await getItemById(storyId)
  const context = {
    visited: new Set(),
    loadedCount: 0,
    maxNodes,
  }

  const rootCommentIds = Array.isArray(story.kids) ? story.kids : []
  const comments = await Promise.all(rootCommentIds.map((commentId) => buildCommentNode(commentId, context)))

  return {
    story,
    comments: comments.filter(Boolean),
    truncated: context.loadedCount >= maxNodes,
    loadedComments: context.loadedCount,
  }
}
