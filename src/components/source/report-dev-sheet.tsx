"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Spinner, Bug, PaperPlaneRight } from "@phosphor-icons/react";
import type { SourceMetadata } from "@/shared/sources/source-types";

interface ReportDevSheetProps {
  source: SourceMetadata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDevSheet({ source, open, onOpenChange }: ReportDevSheetProps) {
  const [message, setMessage] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setMessage("");
        setIsSending(false);
      }, 300);
    }
  }, [open]);

  const handleSend = async () => {
    if (!source || !message.trim()) return;
    
    setIsSending(true);
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, this would call an API route that sends an email to hrizqullah484@gmail.com
    toast.success("Laporan berhasil dikirim ke developer!");
    setIsSending(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl sm:max-w-md sm:mx-auto sm:border sm:rounded-b-none p-6">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Bug size={24} className="text-semantic-error" weight="duotone" />
            Laporkan Masalah
          </SheetTitle>
          <SheetDescription>
            Bantu kami memperbaiki sumber <strong>{source?.name}</strong>. Laporan ini akan dikirim langsung ke tim internal Yomirra.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-primary">Deskripsi Masalah</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Contoh: Chapter terbaru tidak muncul, atau gambar gagal dimuat..."
              className="w-full p-4 bg-surface-base border border-border-default rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary resize-none h-32"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-full font-bold border-border-default"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Batal
            </Button>
            <Button
              variant="accent"
              className="flex-[2] h-12 rounded-full font-bold"
              onClick={handleSend}
              disabled={isSending || !message.trim()}
            >
              {isSending ? (
                <>
                  <Spinner size={20} className="mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  Kirim Laporan
                  <PaperPlaneRight size={20} className="ml-2" weight="fill" />
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
