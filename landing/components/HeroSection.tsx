"use client";
import { motion } from "framer-motion";
import { fadeSlideUp, scaleHover, staggerContainer } from "../lib/motion";

export default function HeroSection() {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="relative pt-32 pb-20 px-4 md:px-8 flex flex-col items-center justify-center min-h-screen text-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black"
    >
      {/* Gradient mesh background */}
      <motion.div
        className="mesh-gradient-bg"
        variants={fadeSlideUp}
        transition={{ duration: 0.4 }}
      />
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary-container/10 rounded-full blur-[120px]"
        variants={fadeSlideUp}
        transition={{ duration: 0.5 }}
      />

      {/* AI status chip */}
      <motion.div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8"
        variants={fadeSlideUp}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
        </span>
        <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest">
          New: AI Video Orchestration 2.0
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        className="font-headline-lg-mobile text-headline-lg-mobile mb-6 max-w-[340px] mx-auto text-on-surface leading-[1.1] tracking-tighter"
        variants={fadeSlideUp}
      >
        Turn products into daily <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">social content</span> automatically.
      </motion.h1>
      <motion.p
        className="font-body-md text-body-md text-on-surface-variant mb-10 max-w-[320px] mx-auto opacity-80 leading-relaxed"
        variants={fadeSlideUp}
      >
        AI-powered content generation, Instagram storefront widgets, Stories, Highlights, and conversion analytics for Shopify brands.
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        className="flex flex-col w-full gap-4 max-w-[320px] mx-auto mb-16"
        variants={fadeSlideUp}
      >
        <motion.button
          whileHover="hover"
          variants={scaleHover}
          className="electric-gradient beveled-edge text-white h-14 rounded-xl font-bold text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 group transition-all active:scale-95"
        >
          Start 14‑day free trial
          <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </motion.button>
        <motion.button
          whileHover="hover"
          variants={scaleHover}
          className="glass-card-dark h-14 rounded-xl font-bold text-on-surface flex items-center justify-center gap-2 transition-all hover:bg-white/5 active:scale-95"
        >
          <span className="material-symbols-outlined text-primary">play_circle</span>
          Watch Demo
        </motion.button>
      </motion.div>

      {/* Mock preview card (optional visual) */}
      <motion.div
        className="w-full max-w-[360px] mx-auto relative group"
        variants={fadeSlideUp}
      >
        <motion.div
          className="absolute -inset-4 bg-primary/20 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"
          variants={fadeSlideUp}
        />
        <motion.div
          className="glass-card-dark rounded-2xl p-4 flex flex-col gap-4 relative"
          variants={fadeSlideUp}
        >
          {/* Live preview chips */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant/50">LIVE PREVIEW</span>
          </div>
          {/* Image */}
          <div className="aspect-square w-full rounded-xl overflow-hidden relative border border-white/5">
            <img
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyJE-XK8QiMkD75nBdbTigOLAOdzl17NloOouokw8F1jv_DTnJIVDLm0Ez8R1tTF8sTOcGaQC8Fm7SekMTdwvWbfUe40XUpN-OqGP_494W57J7UEdPrPL75PvY2BCnm_Cj84gEPFLebbdYyYhtq_fUuEu09tMMEE3BdpSq3btKHT4SQlyTDavwIhueFg870vlun0D3i2aZMG8TVfEwzyHUp365B7GbSRyR8zIoDWmYVeSvQ8fMGLyW8rPHBwzV0uEAwn-ljkZptYCO"
              alt="Premium SaaS hero illustration"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8rS2smGqRoTE11V5I7eDe9KG4XCwTQ7lpEzQr5_i3s7IcITMPp6TI9w7Cxut_xdbKs84-z63Q6HyVyzuyzgRRIrO9ICjP1ZbWgWlZ3zZoBTMHPKSU-sJ9-SVWHWmFiq60apO6gIAsizR9nDqnuHk1Xj0TBCeYH-m6gaLkyidQ9yxqIAU2nnGdM7xlbjTl73X6K6iC-OxCKAVKzOD8qM6qmOzdbECQHv_edZzMogTQtsjJV4K0vkPpS3LsJ2q8v6gqyxXFsgMrqg-z"
                    alt="Brand avatar"
                  />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold text-white/90">@socialpilot_ai</div>
                  <div className="text-[8px] text-white/50">Posting via AI Engine…</div>
                </div>
              </div>
            </div>
          </div>
          {/* Mock stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-left">
              <div className="font-label-sm text-[10px] text-primary mb-1 uppercase tracking-wider">Engagement</div>
              <div className="font-headline-md text-white text-lg">+124%</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-left">
              <div className="font-label-sm text-[10px] text-tertiary mb-1 uppercase tracking-wider">ROAS</div>
              <div className="font-headline-md text-white text-lg">8.4x</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
