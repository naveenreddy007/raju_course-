// Authentication related types
export interface User {
  id: string
  email: string
  phone?: string
  name: string
  avatar?: string
  role: UserRole
  isActive: boolean
  panCard?: string
  aadharCard?: string
  kycStatus: KYCStatus
  kycDocuments?: any
  kycVerifiedAt?: string
  supabaseId: string
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  affiliate?: Affiliate
}

export interface Affiliate {
  id: string
  userId: string
  referralCode: string
  parentId?: string
  packageType: PackageType
  packagePrice: number
  purchaseDate: string
  totalDirectEarnings: number
  totalIndirectEarnings: number
  totalWithdrawn: number
  currentBalance: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Commission {
  id: string
  amount: number
  commissionType: CommissionType
  level: number
  affiliateId: string
  fromAffiliateId?: string
  transactionId: string
  status: CommissionStatus
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  type: TransactionType
  status: TransactionStatus
  paymentId?: string
  paymentMethod?: string
  gatewayResponse?: any
  description?: string
  metadata?: any
  createdAt: string
  updatedAt: string
  processedAt?: string
}

export interface Course {
  id: string
  title: string
  description?: string
  shortDescription?: string
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  price: number
  packageTypes: PackageType[]
  isActive: boolean
  isPublished: boolean
  slug: string
  metaTitle?: string
  metaDescription?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  transactionId: string
  progressPercent: number
  completedAt?: string
  certificateUrl?: string
  status: EnrollmentStatus
  createdAt: string
  updatedAt: string
}

export interface WithdrawalRequest {
  id: string
  userId: string
  amount: number
  bankDetailId?: string
  status: WithdrawalStatus
  adminNotes?: string
  processedById?: string
  processedAt?: string
  createdAt: string
  updatedAt: string
}

// Enums
export enum UserRole {
  USER = 'USER'
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum KYCStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PackageType {
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

export enum CommissionType {
  DIRECT_REFERRAL = 'DIRECT_REFERRAL',
  INDIRECT_REFERRAL = 'INDIRECT_REFERRAL',
  BONUS = 'BONUS',
  WITHDRAWAL = 'WITHDRAWAL'
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export enum TransactionType {
  COURSE_PURCHASE = 'COURSE_PURCHASE',
  COMMISSION_EARNED = 'COMMISSION_EARNED',
  WITHDRAWAL = 'WITHDRAWAL',
  REFUND = 'REFUND',
  BONUS = 'BONUS'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum NotificationType {
  COMMISSION_EARNED = 'COMMISSION_EARNED',
  COURSE_ENROLLED = 'COURSE_ENROLLED',
  KYC_UPDATE = 'KYC_UPDATE',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  GENERAL = 'GENERAL'
}

// Auth related types
export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    name?: string
    avatar_url?: string
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  phone?: string
  referralCode?: string
}

export interface KYCData {
  panCard: string
  aadharCard?: string
  documents?: File[]
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (credentials: LoginCredentials) => Promise<{ error?: string }>
  signUp: (data: RegisterData) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateKYC: (data: KYCData) => Promise<{ error?: string }>
  refreshUser: () => Promise<void>
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
}