import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn helper: merge Tailwind classes without conflicts */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
