"use client";

import * as React from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { useAuth } from "@/shared/hooks/use-auth";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const { loading } = useAuth();
  const [isMounted, setIsMounted] = React.useState(false);
  const [isReadyToExit, setIsReadyToExit] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    document.body.style.overflow = "hidden"; // Lock scroll

    if (!loading) {
      // Minimum duration 400ms to avoid flash
      const timer = setTimeout(() => {
        setIsReadyToExit(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  React.useEffect(() => {
    if (isReadyToExit) {
      document.body.style.overflow = ""; // Restore scroll
      onComplete();
    }
  }, [isReadyToExit, onComplete]);

  // Prevent hydration mismatch by not rendering anything on server
  if (!isMounted) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-background"
    >
          {/* Blurred Background Gradient */}
          <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-background to-background" />
             <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[140%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
             <div className="absolute bottom-[-20%] right-[-10%] w-[120%] h-[120%] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pb-20">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="mb-5 relative w-[100px] h-[100px]"
            >
              <Image 
                src="/icon.png" 
                alt="Yomirra Logo" 
                fill 
                className="object-contain drop-shadow-md" 
                priority 
                unoptimized
              />
            </motion.div>

            {/* Typography */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center text-center gap-1.5"
            >
              <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Yomirra</h1>
              <p className="text-[14px] font-medium text-text-muted">Baca lintas sumber, lebih nyaman.</p>
            </motion.div>
          </div>

          {/* Loading Indicator */}
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.5, delay: 0.6 }}
             className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-3 w-full px-8"
          >
             <div className="w-full max-w-[180px] h-1.5 rounded-full bg-surface-raised overflow-hidden">
                <motion.div 
                   className="h-full bg-accent rounded-full"
                   initial={{ width: "0%" }}
                   animate={{ width: "100%" }}
                   transition={{ duration: 1.4, ease: "easeInOut" }}
                />
             </div>
             <p className="text-xs font-semibold text-text-muted">Memuat dunia manga...</p>
          </motion.div>
    </motion.div>
  );
}
