import { useCallback, useEffect, useState } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

const ParticleBackground = () => {
  const [particleCount, setParticleCount] = useState(30);
  
  useEffect(() => {
    const handleResize = () => {
      // Adjust particle count based on screen size
      if (window.innerWidth < 640) {
        setParticleCount(15); // Fewer particles on mobile
      } else {
        setParticleCount(30); // More particles on larger screens
      }
    };
    
    // Set initial count
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: {
          enable: true,
          zIndex: -1
        },
        background: {
          color: {
            value: 'transparent',
          },
        },
        fpsLimit: 60,
        particles: {
          color: {
            value: ['#0052FF', '#FF2E63', '#FFCB57', '#4BD3DB'],
          },
          links: {
            enable: false,
          },
          move: {
            enable: true,
            random: true,
            speed: 1,
            direction: 'none',
            outModes: {
              default: 'out',
            },
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: particleCount,
          },
          opacity: {
            value: 0.7,
            random: true,
            animation: {
              enable: true,
              speed: 0.5,
              minimumValue: 0.1,
              sync: false,
            },
          },
          shape: {
            type: ['square', 'triangle', 'polygon'],
          },
          size: {
            value: { min: 3, max: 12 },
            random: true,
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticleBackground; 