import { useCallback, useEffect, useState } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

const ParticleBackground = () => {
  const [particleCount, setParticleCount] = useState(30);
  const [particleSize, setParticleSize] = useState({ min: 3, max: 12 });
  
  useEffect(() => {
    const handleResize = () => {
      // Adjust particle count and size based on screen size
      if (window.innerWidth < 480) {
        setParticleCount(12);
        setParticleSize({ min: 2, max: 8 });
      } else if (window.innerWidth < 768) {
        setParticleCount(20);
        setParticleSize({ min: 2, max: 10 });
      } else {
        setParticleCount(30);
        setParticleSize({ min: 3, max: 12 });
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
            value: ['#0052FF', '#1A6DFF', '#00A3FF', '#FFCB57', '#FF2E63', '#7B3FE4'],
          },
          links: {
            enable: false,
          },
          move: {
            enable: true,
            random: true,
            speed: 0.8,
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
            value: 0.6,
            random: true,
            animation: {
              enable: true,
              speed: 0.4,
              minimumValue: 0.1,
              sync: false,
            },
          },
          shape: {
            type: ['square', 'triangle', 'polygon'],
          },
          size: {
            value: { min: particleSize.min, max: particleSize.max },
            random: true,
            animation: {
              enable: true,
              speed: 1,
              minimumValue: particleSize.min * 0.5,
              sync: false,
            },
          },
          twinkle: {
            particles: {
              enable: true,
              frequency: 0.05,
              opacity: 0.8,
              color: {
                value: ['#0052FF', '#FFCB57'],
              },
            },
          },
          shadow: {
            enable: true,
            color: '#000',
            blur: 3,
            offset: {
              x: 0,
              y: 0,
            },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticleBackground; 