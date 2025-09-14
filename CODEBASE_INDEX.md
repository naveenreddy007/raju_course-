# Affiliate Learning Platform - Complete Codebase Index

## Project Overview
This is a comprehensive affiliate learning platform built with Next.js 14, featuring user authentication, course management, payment processing, and a multi-level commission system.

## Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Payments**: Razorpay
- **Deployment**: Docker, Docker Compose
- **Package Manager**: Bun

## Project Structure

### Root Directory
- `package.json` - Project dependencies and scripts
- `next.config.js` - Next.js configuration with image domains and security headers
- `tsconfig.json` - TypeScript configuration with path aliases
- `tailwind.config.js` - Tailwind CSS configuration
- `prisma/schema.prisma` - Database schema with 15+ models
- `docker-compose.yml` - Production Docker setup
- `docker-compose.dev.yml` - Development Docker setup

### Source Code (`src/`)

#### App Router Structure (`src/app/`)
```
src/app/
├── globals.css                    # Global styles
├── layout.tsx                     # Root layout with AuthProvider
├── page.tsx                       # Homepage with hero, pricing, features
├── about/page.tsx                 # About page
├── admin/                         # Admin dashboard
│   ├── page.tsx
│   ├── login/page.tsx
│   └── api/                       # Admin API routes
├── api/                           # API routes
│   ├── auth/                      # Authentication endpoints
│   ├── courses/                   # Course management
│   ├── payments/                  # Payment processing
│   ├── dashboard/                 # User dashboard data
│   ├── blog/                      # Blog system
│   ├── newsletter/               # Newsletter subscription
│   └── notifications/             # Notification system
├── auth/                          # Authentication pages
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── verify-email/page.tsx
├── blog/                          # Blog pages
├── courses/                       # Course listing and details
├── dashboard/                     # User dashboard
│   ├── page.tsx                   # Main dashboard
│   ├── courses/page.tsx           # User's enrolled courses
│   ├── earnings/page.tsx          # Earnings and commissions
│   ├── profile/page.tsx           # User profile management
│   ├── referrals/page.tsx         # Referral management
│   ├── settings/page.tsx          # Account settings
│   └── withdraw/page.tsx          # Withdrawal requests
├── purchase/                      # Purchase flow
│   ├── page.tsx
│   ├── success/page.tsx
│   └── failed/page.tsx
└── test-signup/page.tsx           # Testing page
```

#### Components (`src/components/`)
```
src/components/
├── ui/                            # Reusable UI components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── textarea.tsx
│   ├── toast.tsx
│   ├── alert.tsx
│   ├── badge.tsx
│   ├── label.tsx
│   ├── navigation.tsx
│   ├── mobile-footer-menu.tsx
│   ├── error-boundary.tsx
│   └── success-message.tsx
└── admin/
    └── admin-navigation.tsx
```

#### Libraries and Utilities (`src/lib/`)
```
src/lib/
├── auth.tsx                       # Authentication context and hooks
├── supabase.ts                    # Supabase client configuration
├── prisma.ts                      # Prisma client instance
├── utils.ts                       # Utility functions (formatting, validation)
├── api-utils.ts                   # API utility functions
├── api-utils-simple.ts            # Simplified API utilities
├── commission.ts                  # Commission calculation logic
├── logger.ts                      # Logging utilities
├── razorpay.ts                    # Razorpay payment integration
└── admin-auth.ts                  # Admin authentication utilities
```

#### Middleware (`src/middleware/`)
```
src/middleware/
├── auth.ts                        # Authentication middleware
├── validation.ts                  # Request validation middleware
├── rate-limit.ts                  # Rate limiting middleware
├── rateLimiter.ts                 # Rate limiter implementation
└── ts                             # Main middleware entry point
```

#### Types (`src/types/`)
```
src/types/
└── index.ts                       # TypeScript type definitions
```

#### Hooks (`src/hooks/`)
```
src/hooks/
├── use-toast.ts                   # Toast notification hook
└── useMobileDetection.ts          # Mobile device detection hook
```

## Database Schema (Prisma)

### Core Models
1. **User** - User accounts with KYC verification
2. **Affiliate** - Affiliate system with referral hierarchy
3. **Commission** - Commission tracking for referrals
4. **Transaction** - Payment transaction records
5. **Referral** - Referral relationship tracking

### Learning Models
6. **Course** - Course content and metadata
7. **CourseModule** - Individual course modules/lessons
8. **Enrollment** - User course enrollments
9. **UserProgress** - Learning progress tracking

### Content Models
10. **BlogPost** - Blog content management
11. **NewsletterSubscription** - Email newsletter system

### Financial Models
12. **BankDetail** - User bank account information
13. **WithdrawalRequest** - Withdrawal request processing
14. **Notification** - User notification system

### Enums
- UserRole: USER, ADMIN, SUPER_ADMIN
- WithdrawalStatus: PENDING, APPROVED, REJECTED, etc.
- KYCStatus: PENDING, SUBMITTED, APPROVED, REJECTED
- PackageType: SILVER, GOLD, PLATINUM
- CommissionType: DIRECT_REFERRAL, INDIRECT_REFERRAL, BONUS
- TransactionType: COURSE_PURCHASE, COMMISSION_EARNED, WITHDRAWAL
- EnrollmentStatus: ACTIVE, COMPLETED, CANCELLED, EXPIRED
- NotificationType: COMMISSION_EARNED, COURSE_ENROLLED, etc.

## Key Features

### Authentication & Authorization
- Supabase Auth integration
- JWT token-based authentication
- Role-based access control (USER, ADMIN, SUPER_ADMIN)
- KYC verification system
- Email and phone verification

### Affiliate System
- Multi-level referral system (direct + indirect commissions)
- Referral code generation
- Commission tracking and calculation
- Withdrawal request system
- Bank account verification

### Learning Management
- Course creation and management
- Module-based course structure
- User enrollment and progress tracking
- Video content integration
- Certificate generation

### Payment Processing
- Razorpay integration
- Multiple package tiers (Silver, Gold, Platinum)
- GST calculation and handling
- Payment verification and webhooks
- Transaction history

### Content Management
- Blog post system with SEO optimization
- Newsletter subscription management
- Rich text content support
- Featured images and metadata

### Admin Dashboard
- User management
- Course administration
- Commission monitoring
- Withdrawal processing
- Analytics and reporting

## API Routes Structure

### Authentication APIs
- `POST /api/auth/register` - User registration with affiliate setup
- `POST /api/auth/login` - User login
- `POST /api/auth/user` - Get current user data
- `POST /api/auth/kyc` - KYC verification update
- `POST /api/auth/validate-referral` - Validate referral codes

### Course APIs
- `GET /api/courses` - List courses with pagination/filtering
- `POST /api/courses` - Create new course
- `GET /api/courses/[id]` - Get course details
- `PUT /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course
- `POST /api/courses/[id]/enroll` - Enroll in course

### Payment APIs
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment completion

### Dashboard APIs
- `GET /api/dashboard/stats` - User dashboard statistics
- `GET /api/dashboard/courses` - User's enrolled courses
- `GET /api/dashboard/earnings` - Earnings and commission data

### Admin APIs
- `GET /api/admin/users` - List all users
- `GET /api/admin/courses` - List all courses
- `GET /api/admin/stats` - Admin statistics
- `POST /api/admin/withdrawals/[id]` - Process withdrawal requests

## Security Features
- Rate limiting on API endpoints
- Input validation middleware
- CORS configuration
- Content Security Policy (CSP)
- XSS protection headers
- CSRF protection
- Secure cookie handling

## Development Setup
- Docker development environment
- Hot reload with Next.js
- TypeScript for type safety
- ESLint for code quality
- Prisma Studio for database management
- Environment-based configuration

## Deployment
- Docker containerization
- Multi-stage Docker builds
- Environment variable configuration
- Database migrations with Prisma
- Static asset optimization

## Architecture Patterns
- **App Router**: Next.js 13+ app directory structure
- **Server Components**: React Server Components for performance
- **API Routes**: Serverless API endpoints
- **Middleware**: Request processing pipeline
- **Context Providers**: React Context for state management
- **Custom Hooks**: Reusable logic extraction
- **Component Composition**: Modular UI components

## Data Flow
1. User registration → Supabase Auth → Database user creation → Affiliate setup
2. Course enrollment → Payment processing → Transaction creation → Commission calculation
3. Referral tracking → Commission distribution → Withdrawal processing
4. Content consumption → Progress tracking → Certificate generation

## Performance Optimizations
- Next.js Image optimization
- API response caching
- Database query optimization with Prisma
- Code splitting and lazy loading
- Bundle analysis and optimization

## Monitoring & Analytics
- Error tracking and logging
- Performance monitoring
- User activity tracking
- Commission analytics
- Payment success/failure tracking

This comprehensive index provides a complete overview of the Affiliate Learning Platform codebase, covering all major components, features, and architectural patterns.