import { memo } from 'react'
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'
import { Box, Container, Link, Stack, Typography } from '@mui/material'

const NAV_ITEMS = [
  { id: 'novedades', label: 'Novedades', href: '/top' },
]

const App = memo(function App() {
  const location = useLocation()
  const isTopRoute = location.pathname === '/top' || location.pathname === '/'

  return (
    <Box className="app-shell">
      <Box component="header" className="forum-header">
        <Container maxWidth="lg" className="forum-header__inner">
          <Typography component="h1" className="forum-title">
            TechNews Forum
          </Typography>

          <Stack component="nav" direction="row" spacing={2.5} className="forum-nav">
            {NAV_ITEMS.map((item) => {
              const isActive = isTopRoute && item.id === 'novedades'

              return (
                <Link
                  key={item.label}
                  component={RouterLink}
                  to={item.href}
                  underline="none"
                  className={`forum-nav__item ${isActive ? 'is-active' : ''}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Outlet />

        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="center"
          sx={{ mt: 2.5, color: '#6f7680', flexWrap: 'wrap' }}
        >
          <Link component={RouterLink} to="/top" underline="hover" color="inherit">
            Guías
          </Link>
          <Typography>|</Typography>
          <Link component={RouterLink} to="/top" underline="hover" color="inherit">
            FAQ
          </Link>
          <Typography>|</Typography>
          <Link component={RouterLink} to="/top" underline="hover" color="inherit">
            Contacto
          </Link>
          <Typography>|</Typography>
          <Link component={RouterLink} to="/top" underline="hover" color="inherit">
            Privacidad
          </Link>
          <Typography>|</Typography>
          <Link component={RouterLink} to="/top" underline="hover" color="inherit">
            Términos
          </Link>
        </Stack>
      </Container>
    </Box>
  )
})

export default App
