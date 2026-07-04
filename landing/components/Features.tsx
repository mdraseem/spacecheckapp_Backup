"use client";
import { motion } from "framer-motion";
import { fadeSlideUp, scaleHover, staggerContainer } from "../lib/motion";
import SectionTracker from "./SectionTracker";
import { ScanLine, Layers, Zap, Globe, Lock, Palette } from "lucide-react";

export default function Features({ dict }: { dict: any }) {
  const features = [
    {
      icon: <Zap className="text-secondary" size={24} />, 
      title: dict.features.items.instant.title,
      description: dict.features.items.instant.desc,
    },
    {
      icon: <Globe className="text-secondary" size={24} />, 
      title: dict.features.items.universal.title,
      description: dict.features.items.universal.desc,
    },
    {
      icon: <Layers className="text-secondary" size={24} />, 
      title: dict.features.items.textures.title,
      description: dict.features.items.textures.desc,
    },
    {
      icon: <ScanLine className="text-secondary" size={24} />, 
      title: dict.features.items.integration.title,
      description: dict.features.items.integration.desc,
    },
    {
      icon: <Palette className="text-secondary" size={24} />, 
      title: dict.features.items.branding.title,
      description: dict.features.items.branding.desc,
    },
    {
      icon: <Lock className="text-secondary" size={24} />, 
      title: dict.features.items.hosting.title,
      description: dict.features.items.hosting.desc,
    },
  ];

  return (
    <SectionTracker sectionName="features" event="feature_card_viewed">
      <motion.section
        id="features"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="py-24 bg-muted/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeSlideUp} className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">{dict.features.title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{dict.features.subtitle}</p>
          </motion.div>
          <motion.div
            variants={fadeSlideUp}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleHover}
                whileHover="hover"
                className="glass-card p-8 rounded-2xl border border-gray-100 transition-shadow hover:shadow-md"
              >
                <div className="w-12 h-12 bg-accent/50 rounded-lg flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </SectionTracker>
  );
}