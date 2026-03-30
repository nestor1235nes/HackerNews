import { useEffect, useMemo, useState } from 'react'
import { getBestStoryIds, getItemsByIds } from '../services/hackerNewsApi'

const PAGE_SIZE = 50

export function useTopStories() {
  const [items, setItems] = useState([])
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [bestStoryIds, setBestStoryIds] = useState([])
  const [pageCache, setPageCache] = useState({})

  useEffect(() => {
    let cancelled = false

    async function loadBestStoryIds() {
      setLoading(true)
      setError('')

      try {
        const ids = await getBestStoryIds()

        if (!cancelled) {
          setBestStoryIds(ids)
          setAllItems([])
        }
      } catch (requestError) {
        if (!cancelled) {
          setItems([])
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible obtener datos en linea.',
          )
          setLoading(false)
        }
      }
    }

    loadBestStoryIds()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadAllStoriesForTopicAnalytics() {
      if (bestStoryIds.length === 0) {
        setAllItems([])
        return
      }

      try {
        const apiItems = await getItemsByIds(bestStoryIds)
        const normalizedItems = apiItems.filter((item) => item && item.id)

        if (!cancelled) {
          setAllItems(normalizedItems)
        }
      } catch {
        if (!cancelled) {
          setAllItems([])
        }
      }
    }

    loadAllStoriesForTopicAnalytics()

    return () => {
      cancelled = true
    }
  }, [bestStoryIds])

  useEffect(() => {
    let cancelled = false

    async function loadCurrentPage() {
      if (bestStoryIds.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      const cachedItems = pageCache[page]
      if (cachedItems) {
        setItems(cachedItems)
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const startIndex = (page - 1) * PAGE_SIZE
        const endIndex = startIndex + PAGE_SIZE
        const idsForPage = bestStoryIds.slice(startIndex, endIndex)
        const apiItems = await getItemsByIds(idsForPage)
        const normalizedItems = apiItems.filter((item) => item && item.id)

        if (!cancelled) {
          setItems(normalizedItems)
          setPageCache((previousCache) => ({
            ...previousCache,
            [page]: normalizedItems,
          }))
        }
      } catch (requestError) {
        if (!cancelled) {
          setItems([])
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible obtener datos en linea.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCurrentPage()

    return () => {
      cancelled = true
    }
  }, [bestStoryIds, page, pageCache])

  const totalStories = bestStoryIds.length
  const totalPages = useMemo(() => {
    if (totalStories === 0) {
      return 0
    }

    return Math.ceil(totalStories / PAGE_SIZE)
  }, [totalStories])

  return {
    items,
    allItems,
    loading,
    error,
    page,
    setPage,
    totalStories,
    totalPages,
  }
}
