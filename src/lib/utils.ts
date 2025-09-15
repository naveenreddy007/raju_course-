import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const packagePricing = {
  SILVER: {
    base: 2500,
    gst: 450,
    final: 2950,
    commissions: {
      direct: {
        silver: 1875,
        gold: 2375,
        platinum: 2875
      },
      indirect: {
        silver: 150,
        gold: 350,
        platinum: 400
      }
    }
  },
  GOLD: {
    base: 4500,
    gst: 810,
    final: 5310,
    commissions: {
      direct: {
        silver: 1875,
        gold: 3375,
        platinum: 3875
      },
      indirect: {
        silver: 200,
        gold: 400,
        platinum: 600
      }
    }
  },
  PLATINUM: {
    base: 7500,
    gst: 1350,
    final: 8850,
    commissions: {
      direct: {
        silver: 1875,
        gold: 3375,
        platinum: 5625
      },
      indirect: {
        silver: 200,
        gold: 500,
        platinum: 1000
      }
    }
  }
} as const;

export type PackageType = keyof typeof packagePricing

export function validatePAN(pan: string): boolean {
  // PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan.toUpperCase())
}
