import { memo, useMemo } from 'react'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { AppBar, Box, Container, Link, Toolbar, Typography } from '@mui/material'

const App = memo(function App() {
  const pageStyle = useMemo(() => ({ minHeight: '100vh', backgroundColor: '#f7f8fa' }), [])
  const toolbarStyle = useMemo(() => ({ display: 'flex', justifyContent: 'space-between' }), [])

  return (
    <Box sx={pageStyle}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={toolbarStyle}>
          <Typography component="h1" variant="h6" fontWeight={700}>
            Hacker News Explorer
          </Typography>
          <Link component={RouterLink} to="/top" underline="hover" color="inherit">
            Top Stories
          </Link>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  )
})

export default App
