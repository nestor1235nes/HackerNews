import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, Box, CircularProgress, Link, Pagination, Paper, Stack, Typography } from '@mui/material'
import CommentTree from '../components/CommentTree'
import { getStoryWithComments } from '../services/hackerNewsApi'

const COMMENTS_PAGE_SIZE = 50

function StoryCommentsPage() {
  const { id } = useParams()
  const [story, setStory] = useState(null)
  const [comments, setComments] = useState([])
  const [truncated, setTruncated] = useState(false)
  const [loadedComments, setLoadedComments] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [id])

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = isMobile || prefersReducedMotion ? 'auto' : 'smooth'

    window.scrollTo({ top: 0, left: 0, behavior })
  }, [page])

  useEffect(() => {
    let cancelled = false

    async function loadStory() {
      setLoading(true)
      setError('')

      try {
        const payload = await getStoryWithComments(id)

        if (!cancelled) {
          setStory(payload.story)
          setComments(payload.comments)
          setTruncated(payload.truncated)
          setLoadedComments(payload.loadedComments)
        }
      } catch (requestError) {
        if (!cancelled) {
          setStory(null)
          setComments([])
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
  }, [id])

  const totalCommentPages = Math.ceil(comments.length / COMMENTS_PAGE_SIZE)
  const startIndex = (page - 1) * COMMENTS_PAGE_SIZE
  const pagedComments = comments.slice(startIndex, startIndex + COMMENTS_PAGE_SIZE)
  const firstCommentNumber = comments.length === 0 ? 0 : startIndex + 1
  const lastCommentNumber = comments.length === 0 ? 0 : startIndex + pagedComments.length

  function handleCommentsPageChange(_event, nextPage) {
    setPage(nextPage)
  }

  function renderCommentsPagination(position) {
    if (totalCommentPages <= 1) {
      return null
    }

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Pagina {page} de {totalCommentPages} ({position})
          </Typography>
          <Pagination
            page={page}
            count={totalCommentPages}
            onChange={handleCommentsPageChange}
            color="primary"
            shape="rounded"
          />
        </Stack>
      </Box>
    )
  }

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Stack spacing={1.5}>
        <Typography component="h2" variant="h5" fontWeight={700} gutterBottom>
          Comentarios de Story
        </Typography>

        {loading ? <CircularProgress size={26} /> : null}
        {!loading && error ? <Alert severity="error">{error}</Alert> : null}

        {!loading && !error && story ? (
          <>
            <Typography variant="h6">{story.title}</Typography>
            <Typography color="text.secondary">Autor: {story.by}</Typography>
            <Typography color="text.secondary">Comentarios: {story.descendants}</Typography>
            {story.url ? (
              <Link href={story.url} target="_blank" rel="noreferrer" underline="hover">
                Abrir articulo original
              </Link>
            ) : null}

            <Typography color="text.secondary">
              Mostrando comentarios {firstCommentNumber}-{lastCommentNumber} de {comments.length}.
            </Typography>

            {renderCommentsPagination('arriba')}

            {truncated ? (
              <Alert severity="info">
                Se cargaron {loadedComments} comentarios por limite de seguridad para mantener buen rendimiento.
              </Alert>
            ) : null}

            <CommentTree comments={pagedComments} />
            {renderCommentsPagination('abajo')}
          </>
        ) : null}
      </Stack>
    </Paper>
  )
}

export default StoryCommentsPage
