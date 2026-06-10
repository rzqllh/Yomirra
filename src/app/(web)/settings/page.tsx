"use client"

import * as React from "react"
import { MobilePageShell } from "@/components/app/mobile-page-shell"
import { useReaderStore } from "@/shared/store/reader-store"
import { ReaderMode, ReadingDirection } from "@/shared/types/manga"
import { 
  Palette, BookOpen, Globe, Info, Check,
  Download, ChartBar, CloudArrowUp, ToggleLeft
} from "@phosphor-icons/react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"

function SettingsRow({ 
  icon: Icon, title, subtitle, onClick, right 
}: { 
  icon: React.ElementType, title: string, subtitle?: string, onClick?: () => void, right?: React.ReactNode 
}) {
  return (
    <button 
      onClick={onClick}
      className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-surface-raised active:bg-surface-overlay"
    >
      <Icon size={24} className="text-text-muted shrink-0" />
      <div className="flex-1 overflow-hidden">
        <div className="truncate text-[15px] font-medium text-text-primary">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-[13px] text-text-secondary">{subtitle}</div>}
      </div>
      {right && <div className="text-text-muted shrink-0 flex items-center">{right}</div>}
    </button>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { settings, updateSettings } = useReaderStore()

  return (
    <MobilePageShell title="More" className="p-0 pb-6">
      
      {/* Top Banner (Like Tachiyomi app logo header) */}
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-surface-raised shadow-soft border border-border-subtle">
          <BookOpen size={32} className="text-accent" weight="duotone" />
        </div>
        <h2 className="mt-3 text-lg font-bold text-text-primary tracking-tight">Yomirra</h2>
        <p className="text-sm text-text-muted">Version 0.1.0</p>
      </div>

      <Separator className="mb-2" />

      <Section>
        <SettingsRow 
          icon={Download} 
          title="Download queue" 
          subtitle="No active downloads" 
        />
        <SettingsRow 
          icon={ChartBar} 
          title="Statistics" 
          subtitle="View reading history insights" 
        />
        <SettingsRow 
          icon={CloudArrowUp} 
          title="Data and storage" 
          subtitle="Backup, restore, clear cache" 
        />
      </Section>

      <Separator className="my-2" />

      <Section>
        <SettingsRow 
          icon={Palette} 
          title="Appearance" 
          subtitle="Dark theme, UI scaling" 
        />
        
        {/* Reader Preferences Drawer */}
        <Drawer>
          <DrawerTrigger asChild>
            <SettingsRow 
              icon={BookOpen} 
              title="Reader" 
              subtitle="Reading mode, direction, background" 
            />
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Reader Preferences</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-6">
              <div>
                <div className="mb-2 text-sm font-medium text-text-primary">Default Reading Mode</div>
                <div className="grid grid-cols-1 gap-2">
                  {(['PAGED', 'WEBTOON', 'CONTINUOUS_VERTICAL'] as ReaderMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => updateSettings({ mode })}
                      className="flex items-center justify-between rounded-md bg-surface-raised px-4 py-3 text-sm text-text-primary transition-colors hover:bg-surface-overlay"
                    >
                      <span>
                        {mode === 'PAGED' && 'Paged (Standard)'}
                        {mode === 'WEBTOON' && 'Webtoon (Continuous)'}
                        {mode === 'CONTINUOUS_VERTICAL' && 'Continuous Vertical'}
                      </span>
                      {settings.mode === mode && <Check size={16} className="text-accent" weight="bold" />}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="mb-2 text-sm font-medium text-text-primary">Reading Direction (Paged)</div>
                <div className="grid grid-cols-2 gap-2">
                  {(['LTR', 'RTL', 'TTB'] as ReadingDirection[]).map((dir) => (
                    <button
                      key={dir}
                      onClick={() => updateSettings({ direction: dir })}
                      className="flex items-center justify-between rounded-md bg-surface-raised px-4 py-3 text-sm text-text-primary transition-colors hover:bg-surface-overlay"
                    >
                      <span>
                        {dir === 'LTR' && 'Left to Right'}
                        {dir === 'RTL' && 'Right to Left'}
                        {dir === 'TTB' && 'Top to Bottom'}
                      </span>
                      {settings.direction === dir && <Check size={16} className="text-accent" weight="bold" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        <SettingsRow 
          icon={Globe} 
          title="Browse" 
          subtitle="Source extensions, tracking" 
        />
        <SettingsRow 
          icon={ToggleLeft} 
          title="Advanced" 
          subtitle="Developer options, experiments" 
        />
      </Section>

      <Separator className="my-2" />

      <Section>
        <SettingsRow 
          icon={Info} 
          title="Help & About" 
          subtitle="Discord, FAQ, Github" 
        />
      </Section>

    </MobilePageShell>
  )
}
