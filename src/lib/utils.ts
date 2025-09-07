import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency for Indian Rupees
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount)
}

// Generate referral code
export function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase()
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${cleanName.substring(0, 4)}${randomSuffix}`
}

// Calculate commission based on user package and referral package
export function calculateCommission(
  userPackage: 'SILVER' | 'GOLD' | 'PLATINUM',
  referralPackage: 'SILVER' | 'GOLD' | 'PLATINUM',
  level: 1 | 2
): number {
  const commissionRates = {
    SILVER: {
      direct: { SILVER: 1875, GOLD: 2375, PLATINUM: 2875 },
      indirect: { SILVER: 150, GOLD: 350, PLATINUM: 400 }
    },
    GOLD: {
      direct: { SILVER: 1875, GOLD: 3375, PLATINUM: 3875 },
      indirect: { SILVER: 200, GOLD: 400, PLATINUM: 600 }
    },
    PLATINUM: {
      direct: { SILVER: 1875, GOLD: 3375, PLATINUM: 5625 },
      indirect: { SILVER: 200, GOLD: 500, PLATINUM: 1000 }
    }
  }

  return level === 1 
    ? commissionRates[userPackage].direct[referralPackage]
    : commissionRates[userPackage].indirect[referralPackage]
}

// Package pricing
export const packagePricing = {
  SILVER: { base: 2500, gst: 450, final: 2950 },
  GOLD: { base: 4500, gst: 810, final: 5310 },
  PLATINUM: { base: 7500, gst: 1350, final: 8850 }
}

// Validate PAN card format
export function validatePAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan)
}

// Validate Indian mobile number
export function validateMobile(mobile: string): boolean {
  const mobileRegex = /^[6-9]\d{9}$/
  return mobileRegex.test(mobile)
}

// Generate unique transaction ID
export function generateTransactionId(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `TXN${timestamp}${random}`
}

// Format date for Indian locale
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Slugify text for URLs
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}