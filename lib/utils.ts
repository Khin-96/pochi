import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function formatTime(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    minute: "numeric",
  }).format(date)
}

export function formatTimeRemaining(dateString: string) {
  const deadline = new Date(dateString)
  const now = new Date()

  const diffTime = deadline.getTime() - now.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} left`
  }

  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} left`
  }

  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60))
  return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} left`
}
