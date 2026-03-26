import { motion } from 'framer-motion';

export default function WorkflowAnimation({ StartIcon, EndIcon }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4 h-16 relative">
      {/* Start Node */}
      <div className="w-12 h-12 rounded-lg border border-purple-500/30 flex items-center justify-center bg-purple-500/5 hover:bg-purple-500/10 transition-all relative z-10">
        <StartIcon className="w-6 h-6 text-purple-400" strokeWidth={1.5} />
      </div>

      {/* Connection Line with animated glow */}
      <div className="relative w-16 h-0.5">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-purple-500/40 to-purple-500/20"></div>
        <motion.div
          className="absolute h-full w-8 bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-sm"
          animate={{
            x: [-32, 64]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* AI Agent Node */}
      <div className="w-12 h-12 rounded-lg border border-purple-500/40 flex items-center justify-center bg-purple-500/10 hover:bg-purple-500/20 transition-all relative z-10">
        <motion.div
          animate={{
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="3"/>
            <path d="M12 11v4"/>
            <circle cx="12" cy="18" r="2"/>
            <path d="M8 14l-2 2"/>
            <path d="M16 14l2 2"/>
            <circle cx="6" cy="16" r="1"/>
            <circle cx="18" cy="16" r="1"/>
          </svg>
        </motion.div>
      </div>

      {/* Connection Line with animated glow */}
      <div className="relative w-16 h-0.5">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-purple-500/40 to-purple-500/20"></div>
        <motion.div
          className="absolute h-full w-8 bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-sm"
          animate={{
            x: [-32, 64]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            delay: 1
          }}
        />
      </div>

      {/* End Node */}
      <div className="w-12 h-12 rounded-lg border border-purple-500/30 flex items-center justify-center bg-purple-500/5 hover:bg-purple-500/10 transition-all relative z-10">
        <EndIcon className="w-6 h-6 text-purple-400" strokeWidth={1.5} />
      </div>
    </div>
  );
}
