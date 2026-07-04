// Minimal motion presets used across the UI components
// Imported by components to apply consistent animations

import { Variants } from "framer-motion";

// Fade in with a slight upward slide
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Scale up on hover (used for buttons, cards)
export const scaleHover: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
};

// Stagger children animations within a container
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
