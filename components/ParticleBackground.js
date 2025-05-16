import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

const ParticleBackground = () => {
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
            value: 30,
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
            value: { min: 5, max: 15 },
            random: true,
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticleBackground; 