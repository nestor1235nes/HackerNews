import { Link as RouterLink } from 'react-router-dom'
import { useEffect } from 'react'
import {
  Alert,
  CircularProgress,
  Link,
  List,
  ListItem,
  ListItemText,
  Pagination,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useTopStories } from '../hooks/useTopStories'

const PAGE_SIZE = 50

function formatUnixTime(unixSeconds) {
  if (!unixSeconds) {
    return 'sin fecha'
  }

  return new Date(unixSeconds * 1000).toLocaleString('es-CL')
}

function TopPage() {
  const { items, loading, error, page, setPage, totalStories, totalPages } = useTopStories()

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = isMobile || prefersReducedMotion ? 'auto' : 'smooth'

    window.scrollTo({ top: 0, left: 0, behavior })
  }, [page])

  const firstItemNumber = items.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastItemNumber = items.length === 0 ? 0 : firstItemNumber + items.length - 1

  function handlePageChange(_event, nextPage) {
    setPage(nextPage)
  }

  function renderPagination(position) {
    if (totalPages <= 1) {
      return null
    }

    return (
      <Paper elevation={1} sx={{ p: 2 }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Pagina {page} de {totalPages} ({position})
          </Typography>
          <Pagination
            page={page}
            count={totalPages}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="large"
          />
        </Stack>
      </Paper>
    )
  }

  return (
    <Stack spacing={2}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography component="h2" variant="h5" fontWeight={700} gutterBottom>
          Top Stories
        </Typography>
        <Typography color="text.secondary">
          Mostrando articulos {firstItemNumber}-{lastItemNumber} de {totalStories} desde la API publica.
        </Typography>
      </Paper>

      {renderPagination('arriba')}

      {loading ? (
        <Paper elevation={1} sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      ) : null}

      {!loading && error ? <Alert severity="warning">{error}</Alert> : null}

      {!loading && !error && items.length === 0 ? (
        <Alert severity="info">No hay historias disponibles en este momento.</Alert>
      ) : null}

      {!loading ? (
        <Paper elevation={1}>
          <List disablePadding>
            {items.map((story) => {
              const canOpenUrl = story.type === 'story' && Boolean(story.url)

              return (
                <ListItem key={story.id} divider alignItems="flex-start">
                  <ListItemText
                    primary={
                      canOpenUrl ? (
                        <Link href={story.url} target="_blank" rel="noreferrer" underline="hover">
                          {story.title}
                        </Link>
                      ) : (
                        story.title
                      )
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          por {story.by} - score {story.score}
                        </Typography>
                        {' | '}
                        {formatUnixTime(story.time)}
                        {' | '}
                        <Link component={RouterLink} to={`/story/${story.id}`} underline="hover">
                          comentarios ({story.descendants})
                        </Link>
                      </>
                    }
                  />
                </ListItem>
              )
            })}
          </List>
        </Paper>
      ) : null}

      {!loading ? renderPagination('abajo') : null}
    </Stack>
  )
}

export default TopPage
