import { memo, useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Button, Paper, Stack, Typography } from '@mui/material'

const NotFoundPage = memo(function NotFoundPage() {
  const description = useMemo(() => 'La ruta que intentaste abrir no existe.', [])
  const buttonStyle = useMemo(() => ({ width: 'fit-content' }), [])

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h5" fontWeight={700}>
          404 - Pagina no encontrada
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
        <Button component={RouterLink} to="/top" variant="contained" sx={buttonStyle}>
          Volver a Top Stories
        </Button>
      </Stack>
    </Paper>
  )
})

export default NotFoundPage
