"use client";

import Link from "next/link";
import { House, Compass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <div className="flex min-h-[85vh] w-full flex-col items-center justify-center gap-8 px-4 text-center">
      {/* Animated 404 Graphic */}
      <div className="relative flex items-center justify-center select-none pointer-events-none">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-[140px] md:text-[200px] font-black leading-none tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-text-primary via-text-primary/80 to-surface-muted"
        >
          404
        </motion.h1>
        
        {/* Abstract Orbiting Element to add premium touch */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"
        >
          <div className="w-[120%] h-[120%] border-[1px] border-dashed border-text-muted rounded-full" />
        </motion.div>
      </div>
      
      {/* Text Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4 z-10 max-w-md"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-base text-text-secondary leading-relaxed font-medium">
          Mungkin URL-nya salah, atau komik yang kamu cari telah dihapus. Jangan khawatir, masih banyak cerita menarik lainnya yang menunggu.
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row gap-4 mt-4 z-10 w-full sm:w-auto"
      >
        <Button 
          variant="accent" 
          asChild
          className="min-h-[52px] px-8 rounded-full shadow-lg shadow-accent/20 font-bold w-full sm:w-auto hover:scale-105 transition-transform"
        >
          <Link href="/">
            <House className="mr-2" size={20} weight="fill" />
            Kembali ke Beranda
          </Link>
        </Button>
        <Button 
          variant="secondary" 
          asChild
          className="min-h-[52px] px-8 rounded-full font-bold w-full sm:w-auto hover:scale-105 transition-transform"
        >
          <Link href="/popular">
            <Compass className="mr-2" size={20} weight="fill" />
            Eksplor Komik Populer
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
