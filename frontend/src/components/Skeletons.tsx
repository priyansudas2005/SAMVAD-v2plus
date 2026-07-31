import React from 'react';
import { motion } from 'framer-motion';

// --- Base Shimmer Box Primitive ---
export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBase: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div 
    className={`bg-[#181b24] relative overflow-hidden rounded-lg ${className}`} 
    style={style}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_1.8s_infinite] pointer-events-none" />
  </div>
);

// --- Progressive Loading Wrapper (Phase Revealer) ---
export const SkeletonContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.2 }}
    className={`w-full h-full flex flex-col ${className}`}
  >
    {children}
  </motion.div>
);

// 1. --- Dashboard Skeleton ---
export const DashboardSkeleton: React.FC = () => (
  <SkeletonContainer className="p-6 space-y-6 bg-[#0e1016] min-h-screen">
    {/* 1. Header Layout */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBase className="h-7 w-56 rounded-xl" />
        <SkeletonBase className="h-4 w-72 rounded-lg" />
      </div>
      <div className="flex items-center gap-3">
        <SkeletonBase className="h-9 w-28 rounded-xl" />
        <SkeletonBase className="h-9 w-36 rounded-xl" />
      </div>
    </div>

    {/* 2. KPI Cards Row (4 Cards) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 bg-[#141722] border border-slate-800/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBase className="h-3.5 w-24 rounded" />
            <SkeletonBase className="w-8 h-8 rounded-lg" />
          </div>
          <SkeletonBase className="h-7 w-20 rounded-md" />
          <SkeletonBase className="h-3 w-32 rounded" />
        </div>
      ))}
    </div>

    {/* 3. Main Split Grid (Recent Meetings + Activity Chart) */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
      {/* Left 2 Cols: Meeting Cards Grid */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonBase className="h-5 w-40 rounded-md" />
          <SkeletonBase className="h-4 w-20 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 bg-[#141722] border border-slate-800/80 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <SkeletonBase className="h-3 w-16 rounded" />
                <SkeletonBase className="h-3 w-12 rounded" />
              </div>
              <SkeletonBase className="h-4 w-4/5 rounded" />
              <div className="h-10 bg-[#0e1016] rounded-lg p-2 flex items-center justify-center">
                <SkeletonBase className="w-full h-4 rounded" />
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800/60">
                <SkeletonBase className="h-3 w-20 rounded" />
                <SkeletonBase className="h-3 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Col: Activity Chart & Quick Launcher */}
      <div className="space-y-4">
        <SkeletonBase className="h-5 w-36 rounded-md" />
        <div className="p-4 bg-[#141722] border border-slate-800/80 rounded-xl h-64 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <SkeletonBase className="h-3.5 w-28 rounded" />
            <SkeletonBase className="h-3 w-14 rounded" />
          </div>
          <div className="flex items-end justify-between gap-2 h-40 pt-4">
            {[40, 65, 30, 85, 50, 90, 70].map((h, i) => (
              <SkeletonBase key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </SkeletonContainer>
);

// 2. --- Recorder Studio Skeleton ---
export const RecorderSkeleton: React.FC = () => (
  <SkeletonContainer className="p-6 bg-[#0e1016] min-h-screen space-y-6">
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-6 w-48 rounded-lg" />
      <SkeletonBase className="h-8 w-32 rounded-xl" />
    </div>

    {/* Live Waveform Canvas Skeleton */}
    <div className="p-8 bg-[#141722] border border-slate-800/80 rounded-2xl h-64 flex flex-col items-center justify-center space-y-4">
      <div className="flex items-center justify-center gap-1.5 h-24 w-full px-12">
        {Array.from({ length: 32 }).map((_, i) => (
          <SkeletonBase key={i} className="w-1.5 rounded-full" style={{ height: `${20 + Math.sin(i * 0.4) * 60}%` }} />
        ))}
      </div>
      <SkeletonBase className="h-8 w-24 rounded-lg" />
    </div>

    {/* Controls Row */}
    <div className="flex items-center justify-center gap-4 py-4">
      <SkeletonBase className="w-12 h-12 rounded-full" />
      <SkeletonBase className="w-16 h-16 rounded-full" />
      <SkeletonBase className="w-12 h-12 rounded-full" />
    </div>
  </SkeletonContainer>
);

// 3. --- Meeting History Table Skeleton ---
export const HistorySkeleton: React.FC = () => (
  <SkeletonContainer className="p-6 bg-[#0e1016] min-h-screen space-y-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBase className="h-7 w-48 rounded-xl" />
        <SkeletonBase className="h-4 w-64 rounded-lg" />
      </div>
      <div className="flex items-center gap-3">
        <SkeletonBase className="h-9 w-64 rounded-xl" />
        <SkeletonBase className="h-9 w-24 rounded-xl" />
      </div>
    </div>

    {/* Table Layout */}
    <div className="bg-[#141722] border border-slate-800/80 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-800/80 flex justify-between">
        <SkeletonBase className="h-4 w-32 rounded" />
        <SkeletonBase className="h-4 w-24 rounded" />
      </div>
      <div className="divide-y divide-slate-800/50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <SkeletonBase className="w-9 h-9 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <SkeletonBase className="h-4 w-1/3 rounded" />
                <SkeletonBase className="h-3 w-1/4 rounded" />
              </div>
            </div>
            <SkeletonBase className="h-4 w-20 rounded" />
            <SkeletonBase className="h-4 w-16 rounded" />
            <SkeletonBase className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  </SkeletonContainer>
);

// 4. --- Transcript Studio Skeleton ---
export const TranscriptSkeleton: React.FC = () => (
  <SkeletonContainer className="p-6 bg-[#0e1016] min-h-screen space-y-6">
    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
      <div className="space-y-2">
        <SkeletonBase className="h-6 w-64 rounded-xl" />
        <SkeletonBase className="h-3.5 w-40 rounded" />
      </div>
      <div className="flex gap-2">
        <SkeletonBase className="h-8 w-20 rounded-lg" />
        <SkeletonBase className="h-8 w-24 rounded-lg" />
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Timeline Bar */}
      <div className="p-4 bg-[#141722] border border-slate-800/80 rounded-xl space-y-3">
        <SkeletonBase className="h-4 w-28 rounded" />
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBase key={i} className="h-6 w-full rounded" />
        ))}
      </div>

      {/* Main Transcript Segments */}
      <div className="lg:col-span-3 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 bg-[#141722] border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <SkeletonBase className="h-4 w-24 rounded-md" />
              <SkeletonBase className="h-3 w-14 rounded" />
            </div>
            <SkeletonBase className="h-4 w-full rounded" />
            <SkeletonBase className="h-4 w-4/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  </SkeletonContainer>
);

// 5. --- Executive Summary Skeleton ---
export const SummarySkeleton: React.FC = () => (
  <SkeletonContainer className="p-6 bg-[#0e1016] min-h-screen space-y-6">
    <div className="flex justify-between items-center">
      <SkeletonBase className="h-7 w-60 rounded-xl" />
      <SkeletonBase className="h-9 w-32 rounded-xl" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Executive Overview */}
      <div className="lg:col-span-2 p-6 bg-[#141722] border border-slate-800/80 rounded-2xl space-y-4">
        <SkeletonBase className="h-5 w-36 rounded" />
        <SkeletonBase className="h-4 w-full rounded" />
        <SkeletonBase className="h-4 w-11/12 rounded" />
        <SkeletonBase className="h-4 w-4/5 rounded" />
        
        <div className="pt-4 space-y-3">
          <SkeletonBase className="h-4.5 w-28 rounded" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBase key={i} className="h-3.5 w-full rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Action Items & Decisions */}
      <div className="space-y-6">
        <div className="p-5 bg-[#141722] border border-slate-800/80 rounded-2xl space-y-3">
          <SkeletonBase className="h-4 w-32 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBase key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
        <div className="p-5 bg-[#141722] border border-slate-800/80 rounded-2xl space-y-3">
          <SkeletonBase className="h-4 w-28 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBase key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </SkeletonContainer>
);

// 6. --- Total Meeting Analytics Skeleton ---
export const AnalyticsSkeleton: React.FC = () => (
  <SkeletonContainer className="p-6 bg-[#0e1016] min-h-screen space-y-6">
    <div className="flex justify-between items-center">
      <SkeletonBase className="h-7 w-64 rounded-xl" />
      <SkeletonBase className="h-8 w-48 rounded-xl" />
    </div>

    {/* 12 Compact KPI Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="p-3 bg-[#141722] border border-slate-800/80 rounded-xl space-y-2">
          <SkeletonBase className="h-3 w-16 rounded" />
          <SkeletonBase className="h-6 w-12 rounded-md" />
        </div>
      ))}
    </div>

    {/* Charts Row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-5 bg-[#141722] border border-slate-800/80 rounded-2xl h-64 space-y-4">
        <SkeletonBase className="h-4 w-40 rounded" />
        <SkeletonBase className="w-full h-44 rounded-xl" />
      </div>
      <div className="p-5 bg-[#141722] border border-slate-800/80 rounded-2xl h-64 space-y-4">
        <SkeletonBase className="h-4 w-36 rounded" />
        <SkeletonBase className="w-full h-44 rounded-xl" />
      </div>
    </div>
  </SkeletonContainer>
);

// 7. --- RAG AI Assistant Skeleton ---
export const QASkeleton: React.FC = () => (
  <SkeletonContainer className="p-6 bg-[#0e1016] min-h-screen flex flex-col">
    <div className="border-b border-slate-800/80 pb-4 mb-4 flex justify-between">
      <SkeletonBase className="h-6 w-48 rounded-lg" />
      <SkeletonBase className="h-8 w-32 rounded-xl" />
    </div>

    {/* Chat Message Stream */}
    <div className="flex-1 space-y-4 overflow-hidden p-2">
      <div className="flex gap-3 max-w-xl">
        <SkeletonBase className="w-8 h-8 rounded-full shrink-0" />
        <div className="p-4 bg-[#141722] rounded-2xl space-y-2 flex-1 border border-slate-800/80">
          <SkeletonBase className="h-4 w-full rounded" />
          <SkeletonBase className="h-4 w-3/4 rounded" />
        </div>
      </div>
      <div className="flex gap-3 max-w-xl ml-auto justify-end">
        <div className="p-4 bg-violet-600/20 rounded-2xl space-y-2 w-72 border border-violet-500/30">
          <SkeletonBase className="h-4 w-full rounded" />
        </div>
      </div>
    </div>

    {/* Input Box Skeleton */}
    <div className="mt-4 p-3 bg-[#141722] border border-slate-800/80 rounded-2xl flex items-center gap-3">
      <SkeletonBase className="h-5 flex-1 rounded-lg" />
      <SkeletonBase className="w-9 h-9 rounded-xl shrink-0" />
    </div>
  </SkeletonContainer>
);

// 8. --- Settings Page Skeleton ---
export const SettingsSkeleton: React.FC = () => (
  <SkeletonContainer className="p-6 bg-[#0e1016] min-h-screen space-y-6">
    <SkeletonBase className="h-7 w-40 rounded-xl" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBase key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
      <div className="md:col-span-3 p-6 bg-[#141722] border border-slate-800/80 rounded-2xl space-y-6">
        <SkeletonBase className="h-5 w-48 rounded" />
        <div className="space-y-4">
          <SkeletonBase className="h-12 w-full rounded-xl" />
          <SkeletonBase className="h-12 w-full rounded-xl" />
          <SkeletonBase className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </SkeletonContainer>
);
