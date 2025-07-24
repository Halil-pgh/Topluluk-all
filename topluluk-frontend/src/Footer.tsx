import { Box, Container, Typography, Link, Grid, IconButton, Divider, Stack } from '@mui/material';
import { GitHub, Instagram, Twitter, LinkedIn, Email, LocationOn } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'grey.900',
        color: 'text.primary',
        pt: 6,
        pb: 3,
        mt: 8,
        position: 'relative',
        borderTop: '1px solid',
        borderColor: 'divider',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(144, 202, 249, 0.3), transparent)',
          zIndex: 1
        }
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 2,
                  fontFamily: 'monospace',
                  letterSpacing: '.2rem'
                }}
              >
                TOPLULUK
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary', 
                  mb: 3, 
                  lineHeight: 1.6 
                }}
              >
                Connecting communities, fostering relationships, and building the future together. Join us in creating meaningful connections.
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton
                  href='https://www.instagram.com/halil.pgh/'
                  target='_blank'
                  sx={{
                    color: 'text.secondary',
                    backgroundColor: 'action.hover',
                    '&:hover': { 
                      backgroundColor: 'action.selected',
                      color: 'primary.main',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Instagram />
                </IconButton>
                <IconButton 
                  href="https://github.com/Halil-pgh/"
                  target="_blank"
                  sx={{ 
                    color: 'text.secondary',
                    backgroundColor: 'action.hover',
                    '&:hover': { 
                      backgroundColor: 'action.selected',
                      color: 'primary.main',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <GitHub />
                </IconButton>
                <IconButton
                  href='https://www.linkedin.com/in/halil-ibrahim-%C3%B6zt%C3%BCrk-8b7a33283/'
                  target='_blank'
                  sx={{ 
                    color: 'text.secondary',
                    backgroundColor: 'action.hover',
                    '&:hover': { 
                      backgroundColor: 'action.selected',
                      color: 'primary.main',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <LinkedIn />
                </IconButton>
              </Stack>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 2, 
                color: 'text.primary',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: '30px',
                  height: '2px',
                  backgroundColor: 'primary.main',
                  borderRadius: '1px'
                }
              }}
            >
              Quick Links
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 3 }}>
              {['About Us', 'Features', 'Pricing', 'Blog', 'Help Center'].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase().replace(' ', '-')}`}
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(8px)',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {item}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Services */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 2, 
                color: 'text.primary',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: '30px',
                  height: '2px',
                  backgroundColor: 'primary.main',
                  borderRadius: '1px'
                }
              }}
            >
              Services
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 3 }}>
              {['Community Building', 'Event Management', 'Networking', 'Support', 'Analytics'].map((item) => (
                <Link
                  key={item}
                  href="#"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(8px)',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {item}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Legal */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 2, 
                color: 'text.primary',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: '30px',
                  height: '2px',
                  backgroundColor: 'primary.main',
                  borderRadius: '1px'
                }
              }}
            >
              Legal
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 3 }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Licenses'].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateX(8px)',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {item}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Contact */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 2, 
                color: 'text.primary',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: '30px',
                  height: '2px',
                  backgroundColor: 'primary.main',
                  borderRadius: '1px'
                }
              }}
            >
              Contact
            </Typography>
            <Stack spacing={2} sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  topluluk.help@gmail.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Ankara, Turkey
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'divider' }} />

        {/* Bottom Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            © 2025 Topluluk. All rights reserved. Made with ❤️ in Turkey
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link 
              href="/status" 
              sx={{ 
                color: 'text.secondary', 
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s ease',
                '&:hover': { color: 'primary.main' }
              }}
            >
              System Status
            </Link>
            <Link 
              href="/sitemap" 
              sx={{ 
                color: 'text.secondary', 
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s ease',
                '&:hover': { color: 'primary.main' }
              }}
            >
              Sitemap
            </Link>
          </Box>
        </Box>
      </Container>

      {/* Subtle decorative accent */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(144, 202, 249, 0.2), transparent)',
          zIndex: 1
        }}
      />
    </Box>
  );
};

export default Footer;