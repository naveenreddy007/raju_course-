-- Initial Database Setup Migration
-- This creates all tables based on the Prisma schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom enums
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');
CREATE TYPE "PackageType" AS ENUM ('SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE "CommissionType" AS ENUM ('DIRECT_REFERRAL', 'INDIRECT_REFERRAL', 'BONUS', 'WITHDRAWAL');
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');
CREATE TYPE "TransactionType" AS ENUM ('COURSE_PURCHASE', 'COMMISSION_EARNED', 'WITHDRAWAL', 'REFUND', 'BONUS');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "NotificationType" AS ENUM ('COMMISSION_EARNED', 'COURSE_ENROLLED', 'KYC_UPDATE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'GENERAL');
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "avatar" TEXT,
  "role" "UserRole" DEFAULT 'USER',
  "isActive" BOOLEAN DEFAULT true,
  "panCard" TEXT UNIQUE,
  "aadharCard" TEXT,
  "kycStatus" "KYCStatus" DEFAULT 'PENDING',
  "kycDocuments" JSONB,
  "kycVerifiedAt" TIMESTAMP WITH TIME ZONE,
  "supabaseId" TEXT UNIQUE NOT NULL,
  "emailVerified" BOOLEAN DEFAULT false,
  "phoneVerified" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "lastLoginAt" TIMESTAMP WITH TIME ZONE
);

-- Create affiliates table
CREATE TABLE IF NOT EXISTS "affiliates" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "referralCode" TEXT UNIQUE NOT NULL,
  "parentId" TEXT REFERENCES "affiliates"("id"),
  "packageType" "PackageType" NOT NULL,
  "packagePrice" DECIMAL(10,2) NOT NULL,
  "purchaseDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "totalDirectEarnings" DECIMAL(10,2) DEFAULT 0,
  "totalIndirectEarnings" DECIMAL(10,2) DEFAULT 0,
  "totalWithdrawn" DECIMAL(10,2) DEFAULT 0,
  "currentBalance" DECIMAL(10,2) DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS "transactions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id"),
  "amount" DECIMAL(10,2) NOT NULL,
  "type" "TransactionType" NOT NULL,
  "status" "TransactionStatus" DEFAULT 'PENDING',
  "paymentId" TEXT,
  "paymentMethod" TEXT,
  "gatewayResponse" JSONB,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "processedAt" TIMESTAMP WITH TIME ZONE
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS "commissions" (
  "id" TEXT PRIMARY KEY,
  "amount" DECIMAL(10,2) NOT NULL,
  "commissionType" "CommissionType" NOT NULL,
  "level" INTEGER NOT NULL,
  "affiliateId" TEXT NOT NULL REFERENCES "affiliates"("id"),
  "fromAffiliateId" TEXT REFERENCES "affiliates"("id"),
  "transactionId" TEXT NOT NULL REFERENCES "transactions"("id"),
  "status" "CommissionStatus" DEFAULT 'PENDING',
  "paidAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS "referrals" (
  "id" TEXT PRIMARY KEY,
  "affiliateId" TEXT NOT NULL REFERENCES "affiliates"("id"),
  "referredUserId" TEXT NOT NULL REFERENCES "users"("id"),
  "commissionEarned" DECIMAL(10,2) DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("affiliateId", "referredUserId")
);

-- Create courses table
CREATE TABLE IF NOT EXISTS "courses" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "shortDescription" TEXT,
  "videoUrl" TEXT,
  "thumbnailUrl" TEXT,
  "duration" INTEGER,
  "price" DECIMAL(10,2) NOT NULL,
  "packageTypes" "PackageType"[] NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "isPublished" BOOLEAN DEFAULT false,
  "slug" TEXT UNIQUE NOT NULL,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "publishedAt" TIMESTAMP WITH TIME ZONE
);

-- Create course_modules table
CREATE TABLE IF NOT EXISTS "course_modules" (
  "id" TEXT PRIMARY KEY,
  "courseId" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "videoUrl" TEXT,
  "duration" INTEGER,
  "order" INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "isFree" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS "enrollments" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id"),
  "courseId" TEXT NOT NULL REFERENCES "courses"("id"),
  "transactionId" TEXT UNIQUE NOT NULL REFERENCES "transactions"("id"),
  "progressPercent" DECIMAL(5,2) DEFAULT 0,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "certificateUrl" TEXT,
  "status" "EnrollmentStatus" DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "courseId")
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS "user_progress" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL REFERENCES "course_modules"("id"),
  "watchedDuration" INTEGER DEFAULT 0,
  "isCompleted" BOOLEAN DEFAULT false,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "moduleId")
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "content" TEXT NOT NULL,
  "excerpt" TEXT,
  "featuredImage" TEXT,
  "authorId" TEXT NOT NULL REFERENCES "users"("id"),
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "isPublished" BOOLEAN DEFAULT false,
  "publishedAt" TIMESTAMP WITH TIME ZONE,
  "viewCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "userId" TEXT REFERENCES "users"("id"),
  "isActive" BOOLEAN DEFAULT true,
  "subscribedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "unsubscribedAt" TIMESTAMP WITH TIME ZONE
);

-- Create bank_details table
CREATE TABLE IF NOT EXISTS "bank_details" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id"),
  "bankName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "ifscCode" TEXT NOT NULL,
  "accountHolderName" TEXT NOT NULL,
  "isVerified" BOOLEAN DEFAULT false,
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id"),
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "readAt" TIMESTAMP WITH TIME ZONE,
  "actionUrl" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS "withdrawal_requests" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id"),
  "amount" DECIMAL(10,2) NOT NULL,
  "bankDetailId" TEXT REFERENCES "bank_details"("id"),
  "status" "WithdrawalStatus" DEFAULT 'PENDING',
  "adminNotes" TEXT,
  "processedById" TEXT REFERENCES "users"("id"),
  "processedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_supabase_id_idx" ON "users"("supabaseId");
CREATE INDEX IF NOT EXISTS "affiliates_referral_code_idx" ON "affiliates"("referralCode");
CREATE INDEX IF NOT EXISTS "affiliates_user_id_idx" ON "affiliates"("userId");
CREATE INDEX IF NOT EXISTS "transactions_user_id_idx" ON "transactions"("userId");
CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions"("status");
CREATE INDEX IF NOT EXISTS "commissions_affiliate_id_idx" ON "commissions"("affiliateId");
CREATE INDEX IF NOT EXISTS "commissions_transaction_id_idx" ON "commissions"("transactionId");
CREATE INDEX IF NOT EXISTS "courses_slug_idx" ON "courses"("slug");
CREATE INDEX IF NOT EXISTS "courses_published_idx" ON "courses"("isPublished");
CREATE INDEX IF NOT EXISTS "enrollments_user_id_idx" ON "enrollments"("userId");
CREATE INDEX IF NOT EXISTS "enrollments_course_id_idx" ON "enrollments"("courseId");
CREATE INDEX IF NOT EXISTS "blog_posts_slug_idx" ON "blog_posts"("slug");
CREATE INDEX IF NOT EXISTS "blog_posts_published_idx" ON "blog_posts"("isPublished");
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("isRead");

-- Enable Row Level Security (RLS)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "affiliates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "referrals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blog_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "newsletter_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bank_details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "withdrawal_requests" ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and anon roles
GRANT ALL ON "users" TO authenticated;
GRANT ALL ON "affiliates" TO authenticated;
GRANT ALL ON "transactions" TO authenticated;
GRANT ALL ON "commissions" TO authenticated;
GRANT ALL ON "referrals" TO authenticated;
GRANT ALL ON "courses" TO authenticated;
GRANT ALL ON "course_modules" TO authenticated;
GRANT ALL ON "enrollments" TO authenticated;
GRANT ALL ON "user_progress" TO authenticated;
GRANT ALL ON "blog_posts" TO authenticated;
GRANT ALL ON "newsletter_subscriptions" TO authenticated;
GRANT ALL ON "bank_details" TO authenticated;
GRANT ALL ON "notifications" TO authenticated;
GRANT ALL ON "withdrawal_requests" TO authenticated;

-- Grant read access to anon role for public data
GRANT SELECT ON "courses" TO anon;
GRANT SELECT ON "course_modules" TO anon;
GRANT SELECT ON "blog_posts" TO anon;
GRANT INSERT ON "newsletter_subscriptions" TO anon;

COMMIT;