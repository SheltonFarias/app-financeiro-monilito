'use client'

import React from 'react'

export function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div className="progress-ring-container w-40 h-40">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
        <circle
          className="text-white/10"
          strokeWidth="12"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="70"
          cy="70"
        />
        <circle
          className="text-brand transition-all duration-1000 ease-out"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="70"
          cy="70"
        />
      </svg>
      <div className="progress-ring-text">
        <div className="progress-ring-pct">{percent.toFixed(1)}%</div>
        <div className="progress-ring-label">{label}</div>
      </div>
    </div>
  )
}
