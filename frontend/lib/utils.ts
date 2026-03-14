import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const LEVEL_THRESHOLDS = [
  { xp: 0, level: 1, title: "Trainee" },
  { xp: 200, level: 2, title: "Certified Volunteer" },
  { xp: 500, level: 3, title: "Festival Pro" },
  { xp: 1000, level: 4, title: "Festival Expert" },
]

export function calculateLevel(xp: number): { level: number; title: string; nextXp: number; progress: number } {
  let current = LEVEL_THRESHOLDS[0]
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.xp) current = threshold
  }
  const next = LEVEL_THRESHOLDS.find(t => t.xp > xp)
  const nextXp = next?.xp ?? current.xp
  const prevXp = current.xp
  const progress = next ? Math.round(((xp - prevXp) / (nextXp - prevXp)) * 100) : 100
  return { ...current, nextXp, progress }
}
