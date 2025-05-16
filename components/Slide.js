import { motion } from 'framer-motion';

// Animation variants for slide transitions
const slideVariants = {
  hidden: { opacity: 0, y: 100 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut" 
    } 
  },
  exit: { 
    opacity: 0, 
    y: -100,
    transition: { 
      duration: 0.4,
      ease: "easeIn" 
    } 
  }
};

// Animation variants for content elements
const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: custom => ({ 
    opacity: 1, 
    y: 0,
    transition: { 
      delay: custom * 0.2,
      duration: 0.5 
    } 
  })
};

const Slide = ({ children, background, onNext, isLast = false }) => {
  return (
    <motion.div
      className="slide-container"
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ 
        background: background || 'transparent',
      }}
    >
      {children}
      
      {!isLast && (
        <motion.button
          variants={contentVariants}
          custom={5}
          initial="hidden"
          animate="visible"
          className="absolute bottom-10 font-pixel text-white bg-base-blue px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          onClick={onNext}
        >
          Next →
        </motion.button>
      )}
    </motion.div>
  );
};

// Animated heading for slides
export const SlideHeading = ({ children, custom = 1 }) => (
  <motion.h2
    variants={contentVariants}
    custom={custom}
    initial="hidden"
    animate="visible"
    className="text-4xl md:text-5xl font-pixel text-center text-white mb-8"
  >
    {children}
  </motion.h2>
);

// Animated stat display
export const StatDisplay = ({ value, label, custom = 2 }) => (
  <motion.div
    variants={contentVariants}
    custom={custom}
    initial="hidden"
    animate="visible"
    className="stat-card text-center mx-auto max-w-sm mb-6"
  >
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </motion.div>
);

// Animated text paragraph
export const SlideParagraph = ({ children, custom = 3 }) => (
  <motion.p
    variants={contentVariants}
    custom={custom}
    initial="hidden"
    animate="visible"
    className="text-xl md:text-2xl font-mono text-center text-white/80 max-w-2xl mx-auto mb-10"
  >
    {children}
  </motion.p>
);

export default Slide; 