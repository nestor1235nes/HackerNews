import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import CommentTree from '../components/CommentTree'
import { getCommentReplies, getStoryWithComments } from '../services/hackerNewsApi'

const DEFAULT_COMMENTS_PER_LOAD = 10
const COMMENTS_PER_LOAD_OPTIONS = [5, 10, 20, 30, 50]

function enhanceCommentForLazyReplies(comment) {
  const totalReplies = Array.isArray(comment.kids) ? comment.kids.length : 0

  return {
    ...comment,
    children: [],
    repliesTotal: totalReplies,
    repliesNextOffset: 0,
    repliesHasMore: totalReplies > 0,
  }
}

function updateCommentInTree(nodes, targetCommentId, updater) {
  return nodes.map((node) => {
    if (node.id === targetCommentId) {
      return updater(node)
    }

    if (!Array.isArray(node.children) || node.children.length === 0) {
      return node
    }

    return {
      ...node,
      children: updateCommentInTree(node.children, targetCommentId, updater),
    }
  })
}

function findCommentInTree(nodes, targetCommentId) {
  for (const node of nodes) {
    if (node.id === targetCommentId) {
      return node
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      const nestedComment = findCommentInTree(node.children, targetCommentId)
      if (nestedComment) {
        return nestedComment
      }
    }
  }

  return null
}

function StoryCommentsPage() {
  const { id } = useParams()
  const [story, setStory] = useState(null)
  const [comments, setComments] = useState([])
  const [totalRootComments, setTotalRootComments] = useState(0)
  const [nextOffset, setNextOffset] = useState(0)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const [loadedComments, setLoadedComments] = useState(0)
  const [commentsPerLoad, setCommentsPerLoad] = useState(DEFAULT_COMMENTS_PER_LOAD)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [loadMoreError, setLoadMoreError] = useState('')

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = isMobile || prefersReducedMotion ? 'auto' : 'smooth'

    window.scrollTo({ top: 0, left: 0, behavior })
  }, [id])

  useEffect(() => {
    let cancelled = false

    async function loadStory() {
      setLoading(true)
      setError('')

      try {
        const payload = await getStoryWithComments(id, {
          offset: 0,
          limit: commentsPerLoad,
          loadChildren: false,
        })

        if (!cancelled) {
          setStory(payload.story)
          setComments(payload.comments.map(enhanceCommentForLazyReplies))
          setTotalRootComments(payload.totalRootComments)
          setNextOffset(payload.nextOffset)
          setHasMoreComments(payload.hasMore)
          setTruncated(payload.truncated)
          setLoadedComments(payload.loadedComments)
          setLoadMoreError('')
        }
      } catch (requestError) {
        if (!cancelled) {
          setStory(null)
          setComments([])
          setTotalRootComments(0)
          setNextOffset(0)
          setHasMoreComments(false)
          setLoadMoreError('')
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible cargar la historia.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadStory()

    return () => {
      cancelled = true
    }
  }, [id, commentsPerLoad])

  async function handleLoadMoreComments() {
    if (!id || loadingMore || !hasMoreComments) {
      return
    }

    setLoadingMore(true)
    setLoadMoreError('')

    try {
      const payload = await getStoryWithComments(id, {
        offset: nextOffset,
        limit: commentsPerLoad,
        loadChildren: false,
      })

      setComments((previousComments) => [...previousComments, ...payload.comments])
      setTotalRootComments(payload.totalRootComments)
      setNextOffset(payload.nextOffset)
      setHasMoreComments(payload.hasMore)
      setTruncated(payload.truncated)
      setLoadedComments((previousLoadedComments) => previousLoadedComments + payload.loadedComments)
    } catch (requestError) {
      setLoadMoreError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible cargar mas comentarios en este momento.',
      )
    } finally {
      setLoadingMore(false)
    }
  }

  function handleCommentsPerLoadChange(event) {
    const nextValue = Number(event.target.value)
    setCommentsPerLoad(nextValue)
  }

  async function handleLoadReplies(commentId) {
    const comment = findCommentInTree(comments, commentId)
    if (!comment || !comment.repliesHasMore) {
      return
    }

    setComments((previousComments) => updateCommentInTree(
      previousComments,
      commentId,
      (node) => ({
        ...node,
        repliesLoading: true,
        repliesError: '',
      }),
    ))

    try {
      const payload = await getCommentReplies(commentId, {
        offset: comment.repliesNextOffset ?? 0,
        limit: commentsPerLoad,
        loadChildren: false,
      })

      const normalizedReplies = payload.replies.map(enhanceCommentForLazyReplies)

      setComments((previousComments) => updateCommentInTree(
        previousComments,
        commentId,
        (node) => ({
          ...node,
          children: [...(Array.isArray(node.children) ? node.children : []), ...normalizedReplies],
          repliesTotal: payload.totalReplies,
          repliesNextOffset: payload.nextOffset,
          repliesHasMore: payload.hasMore,
          repliesLoading: false,
          repliesError: '',
        }),
      ))
    } catch (requestError) {
      setComments((previousComments) => updateCommentInTree(
        previousComments,
        commentId,
        (node) => ({
          ...node,
          repliesLoading: false,
          repliesError:
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible cargar las respuestas en este momento.',
        }),
      ))
    }
  }

  return (
    <Paper elevation={0} className="forum-card forum-comments-page" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h5" fontWeight={700} color="#2a2f36">
          Comentarios de la historia
        </Typography>

        {loading ? (
          <Box className="forum-comments-loading">
            <CircularProgress size={28} sx={{ color: '#e86a18' }} />
            <Typography color="text.secondary">Cargando comentarios...</Typography>
          </Box>
        ) : null}
        {!loading && error ? <Alert severity="error">{error}</Alert> : null}

        {!loading && !error && story ? (
          <>
            <Box className="forum-comments-hero">
              <Typography className="forum-comments-story-title">{story.title}</Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" className="forum-comments-story-meta">
                <Typography component="span" className="forum-comments-chip">Autor: {story.by}</Typography>
                <Typography component="span" className="forum-comments-chip">
                  Comentarios totales: {story.descendants}
                </Typography>
                <Typography component="span" className="forum-comments-chip">
                  Comentarios principales: {totalRootComments}
                </Typography>
              </Stack>

              {story.url ? (
                <Link
                  href={story.url}
                  target="_blank"
                  rel="noreferrer"
                  underline="hover"
                  className="forum-comments-article-link"
                >
                  Abrir artículo original
                </Link>
              ) : null}
            </Box>

            <Box className="forum-comments-toolbar">
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
              >
                <FormControl size="small" sx={{ width: { xs: '100%', sm: 260 } }}>
                  <InputLabel id="comments-per-load-label">Comentarios por carga</InputLabel>
                  <Select
                    labelId="comments-per-load-label"
                    value={commentsPerLoad}
                    label="Comentarios por carga"
                    onChange={handleCommentsPerLoadChange}
                    disabled={loading || loadingMore}
                  >
                    {COMMENTS_PER_LOAD_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography color="text.secondary" className="forum-comments-counter">
                  Mostrando {comments.length} de {totalRootComments} comentarios principales
                </Typography>
              </Stack>
            </Box>

            <Divider />

            {truncated ? (
              <Alert severity="info">
                Se cargaron {loadedComments} comentarios por un límite de seguridad para mantener buen rendimiento.
              </Alert>
            ) : null}

            {loadMoreError ? <Alert severity="warning">{loadMoreError}</Alert> : null}

            <Box className="forum-comments-tree-wrap">
              <CommentTree comments={comments} onLoadReplies={handleLoadReplies} />
            </Box>

            {hasMoreComments ? (
              <Button
                variant="contained"
                onClick={handleLoadMoreComments}
                disabled={loadingMore}
                className="forum-comments-load-more"
              >
                {loadingMore ? 'Cargando comentarios...' : 'Ver mas comentarios'}
              </Button>
            ) : null}
          </>
        ) : null}
      </Stack>
    </Paper>
  )
}

export default StoryCommentsPage
