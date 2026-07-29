import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sun, ArrowRight, Satellite, BrainCircuit, Zap } from "lucide-react";
import { ROUTES, APP_META } from "../../constants/constants";
import { AboutSatellitesSection } from "../../components/satellite/AboutSatellitesSection";
// Removed StarrySky import

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col relative overflow-x-hidden bg-bg-base min-h-screen">
      {/* ── Background Elements ──────────────────────────────────────────────── */}
      <video
        src="/star-field.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-70"
        style={{ filter: "blur(0px) brightness(0.9)", transform: "scale(1.05)" }}
      />
      
      {/* Background radial glow — spans the entire page */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(6,182,212,0.08) 0%, transparent 60%)",
        }}
      />
      <div className="bg-dot-grid absolute inset-0 opacity-40 pointer-events-none" />

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
            background: "linear-gradient(to bottom, rgba(3,7,18,0.4), rgba(3,7,18,0.78))",
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
          <p className="text-lg text-slate-300 mb-3 font-light leading-relaxed drop-shadow-md">
            {APP_META.description}
          </p>


          {/* CTA */}
          <motion.button
            onClick={() => navigate(ROUTES.MISSION_CONTROL)}
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all duration-300 mx-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712]"
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

          {/* Institutional Credibility Badge Bar */}
          <div className="mt-4 px-4 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 tracking-wider">
            Ingesting Live L1 Telemetry: <span className="text-cyan-300 font-semibold">NOAA SWPC</span> • <span className="text-blue-300 font-semibold">NASA DSCOVR • ACE • WIND • SOHO</span>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {[
              { icon: Satellite, label: "Multi-Satellite Fusion" },
              { icon: BrainCircuit, label: "AI Predictions" },
              { icon: Zap, label: "Real-time Alerts" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-300"
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

      {/* ── 2. Why CME Matters ─────────────────────────────────────────────── */}
      <motion.section 
        className="relative w-full py-32 z-10 flex flex-col items-center justify-center border-t border-white/5 bg-[#020617]/40"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-4xl px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 mb-6 tracking-tight">
            The Invisible Threat to Modern Civilization
          </h2>
          <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed mb-12">
            Coronal Mass Ejections (CMEs) are massive bursts of solar wind and magnetic fields rising above the solar corona. When directed toward Earth, these billion-ton clouds of plasma can travel at millions of miles per hour, compressing our magnetosphere and triggering devastating geomagnetic storms capable of crippling global power grids, disabling satellites, and plunging continents into darkness.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 text-slate-500 font-mono text-sm">
            <div className="flex flex-col items-center"><span className="text-cyan-400 text-4xl font-bold mb-2">~10%</span>Probability per decade</div>
            <div className="flex flex-col items-center"><span className="text-red-400 text-4xl font-bold mb-2">$2.6T</span>Potential Economic Loss</div>
            <div className="flex flex-col items-center"><span className="text-amber-400 text-4xl font-bold mb-2">15-72h</span>Average Strike Time</div>
          </div>
        </div>
      </motion.section>

      {/* ── 3. How Platform Works ──────────────────────────────────────────── */}
      <motion.section 
        className="relative w-full py-32 z-10 flex flex-col items-center justify-center border-t border-white/5"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-5xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4 tracking-tight">Bayesian Fusion Intelligence</h2>
            <p className="text-slate-400 text-lg">Machine learning proposes; physics disposes; decision support acts only on validated outputs.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Multi-Satellite Ingestion", desc: "Real-time telemetry streams from L1 Lagrange point observatories (DSCOVR, ACE, WIND, SOHO) are ingested simultaneously to ensure zero blind spots.", route: ROUTES.DATA_FUSION },
              { title: "Dynamic Weighting", desc: "Our AI algorithm continuously analyzes sensor noise, latency, and spatial relevance, dynamically re-weighting satellite trust scores to isolate the cleanest signal.", route: ROUTES.AI_EXPLAINABILITY },
              { title: "Physics Validation", desc: "All neural network predictions are cross-checked against fundamental heliophysics constraints to eliminate hallucinations and guarantee scientific accuracy.", route: ROUTES.EVENT_ANALYSIS }
            ].map((feature, i) => (
              <div 
                key={i} 
                onClick={() => navigate(feature.route)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate(feature.route)}
                className="bg-[#020617]/60 border border-white/5 rounded-2xl p-8 backdrop-blur-md hover:bg-slate-800/60 hover:border-cyan-500/30 transition-all cursor-pointer group shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold mb-6 font-mono">0{i + 1}</div>
                <h3 className="text-xl font-bold text-slate-200 mb-3 flex items-center justify-between">
                  {feature.title}
                  <ArrowRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── 4. About the Satellites ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1 }}
      >
        <AboutSatellitesSection />
      </motion.div>



      {/* ── 7. Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative w-full py-32 z-10 flex items-center justify-center border-t border-white/10 bg-black overflow-hidden">
        {/* Footer Video Background */}
        <video
          src="/footer-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-60 pointer-events-none"
          style={{ filter: "blur(4px)", transform: "scale(1.05)" }}
        />
        
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617] pointer-events-none opacity-80" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl mb-2 shadow-[0_0_30px_rgba(59,130,246,0.5)]"
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)" }}
          >
            <Sun className="w-6 h-6 text-white" />
          </div>
          <p className="text-white/70 text-sm tracking-widest uppercase font-mono font-bold">© 2026 {APP_META.name}</p>
          <p className="text-cyan-300/80 text-xs tracking-wide font-medium">AI-Powered Space Weather Intelligence</p>
        </div>
      </footer>
    </div>
  );
}
