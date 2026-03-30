import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { useTopStories } from '../hooks/useTopStories'

const PAGE_SIZE = 50
const ALL_TOPICS_KEY = 'all'
const PAGE_SIZE_OPTIONS = [25, 50, 75, 100]

const GENERAL_TOPICS = [
  {
    id: 'ia-datos-ciencia',
    label: 'IA, Datos y Ciencia',
    keywords: [
      'ai', 'llm', 'gpt', 'openai', 'gemini', 'claude', 'anthropic', 'model', 'machine', 'learning',
      'neural', 'research', 'science', 'gpu', 'inference',
    ],
  },
  {
    id: 'software-ingenieria',
    label: 'Software e Ingeniería',
    keywords: [
      'software', 'engineering', 'developer', 'development', 'programming', 'code', 'coding', 'api',
      'javascript', 'typescript', 'react', 'python', 'rust', 'java', 'golang', 'go', 'github', 'gitlab',
      'copilot', 'linux', 'database', 'cloud', 'server', 'infrastructure', 'web',
    ],
  },
  {
    id: 'negocios-startups-actualidad',
    label: 'Negocios, Startups y Actualidad',
    keywords: [
      'startup', 'startups', 'founder', 'funding', 'business', 'market', 'economy', 'finance', 'policy',
      'government', 'law', 'health', 'education', 'society', 'jobs', 'career', 'work', 'remote', 'apple',
      'google', 'meta', 'microsoft', 'amazon', 'tesla',
    ],
  },
]

function formatUnixTime(unixSeconds) {
  if (!unixSeconds) {
    return 'sin fecha'
  }

  const now = Date.now()
  const diffMs = Math.max(0, now - unixSeconds * 1000)
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) {
    return 'hace menos de 1 hora'
  }

  if (diffHours < 24) {
    return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`
}

function getStoryDomain(url) {
  if (!url) {
    return 'news.ycombinator.com'
  }

  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'enlace externo'
  }
}

function normalizeToWords(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function normalizeToken(token) {
  if (!token) {
    return ''
  }

  let normalized = token

  if (normalized.endsWith('ies') && normalized.length > 4) {
    normalized = `${normalized.slice(0, -3)}y`
  } else if (normalized.endsWith('s') && normalized.length > 4) {
    normalized = normalized.slice(0, -1)
  }

  if (normalized.endsWith('ing') && normalized.length > 5) {
    normalized = normalized.slice(0, -3)
  }

  if (normalized.endsWith('ed') && normalized.length > 4) {
    normalized = normalized.slice(0, -2)
  }

  return normalized
}

function classifyStory(story) {
  const words = normalizeToWords(`${story?.title || ''} ${story?.url || ''} ${getStoryDomain(story?.url || '')}`)
  const normalizedWords = words.map((word) => normalizeToken(word))
  const scoreByTopic = GENERAL_TOPICS.map((topic) => ({ id: topic.id, score: 0 }))

  normalizedWords.forEach((word) => {
    if (!word) {
      return
    }

    scoreByTopic.forEach((entry, index) => {
      if (GENERAL_TOPICS[index].keywords.includes(word)) {
        entry.score += 1
      }
    })
  })

  scoreByTopic.sort((a, b) => b.score - a.score)

  if (scoreByTopic[0].score > 0) {
    return scoreByTopic[0].id
  }

  return 'software-ingenieria'
}

function buildGeneralTopics(items) {
  const topicStoryIdsMap = new Map(GENERAL_TOPICS.map((topic) => [topic.id, new Set()]))

  items.forEach((story) => {
    const topicId = classifyStory(story)
    topicStoryIdsMap.get(topicId)?.add(story.id)
  })

  return GENERAL_TOPICS.map((topic) => ({
    id: topic.id,
    label: topic.label,
    count: topicStoryIdsMap.get(topic.id)?.size || 0,
    storyIds: topicStoryIdsMap.get(topic.id) || new Set(),
  }))
}

function TopPage() {
  const { items, allItems, loading, error, page, setPage, totalStories } = useTopStories()
  const [searchParams, setSearchParams] = useSearchParams()
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [sortBy, setSortBy] = useState('puntos')
  const [dateDirection, setDateDirection] = useState('desc')
  const [pointsDirection, setPointsDirection] = useState('desc')

  const sourceItems = allItems.length > 0 ? allItems : items
  const trendingTopics = useMemo(() => buildGeneralTopics(sourceItems), [sourceItems])

  const topicsById = useMemo(
    () => new Map(trendingTopics.map((topic) => [topic.id, topic])),
    [trendingTopics],
  )

  const rawTopic = searchParams.get('topic')
  const selectedTopic = rawTopic && topicsById.has(rawTopic) ? rawTopic : ALL_TOPICS_KEY
  const selectedTopicData = selectedTopic === ALL_TOPICS_KEY ? null : topicsById.get(selectedTopic)

  const filteredItems = useMemo(() => {
    if (selectedTopic === ALL_TOPICS_KEY || !selectedTopicData) {
      return sourceItems
    }

    return sourceItems.filter((story) => selectedTopicData.storyIds.has(story.id))
  }, [sourceItems, selectedTopic, selectedTopicData])

  const sortedItems = useMemo(() => {
    const itemsToSort = [...filteredItems]
    const activeDirection = sortBy === 'fecha' ? dateDirection : pointsDirection
    const multiplier = activeDirection === 'asc' ? 1 : -1

    itemsToSort.sort((a, b) => {
      const aValue = sortBy === 'fecha' ? Number(a?.time || 0) : Number(a?.score || 0)
      const bValue = sortBy === 'fecha' ? Number(b?.time || 0) : Number(b?.score || 0)

      return (aValue - bValue) * multiplier
    })

    return itemsToSort
  }, [filteredItems, sortBy, dateDirection, pointsDirection])

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return sortedItems.slice(startIndex, startIndex + pageSize)
  }, [sortedItems, page, pageSize])

  const filteredTotalPages = useMemo(() => {
    if (sortedItems.length === 0) {
      return 0
    }

    return Math.ceil(sortedItems.length / pageSize)
  }, [sortedItems.length, pageSize])

  const isSidebarLoading = loading

  useEffect(() => {
    setPage(1)
  }, [pageSize, sortBy, dateDirection, pointsDirection, setPage])

  useEffect(() => {
    if (filteredTotalPages > 0 && page > filteredTotalPages) {
      setPage(filteredTotalPages)
    }
  }, [filteredTotalPages, page, setPage])

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = isMobile || prefersReducedMotion ? 'auto' : 'smooth'

    window.scrollTo({ top: 0, left: 0, behavior })
  }, [page, selectedTopic])

  function handlePageChange(_event, nextPage) {
    setPage(nextPage)
  }

  function handleTopicFilter(topicId) {
    setPage(1)

    if (topicId === ALL_TOPICS_KEY) {
      setSearchParams({})
      return
    }

    setSearchParams({ topic: topicId })
  }

  function handleSortByDate() {
    if (sortBy !== 'fecha') {
      setSortBy('fecha')
      return
    }

    setDateDirection((previous) => (previous === 'desc' ? 'asc' : 'desc'))
  }

  function handleSortByPoints() {
    if (sortBy !== 'puntos') {
      setSortBy('puntos')
      return
    }

    setPointsDirection((previous) => (previous === 'desc' ? 'asc' : 'desc'))
  }

  function renderPaginationOnly() {
    const showPagination = filteredTotalPages > 1

    if (!showPagination) {
      return null
    }

    return (
      <Box className="forum-feed-controls">
        <Stack direction="row" justifyContent="flex-end">
          <Pagination
            page={page}
            count={filteredTotalPages}
            onChange={handlePageChange}
            shape="rounded"
            size="large"
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#49515a',
                borderColor: '#d9d2cc',
              },
              '& .Mui-selected': {
                backgroundColor: '#e86a18 !important',
                color: '#fff',
              },
            }}
          />
        </Stack>
      </Box>
    )
  }

  return (
    <Box className="forum-layout">
      <Stack spacing={2} className="forum-main-column">
        <Paper elevation={0} className="forum-card forum-feed-card">
          <Box className="forum-feed-top-panel">
            <Stack spacing={0.65}>
              <Typography component="h2" className="forum-feed-title">
                {selectedTopic === ALL_TOPICS_KEY ? 'Novedades' : selectedTopicData?.label || 'Novedades'}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {selectedTopic === ALL_TOPICS_KEY
                  ? `Mostrando ${paginatedItems.length} artículos en la página actual de ${totalStories}.`
                  : `Mostrando ${paginatedItems.length} artículos de ${sortedItems.length} en este tema.`}
              </Typography>
            </Stack>

            {renderPaginationOnly()}
          </Box>

          {loading ? (
            <Box sx={{ py: 7, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress sx={{ color: '#e86a18' }} />
            </Box>
          ) : null}

          {!loading && error ? <Alert severity="warning">{error}</Alert> : null}

          {!loading && !error && sortedItems.length === 0 ? (
            <Alert severity="info">No hay historias disponibles en este momento.</Alert>
          ) : null}

          {!loading
            ? paginatedItems.map((story, index) => {
                const canOpenUrl = story.type === 'story' && Boolean(story.url)
                const number = (page - 1) * pageSize + index + 1

                return (
                  <Box key={story.id} className="forum-story-row">
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Typography className="forum-story-rank">{number}</Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography className="forum-story-title" component="h3">
                          {canOpenUrl ? (
                            <Link
                              href={story.url}
                              target="_blank"
                              rel="noreferrer"
                              underline="none"
                              color="inherit"
                            >
                              {story.title}
                            </Link>
                          ) : (
                            story.title
                          )}
                        </Typography>

                        <Typography className="forum-story-domain" variant="body2">
                          {getStoryDomain(story.url)}
                        </Typography>

                        <Typography className="forum-story-meta" variant="body2">
                          <Box component="span" className="forum-story-points">
                            {story.score} puntos
                          </Box>
                          {' por '}
                          {story.by}
                          {' '}
                          {formatUnixTime(story.time)}
                          {' | '}
                          <Link
                            component={RouterLink}
                            to={`/story/${story.id}`}
                            underline="none"
                            className="forum-story-comments-link"
                          >
                            {story.descendants} comentarios
                          </Link>
                        </Typography>
                      </Box>
                    </Stack>
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                )
              })
            : null}

          {!loading ? renderPaginationOnly() : null}
        </Paper>
      </Stack>

      <Stack spacing={2} className="forum-side-column">
        <Paper
          elevation={0}
          className={`forum-card forum-side-card forum-trending-card ${isSidebarLoading ? 'is-loading' : ''}`}
          aria-busy={isSidebarLoading}
        >
          <Typography variant="h6" className="forum-side-title">
            Temas en tendencia
          </Typography>
          <Stack component="ul" className="forum-side-list">
            <Box component="li">
              <Button
                variant={selectedTopic === ALL_TOPICS_KEY ? 'contained' : 'text'}
                className="forum-topic-btn"
                onClick={() => handleTopicFilter(ALL_TOPICS_KEY)}
                disabled={isSidebarLoading}
              >
                Todos los temas ({totalStories})
              </Button>
            </Box>
            {trendingTopics.map((topic) => (
              <Box component="li" key={topic.id}>
                <Button
                  variant={selectedTopic === topic.id ? 'contained' : 'text'}
                  className="forum-topic-btn"
                  onClick={() => handleTopicFilter(topic.id)}
                  disabled={isSidebarLoading}
                >
                  {topic.label} ({topic.count})
                </Button>
              </Box>
            ))}
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          className={`forum-card forum-side-card forum-filter-card ${isSidebarLoading ? 'is-loading' : ''}`}
          aria-busy={isSidebarLoading}
        >
          <Typography variant="h6" className="forum-side-title">
            Filtros de noticias
          </Typography>

          <Stack spacing={1.2} className="forum-sidebar-filter-controls">
            <FormControl size="small" fullWidth disabled={isSidebarLoading}>
              <InputLabel id="news-per-page-label">Noticias por página</InputLabel>
              <Select
                labelId="news-per-page-label"
                id="news-per-page"
                value={String(pageSize)}
                label="Noticias por página"
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={String(option)}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant={sortBy === 'fecha' ? 'contained' : 'outlined'}
              onClick={handleSortByDate}
              className={`forum-sort-toggle ${sortBy === 'fecha' ? 'is-active' : ''}`}
              disabled={isSidebarLoading}
            >
              Fecha {dateDirection === 'asc' ? '↑' : '↓'}
            </Button>

            <Button
              variant={sortBy === 'puntos' ? 'contained' : 'outlined'}
              onClick={handleSortByPoints}
              className={`forum-sort-toggle ${sortBy === 'puntos' ? 'is-active' : ''}`}
              disabled={isSidebarLoading}
            >
              Puntos {pointsDirection === 'asc' ? '↑' : '↓'}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}

export default TopPage
