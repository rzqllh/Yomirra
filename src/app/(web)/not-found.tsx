"use client";

import Link from "next/link";
import { House, Compass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4 text-center">
      {/* 404 Graphic */}
      <div className="relative flex items-center justify-center select-none pointer-events-none">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-8xl md:text-9xl font-black leading-none tracking-tighter text-text-primary"
        >
          404
        </motion.h1>
      </div>
      
      {/* Text Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4 z-10 max-w-md"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          Halaman tidak ditemukan
        </h2>
        <p className="text-base text-text-secondary leading-relaxed font-medium">
          Alamat ini mungkin sudah berubah atau tidak tersedia.
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
          size="lg"
          asChild
          className="w-full sm:w-auto"
        >
          <Link href="/">
            <House className="mr-2" size={20} weight="fill" />
            Ke Beranda
          </Link>
        </Button>
        <Button 
          variant="secondary" 
          size="lg"
          asChild
          className="w-full sm:w-auto"
        >
          <Link href="/popular">
            <Compass className="mr-2" size={20} weight="fill" />
            Jelajahi komik
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
