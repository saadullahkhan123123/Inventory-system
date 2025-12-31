import * as React from 'react';
import { Tabs, Tab, Paper, Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, useScrollTrigger, Slide, Chip } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
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
  const [pakistanDate, setPakistanDate] = React.useState({
    date: '',
    day: '',
    time: ''
  });

  // Get Pakistan (Karachi) timezone date and day
  React.useEffect(() => {
    const updatePakistanTime = () => {
      const now = new Date();
      const pakistanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = days[pakistanTime.getDay()];
      
      const dateStr = pakistanTime.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const timeStr = pakistanTime.toLocaleTimeString('en-PK', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      setPakistanDate({
        date: dateStr,
        day: day,
        time: timeStr
      });
    };

    updatePakistanTime();
    const interval = setInterval(updatePakistanTime, 1000);

    return () => clearInterval(interval);
  }, []);

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
    
    const validPaths = ['/inventory', '/additems', '/income', '/slips', '/slippage', '/search-slips', '/dashboard'];
    if (validPaths.includes(path)) {
      return path;
    }
    
    return false;
  };

  const value = getActiveTabValue();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Add Items', path: '/additems' },
    { label: 'Income', path: '/income' },
    { label: 'Create Slip', path: '/slips' },
    { label: 'View Slips', path: '/slippage' },
    { label: 'Search Slips', path: '/search-slips' },
    { label: 'Customer History', path: '/customer-history' },
  ];

  // Mobile drawer
  const drawer = (
      <Box sx={{ width: 250, pt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img 
            src={saeedLogo} 
            alt="Logo" 
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
          <Typography variant="h6" fontWeight="bold" sx={{ 
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Inventory
          </Typography>
        </Box>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      {/* Date & Day in Mobile Drawer */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Chip
          icon={<CalendarTodayIcon />}
          label={pakistanDate.date}
          size="small"
          sx={{
            mb: 1,
            width: '100%',
            justifyContent: 'flex-start',
            bgcolor: 'rgba(25, 118, 210, 0.1)',
            color: 'primary.main',
            fontWeight: 'bold',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: '0.7rem'
          }}
        />
        <Chip
          icon={<AccessTimeIcon />}
          label={`${pakistanDate.day} - ${pakistanDate.time}`}
          size="small"
          sx={{
            width: '100%',
            justifyContent: 'flex-start',
            bgcolor: 'rgba(220, 38, 38, 0.1)',
            color: '#dc2626',
            fontWeight: 'bold',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: '0.7rem'
          }}
        />
      </Box>
      
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                  }
                }
              }}
            >
              <ListItemText primary={item.label} />
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
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 1, sm: 1.5 },
            minHeight: { xs: '56px', sm: '64px' } 
          }}>
            {/* Logo and Title - Left */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5 },
              mr: { xs: 2, sm: 4 },
              flexShrink: 0
            }}>
              {/* Full Logo - Desktop/Tablet */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                <img 
                  src={saeedLogo} 
                  alt="Saeed Autos and Bike" 
                  style={{ 
                    width: '50px', 
                    height: '50px',
                    objectFit: 'contain',
                    imageRendering: 'crisp-edges'
                  }} 
                />
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ 
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2
                  }}>
                    Saeed Auto
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', lineHeight: 1 }}>
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
                    width: '40px', 
                    height: '40px',
                    objectFit: 'contain',
                    imageRendering: 'crisp-edges'
                  }} 
                />
              </Box>

              {/* Icon Only - Mobile */}
              <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center' }}>
                <img 
                  src={saeedLogo} 
                  alt="Logo" 
                  style={{ 
                    width: '32px', 
                    height: '32px',
                    objectFit: 'contain',
                    imageRendering: 'crisp-edges'
                  }} 
                />
              </Box>
            </Box>

            {/* Date & Day Display - Desktop */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1,
              mr: 2,
              flexShrink: 0
            }}>
              <Chip
                icon={<CalendarTodayIcon />}
                label={pakistanDate.date}
                size="small"
                sx={{
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  color: 'primary.main',
                  fontWeight: 'bold',
                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                  fontSize: '0.75rem'
                }}
              />
              <Chip
                icon={<AccessTimeIcon />}
                label={`${pakistanDate.day} - ${pakistanDate.time}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(220, 38, 38, 0.1)',
                  color: '#dc2626',
                  fontWeight: 'bold',
                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                  fontSize: '0.75rem'
                }}
              />
            </Box>

            {/* Navigation - Desktop */}
            <Box sx={{ 
              flexGrow: 1, 
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center'
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

            {/* Mobile menu button */}
            <IconButton
              color="inherit"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ 
                display: { xs: 'flex', md: 'none' },
                ml: 'auto'
              }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </HideOnScroll>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default Header;
