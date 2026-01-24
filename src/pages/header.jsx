import * as React from 'react';
import { Tabs, Tab, Paper, Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, useScrollTrigger, Slide } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import saeedLogo from '../assets/ChatGPT Image Aug 6, 2025, 02_36_45 AM.png';

// Hide on scroll component
function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // Handle scroll for shadow
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Function to determine the active tab value
  const getActiveTabValue = () => {
    const path = location.pathname;
    
    if (path.startsWith('/slips/')) {
      return '/slippage';
    }
    
    const validPaths = ['/inventory', '/additems', '/income', '/slips', '/slippage', '/search-slips', '/search-products', '/dashboard'];
    if (validPaths.includes(path)) {
      return path;
    }
    
    return false;
  };

  const value = getActiveTabValue();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Search Products', path: '/search-products' },
    { label: 'Add Items', path: '/additems' },
    { label: 'Income', path: '/income' },
    { label: 'Create Slip', path: '/slips' },
    { label: 'View Slips', path: '/slippage' },
    { label: 'Search Slips', path: '/search-slips' },
    { label: 'Customer History', path: '/customer-history' },
  ];

  // Mobile drawer - Responsive width
  const drawer = (
      <Box sx={{ 
        width: '100%', 
        pt: 2,
        px: { xs: 1, sm: 2 }
      }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        px: { xs: 1.5, sm: 2 }, 
        mb: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 } }}>
          <img 
            src={saeedLogo} 
            alt="Logo" 
            style={{ 
              width: '36px', 
              height: '36px', 
              objectFit: 'contain',
              minWidth: '36px'
            }}
          />
          <Typography 
            variant="h6" 
            fontWeight="bold" 
            sx={{ 
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            Inventory
          </Typography>
        </Box>
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{ 
            minWidth: '40px',
            minHeight: '40px',
            p: { xs: 0.75, sm: 1 }
          }}
        >
          <CloseIcon sx={{ fontSize: { xs: '20px', sm: '24px' } }} />
        </IconButton>
      </Box>
      
      <List sx={{ px: { xs: 0.5, sm: 1 } }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path || (item.path === '/slippage' && location.pathname.startsWith('/slips/'))}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                mx: { xs: 0.5, sm: 1 },
                borderRadius: 2,
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                }
              }}
            >
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontWeight: location.pathname === item.path ? 600 : 400
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <HideOnScroll>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,249,250,0.98) 100%)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.1)' : '0 2px 10px rgba(0,0,0,0.05)',
            transition: 'box-shadow 0.3s ease-in-out'
          }}
        >
          <Toolbar sx={{ 
            px: { xs: 1, sm: 2, md: 3 },
            py: { xs: 0.75, sm: 1 },
            minHeight: { xs: '48px', sm: '56px', md: '64px' },
            gap: { xs: 1, sm: 1.5 }
          }}>
            {/* Logo and Title - Left - Fully Responsive */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 0.75, sm: 1, md: 1.5 },
              mr: { xs: 1, sm: 2, md: 3 },
              flexShrink: 0,
              minWidth: 0 // Prevent overflow
            }}>
              {/* Full Logo - Desktop/Tablet */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                <img 
                  src={saeedLogo} 
                  alt="Saeed Autos and Bike" 
                  style={{ 
                    width: '48px', 
                    height: '48px',
                    objectFit: 'contain',
                    imageRendering: 'crisp-edges',
                    flexShrink: 0
                  }} 
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ 
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                    fontSize: { md: '1.25rem', lg: '1.5rem' }
                  }}>
                    Saeed Auto
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ 
                    display: 'block', 
                    lineHeight: 1,
                    fontSize: { md: '0.7rem', lg: '0.75rem' }
                  }}>
                    Inventory System
                  </Typography>
                </Box>
              </Box>

              {/* Compact Logo - Tablet */}
              <Box sx={{ display: { xs: 'none', sm: 'flex', md: 'none' }, alignItems: 'center' }}>
                <img 
                  src={saeedLogo} 
                  alt="Logo" 
                  style={{ 
                    width: '36px', 
                    height: '36px',
                    objectFit: 'contain',
                    imageRendering: 'crisp-edges',
                    flexShrink: 0
                  }} 
                />
              </Box>

              {/* Icon Only - Mobile (300px-435px) */}
              <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center' }}>
                <img 
                  src={saeedLogo} 
                  alt="Logo" 
                  style={{ 
                    width: '28px', 
                    height: '28px',
                    objectFit: 'contain',
                    imageRendering: 'crisp-edges',
                    flexShrink: 0
                  }} 
                />
              </Box>
            </Box>


            {/* Navigation - Desktop/Tablet (hidden on mobile - always use hamburger on mobile) */}
            <Box sx={{ 
              flexGrow: 1, 
              display: { xs: 'none', lg: 'flex' },
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <Tabs
                value={value}
                textColor="inherit"
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTabs-indicator': {
                    display: 'none',
                  },
                  '& .MuiTab-root': {
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    borderRadius: 2,
                    mx: 0.5,
                    textTransform: 'none',
                    minHeight: '40px',
                    color: 'text.primary',
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      color: '#fff !important',
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    }
                  },
                }}
              >
                {navItems.map((item) => (
                  <Tab 
                    key={item.path}
                    label={item.label} 
                    value={item.path} 
                    component={Link} 
                    to={item.path}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Mobile menu button - Always show on screens below lg (1200px) */}
            <IconButton
              color="primary"
              edge="end"
              onClick={handleDrawerToggle}
              aria-label="open drawer"
              sx={{ 
                display: { xs: 'flex', lg: 'none' },
                ml: 'auto',
                minWidth: { xs: '44px', sm: '48px' },
                minHeight: { xs: '44px', sm: '48px' },
                p: { xs: 1, sm: 1.25 },
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                }
              }}
            >
              <MenuIcon sx={{ 
                fontSize: { xs: '28px', sm: '32px', md: '36px' },
                color: 'primary.main'
              }} />
            </IconButton>
          </Toolbar>
        </AppBar>
      </HideOnScroll>

      {/* Mobile drawer - Fully Responsive for 300px, 330px, 400px, 435px and above */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
          BackdropProps: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            // Responsive width for all mobile sizes including 320px
            width: {
              xs: 'calc(100vw - 20px)', // 320px: 93% of viewport
              sm: 'calc(100vw - 40px)', // 600px+: 90% of viewport
              md: 320
            },
            maxWidth: {
              xs: '95vw',
              sm: '90vw',
              md: 360
            },
            minWidth: {
              xs: 280, // Minimum for 320px screens
              sm: 300,
              md: 320
            },
            // Smooth slide animation
            transition: 'width 0.2s ease-in-out',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default Header;
