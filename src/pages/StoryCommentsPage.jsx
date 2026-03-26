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

  function renderCommentsPagination() {
    if (totalCommentPages <= 1) {
      return null
    }

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <Pagination
          page={page}
          count={totalCommentPages}
          onChange={handleCommentsPageChange}
          shape="rounded"
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
      </Box>
    )
  }

  return (
    <Paper elevation={0} className="forum-card" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={1.5}>
        <Typography component="h2" variant="h5" fontWeight={700} gutterBottom color="#2a2f36">
          Comentarios de la historia
        </Typography>

        {loading ? <CircularProgress size={26} sx={{ color: '#e86a18' }} /> : null}
        {!loading && error ? <Alert severity="error">{error}</Alert> : null}

        {!loading && !error && story ? (
          <>
            <Typography variant="h6" color="#2a2f36">{story.title}</Typography>
            <Typography color="text.secondary">Autor: {story.by}</Typography>
            <Typography color="text.secondary">Comentarios: {story.descendants}</Typography>
            {story.url ? (
              <Link href={story.url} target="_blank" rel="noreferrer" underline="hover" color="#e86a18">
                Abrir artículo original
              </Link>
            ) : null}

            <Typography color="text.secondary">
              Mostrando comentarios {firstCommentNumber}-{lastCommentNumber} de {comments.length}.
            </Typography>

            {renderCommentsPagination()}

            {truncated ? (
              <Alert severity="info">
                Se cargaron {loadedComments} comentarios por un límite de seguridad para mantener buen rendimiento.
              </Alert>
            ) : null}

            <CommentTree comments={pagedComments} />
            {renderCommentsPagination()}
          </>
        ) : null}
      </Stack>
    </Paper>
  )
}

export default StoryCommentsPage
