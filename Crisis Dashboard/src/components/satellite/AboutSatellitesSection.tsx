import { motion } from "framer-motion";
import { SATELLITE_INFO } from "../../constants/satelliteInfo";
import { SatelliteInfoCard } from "./SatelliteInfoCard";
import { useSharedAnimations } from "../../utils/motion";

export function AboutSatellitesSection() {
  const { staggerContainer, fadeSlideUp } = useSharedAnimations();
  return (
    <section className="relative w-full py-24 z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            About the Satellites
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-white/50 max-w-2xl"
          >
            Meet the primary instruments feeding raw space weather telemetry into the Crisis platform.
          </motion.p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {SATELLITE_INFO.map((satellite) => (
            <motion.div 
              key={satellite.id}
              variants={fadeSlideUp}
            >
              <SatelliteInfoCard satellite={satellite} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
