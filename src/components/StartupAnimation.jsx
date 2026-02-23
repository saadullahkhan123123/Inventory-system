import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Fade, Button } from '@mui/material';
import { keyframes } from '@emotion/react';
import saeedLogo from '../assets/ChatGPT Image Aug 6, 2025, 02_36_45 AM.png';
import { useNavigate } from 'react-router-dom';

const PARTICLE_COUNT = 100;
const PARTICLE_SIZE = 1.5;
const CURSOR_FOLLOW = 0.1;
const LOGO_FOLLOW = 0.02;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.5) translateY(-20px);
  }
  50% {
    transform: scale(1.1) translateY(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;


function StartupAnimation({ children, isLoading = false }) {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [logoTransform, setLogoTransform] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const wasSkipped = sessionStorage.getItem('animationSkipped');
    
    if (wasSkipped || skipAnimation) {
      setShowContent(true);
      return;
    }

    const countdown = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setShowContent(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timer = setTimeout(() => {
      setShowContent(true);
      clearInterval(countdown);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdown);
    };
  }, [skipAnimation]);

  // Initialize particles and animation
  useEffect(() => {
    if (skipAnimation || showContent) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: PARTICLE_SIZE + Math.random() * 0.5,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach((p) => {
        const dx = mousePos.x - p.x;
        const dy = mousePos.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          const force = (200 - dist) / 200;
          p.vx += dx * CURSOR_FOLLOW * force;
          p.vy += dy * CURSOR_FOLLOW * force;
        }
        
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -0.8;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -0.8;
        p.x = Math.max(0, Math.min(canvas.width, p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.random() * 0.3})`;
        ctx.fill();
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos, skipAnimation, showContent]);

  // Handle mouse move for particles and logo
  const handleMouseMove = useCallback((e) => {
    const x = e.clientX;
    const y = e.clientY;
    setMousePos({ x, y });
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const dx = (x - centerX) * LOGO_FOLLOW;
    const dy = (y - centerY) * LOGO_FOLLOW;
    setLogoTransform({ x: dx, y: dy });
  }, []);

  // Handle window resize and mouse events
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleMouseMove]);

  const handleContinue = () => {
    setSkipAnimation(true);
    sessionStorage.setItem('animationSkipped', 'true');
    setShowContent(true);
    // Navigate to dashboard
    navigate('/dashboard');
  };

  if (skipAnimation || showContent) {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #dc2626 0%, #1e40af 50%, #dc2626 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: `${fadeIn} 0.5s ease-in`,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          animation: `${shimmer} 3s infinite`,
          backgroundSize: '2000px 100%'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(30, 64, 175, 0.3) 0%, transparent 70%)',
        }
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading application"
    >
      {/* Particles Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      <Fade in={true} timeout={500}>
        <Box sx={{ 
          textAlign: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Logo with cursor-following motion only (no automatic animation) */}
          <Box
            sx={{
              mb: 4,
              animation: `${scaleIn} 1.2s ease-out`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: `translate(${logoTransform.x}px, ${logoTransform.y}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <Box
              sx={{
                width: { xs: 140, sm: 180, md: 220 },
                height: { xs: 140, sm: 180, md: 220 },
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.98)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.4), 0 0 40px rgba(220, 38, 38, 0.3)',
                padding: { xs: 2.5, sm: 3, md: 3.5 },
                transition: 'box-shadow 0.3s ease',
                '&:hover': {
                  boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5), 0 0 50px rgba(30, 64, 175, 0.4)'
                }
              }}
            >
              <img 
                src={saeedLogo} 
                alt="Saeed Auto Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))'
                }}
              />
            </Box>
          </Box>

          {/* Company Name */}
          <Typography 
            variant="h4"
            sx={{ 
              mb: 1,
              color: 'white',
              fontWeight: 'bold',
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              textShadow: '0 3px 15px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.3)',
              animation: `${slideUp} 1s ease-out 0.4s both`,
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              letterSpacing: '0.5px'
            }}
          >
            Saeed Auto
          </Typography>

          {/* Subtitle */}
          <Typography 
            variant="h6"
            sx={{ 
              mb: 5,
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 400,
              fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              animation: `${slideUp} 1s ease-out 0.6s both`,
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
            }}
          >
            Admin Dashboard
          </Typography>

          {/* Continue Button */}
          <Button
            variant="contained"
            onClick={handleContinue}
            sx={{
              minWidth: { xs: 200, sm: 250 },
              py: { xs: 1.25, sm: 1.5 },
              px: { xs: 4, sm: 5 },
              fontSize: { xs: '1rem', sm: '1.125rem' },
              fontWeight: 'bold',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
              color: '#1e40af',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.2)',
              textTransform: 'none',
              borderRadius: 3,
              animation: `${slideUp} 1s ease-out 0.8s both`,
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Continue
          </Button>

          {/* Timer Display */}
          {timeRemaining > 0 && !skipAnimation && (
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 3,
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                animation: `${slideUp} 1s ease-out 1s both`,
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
              }}
            >
              Auto-continue in {timeRemaining} seconds
            </Typography>
          )}
        </Box>
      </Fade>
    </Box>
  );
}

export default StartupAnimation;

