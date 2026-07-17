import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sun, ArrowRight, Satellite, BrainCircuit, Zap } from "lucide-react";
import { ROUTES, APP_META } from "../../constants/constants";
import { AboutSatellitesSection } from "../../components/satellite/AboutSatellitesSection";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col relative overflow-x-hidden bg-bg-base min-h-screen">
      {/* Background radial glow — spans the entire page */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(6,182,212,0.08) 0%, transparent 60%)",
        }}
      />
      <div className="bg-dot-grid absolute inset-0 opacity-60 pointer-events-none" />

      {/* ── 1. Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Video Element */}
        <video
          src="/hero-background.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          style={{
            filter: "blur(4px) brightness(0.6)",
            transform: "scale(1.05)",
            opacity: 0,
            transition: "opacity 0.6s ease-in-out",
          }}
          onCanPlay={(e) => (e.currentTarget.style.opacity = "1")}
        />

        {/* Gradient Overlay for Contrast Safety */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(3,7,18,0.3), rgba(3,7,18,0.6))",
          }}
        />

        {/* Blend Hero into the next section */}
        <div
          className="absolute inset-x-0 bottom-0 h-40 z-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, #030712)",
          }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto py-24"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Logo */}
          <motion.div
            className="flex items-center justify-center w-20 h-20 rounded-3xl mb-8 mx-auto"
            style={{
              background: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
              boxShadow: "0 0 60px rgba(59,130,246,0.4), 0 0 120px rgba(59,130,246,0.15)",
            }}
            animate={{ boxShadow: ["0 0 40px rgba(59,130,246,0.3)", "0 0 80px rgba(59,130,246,0.5)", "0 0 40px rgba(59,130,246,0.3)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sun className="w-10 h-10 text-white" />
          </motion.div>

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold tracking-widest uppercase"
            style={{
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
              color: "#60A5FA",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            AI-Powered Space Weather Intelligence
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-none tracking-tight">
            {APP_META.name}
          </h1>
          <p className="text-lg text-white/50 mb-3 font-light leading-relaxed">
            {APP_META.description}
          </p>
          <p className="text-sm text-white/30 mb-10 font-mono tracking-wide">
            Aditya-L1 · SOHO · DSCOVR · GOES
          </p>

          {/* CTA */}
          <motion.button
            onClick={() => navigate(ROUTES.MISSION_CONTROL)}
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all duration-300 mx-auto"
            style={{
              background: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
              boxShadow: "0 4px 24px rgba(59,130,246,0.35)",
            }}
            whileHover={{ scale: 1.03, boxShadow: "0 8px 40px rgba(59,130,246,0.55)" }}
            whileTap={{ scale: 0.97 }}
          >
            Enter Mission Control
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            {[
              { icon: Satellite, label: "Multi-Satellite Fusion" },
              { icon: BrainCircuit, label: "AI Predictions" },
              { icon: Zap, label: "Real-time Alerts" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Icon className="w-3.5 h-3.5 text-blue-400" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── 2. Why CME Matters (placeholder) ─────────────────────────────────── */}
      <section className="relative w-full py-24 z-10 flex items-center justify-center border-t border-white/5">
        <h2 className="text-3xl text-white/40 font-bold">[Why CME Matters — Coming Soon]</h2>
      </section>

      {/* ── 3. How Platform Works (placeholder) ──────────────────────────────── */}
      <section className="relative w-full py-24 z-10 flex items-center justify-center border-t border-white/5">
        <h2 className="text-3xl text-white/40 font-bold">[How Platform Works — Coming Soon]</h2>
      </section>

      {/* ── 4. About the Satellites ───────────────────────────────────────────── */}
      <AboutSatellitesSection />

      {/* ── 5. Platform Features (placeholder) ───────────────────────────────── */}
      <section className="relative w-full py-24 z-10 flex items-center justify-center border-t border-white/5">
        <h2 className="text-3xl text-white/40 font-bold">[Platform Features — Coming Soon]</h2>
      </section>

      {/* ── 6. System Architecture Preview (placeholder) ──────────────────────── */}
      <section className="relative w-full py-24 z-10 flex items-center justify-center border-t border-white/5">
        <h2 className="text-3xl text-white/40 font-bold">[System Architecture — Coming Soon]</h2>
      </section>

      {/* ── 7. Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative w-full py-12 z-10 flex items-center justify-center border-t border-white/10 bg-black/40">
        <p className="text-white/30 text-sm">© 2026 {APP_META.name} · Footer Placeholder</p>
      </footer>
    </div>
  );
}
