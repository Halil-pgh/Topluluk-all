import * as React from 'react';
import { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu'
import AdbIcon from '@mui/icons-material/Adb';
import apiClient from './api';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

function ResponsiveAppBar() {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const [username, setUsername] = useState<string>('')
  const [profilePicture, setProfilePicture] = useState<string>('')
  const navigate = useNavigate()

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleDrawerOpen = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };


  useEffect(() => {
    if (!isAuthenticated)
      return
    apiClient.get('my_profile/')
      .then((response) => {
        setProfilePicture(response.data.image)
        apiClient.get(response.data.user)
          .then((response) => {
            setUsername(response.data.username)
          })
      })
      .catch((error) => {
        console.error(error)
      })
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
  }

  const handleLogin = () => {
    navigate('/login')
  }

  const handleSignUp = () => {
    navigate('/sign_up')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  const handleHome = () => {
    navigate('/')
  }

  const handleCommunities = () => {
    navigate('/communities')
  }

  const handleCreateCommunity = () => {
    navigate('/create_community')
  }

  const list = () => (
    <Box
      sx={{ width: 250 }}
      role='presentation'
      onClick={handleDrawerClose}
      onKeyDown={handleDrawerClose}
    >
      <List>
        <ListItem key='Home' disablePadding>
          <ListItemButton onClick={handleHome}>
            <ListItemText primary='Home' />
          </ListItemButton>
        </ListItem>
        <ListItem key='Communities' disablePadding>
          <ListItemButton onClick={handleCommunities}>
            <ListItemText primary='Communities' />
          </ListItemButton>
        </ListItem>
        <ListItem key='Create Community' disablePadding>
          <ListItemButton onClick={handleCreateCommunity}>
            <ListItemText primary='Create Community' />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <>
    <AppBar position="fixed" sx={{ left: 0, right: 0, top: 0 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <IconButton
            size='large'
            edge='start'
            color='inherit'
            aria-label='menu'
            sx={{ mr: 2 }}
            onClick={handleDrawerOpen}
          >
            <MenuIcon />
          </IconButton>
          <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            TOPLULUK
          </Typography>

          <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            LOGO
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }} />
          <Box sx={{ flexGrow: 0 }}>
            { isAuthenticated ? (
              <>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar alt={username} src={profilePicture} />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem key='Profile' onClick={handleProfile}>
                    <Typography sx={{ textAlign: 'center' }}>Profile</Typography>
                  </MenuItem>
                  <MenuItem key='Logout' onClick={handleLogout}>
                    <Typography sx={{ textAlign: 'center' }}>Logout</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box>
                <Button color='inherit' onClick={handleLogin}>Login</Button>
                <Button color='inherit' onClick={handleSignUp}>Sign Up</Button>
              </Box>
            ) }
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
    <Drawer
      anchor='left'
      open={isDrawerOpen}
      onClose={handleDrawerClose}
    >
      {list()}
    </Drawer>
    </>
  );
}
export default ResponsiveAppBar;