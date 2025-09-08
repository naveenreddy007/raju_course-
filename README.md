# 🚀 Affiliate Learning Platform (Raju)

A comprehensive platform that combines **affiliate marketing (two-level income system)** with **video learning classes**, built for scalability, legal compliance, and sustainable business growth.

## 📋 Project Overview

### 🎯 Core Features
- **Two-Level Affiliate Commission System** (Silver/Gold/Platinum packages)
- **KYC Verification** with PAN card validation for fraud prevention
- **Video Learning Portal** with progress tracking
- **Course Management System** with enrollment capabilities
- **Transaction & Payment Tracking**
- **Blog & Newsletter System**
- **Mobile-First Responsive Design**
- **Real-time Notifications**

### 👥 Target Users
- **Learners**: Purchasing video courses and earning through referrals
- **Affiliates**: Earning commissions via direct and indirect referrals
- **Administrators**: Managing KYC, courses, and commission reports

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** (React framework with App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **ShadCN UI** for modern components
- **Framer Motion** for animations

### Backend
- **Next.js API Routes** for server-side logic
- **Supabase** (PostgreSQL, Auth, Storage)
- **Prisma ORM** for database management

### Development Tools
- **Bun** as package manager
- **Docker** for containerization
- **ESLint** for code quality

## 💰 Commission Structure

### Package Pricing
- **Silver**: ₹2,950 (Base: ₹2,500 + GST: ₹450)
- **Gold**: ₹5,310 (Base: ₹4,500 + GST: ₹810)
- **Platinum**: ₹8,850 (Base: ₹7,500 + GST: ₹1,350)

### Commission Rates
| User Package | Referral Package | Direct Commission | Indirect Commission |
|--------------|------------------|-------------------|---------------------|
| Silver       | Silver           | ₹1,875           | ₹150               |
| Silver       | Gold             | ₹2,375           | ₹350               |
| Silver       | Platinum         | ₹2,875           | ₹400               |
| Gold         | Silver           | ₹1,875           | ₹200               |
| Gold         | Gold             | ₹3,375           | ₹400               |
| Gold         | Platinum         | ₹3,875           | ₹600               |
| Platinum     | Silver           | ₹1,875           | ₹200               |
| Platinum     | Gold             | ₹3,375           | ₹500               |
| Platinum     | Platinum         | ₹5,625           | ₹1,000             |

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts with KYC verification
- **affiliates** - Referral system and commission tracking
- **commissions** - Two-level earning calculations
- **transactions** - Payment and transaction history
- **referrals** - Referral tracking system
- **courses** - Learning content management
- **course_modules** - Video lessons and modules
- **enrollments** - Student course registrations
- **user_progress** - Learning progress tracking
- **blog_posts** - Content management system
- **newsletter_subscriptions** - Email marketing
- **bank_details** - Payout account information
- **notifications** - User notification system

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- Bun package manager
- Supabase account
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Vk4011/raju.git
cd raju

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Update .env.local with your Supabase credentials

# Set up database
bun run db:push

# Start development server
bun run dev
```

### Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 🔧 Fresh Supabase Setup

This project includes a fresh Supabase integration setup for complete codebase indexing:

1. **Clean Configuration**: All Supabase environment variables have been reset
2. **Enhanced Client Setup**: Updated `src/lib/supabase.ts` with modern configuration
3. **Documentation**: Complete setup guide in `supabase/README.md`
4. **Migration Templates**: Database setup templates in `supabase/migrations/`

**To set up your Supabase integration:**

```bash
# 1. Follow the setup guide
cat supabase/README.md

# 2. Configure your environment variables
cp .env.example .env
# Update .env with your Supabase credentials

# 3. Test the connection
node scripts/test-supabase.js

# 4. Run database migrations
npm run db:push
```

**Features included in the fresh setup:**
- ✅ Modern Supabase client configuration with PKCE flow
- ✅ Real-time subscriptions with optimized settings
- ✅ Separate client and admin instances
- ✅ Enhanced error handling and validation
- ✅ TypeScript support with proper type definitions
- ✅ Comprehensive documentation and examples

## 📱 Features

### Authentication & KYC
- ✅ User registration with email verification
- ✅ PAN card validation for unique identification
- ✅ Secure login/logout functionality
- ✅ KYC status tracking and approval workflow

### Commission System
- ✅ Two-level affiliate structure
- ✅ Automated commission calculations
- ✅ Real-time earnings tracking
- ✅ Referral code generation
- ✅ Commission history and reports

### Course Management
- ✅ Video content delivery
- ✅ Course progress tracking
- ✅ Module-based learning structure
- ✅ Enrollment management
- ✅ Certificate generation

### User Interface
- ✅ Mobile-first responsive design
- ✅ Modern and minimalistic UI
- ✅ Smooth animations with Framer Motion
- ✅ Intuitive navigation (desktop + mobile)
- ✅ Dark/light mode support

## 🔧 Available Scripts

```bash
# Development
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server

# Database
bun run db:push      # Push schema to database
bun run db:studio    # Open Prisma Studio
bun run db:generate  # Generate Prisma client

# Docker
bun run docker:dev   # Start development with Docker
bun run docker:prod  # Build and run production Docker

# Testing
bun run test         # Run test scripts
```

## 🏗️ Architecture

```
┌───────────────┐
│   Frontend    │
│ (Next.js)     │
└───────┬───────┘
        │
┌───────▼────────┐
│   Backend API  │
│ (Next.js API)  │
└───────┬────────┘
        │
┌───────▼──────┐   ┌─────────────┐   ┌─────────────┐
│ Supabase DB  │   │ Payment     │   │ KYC Service │
│ (PostgreSQL) │   │ Gateway     │   │ (PAN/Aadhaar│
└──────────────┘   └─────────────┘   └─────────────┘
```

## 🔐 Security Features

- **PAN-based KYC** ensures unique user validation
- **Row Level Security (RLS)** with Supabase
- **JWT-based authentication**
- **HTTPS/SSL encryption**
- **Input validation and sanitization**
- **Rate limiting** (planned)

## 📝 Legal Compliance

- **GDPR compliant** data handling
- **India Data Protection Act** compliance
- **Financial transaction regulations**
- **Tax compliance** for affiliate commissions
- **KYC/AML compliance**

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Core platform development
- ✅ Two-level commission system
- ✅ KYC verification
- ✅ Course management
- ✅ Mobile-responsive design

### Phase 2 (Next)
- 🔄 Payment gateway integration (Razorpay)
- 🔄 Advanced reporting dashboard
- 🔄 Email/SMS notifications
- 🔄 Bulk course upload
- 🔄 Performance optimization

### Phase 3 (Future)
- 📱 Mobile app (React Native)
- 🎯 Advanced analytics
- 🔄 Multi-language support
- 🎨 White-label solutions
- 🌐 International expansion

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- 📧 Email: support@affiliatelearn.com
- 📱 Phone: +91-XXXXXXXXXX
- 💬 Discord: [Join our community]()

## 🙏 Acknowledgments

- **Supabase** for the amazing backend-as-a-service
- **Vercel** for Next.js and deployment platform
- **ShadCN** for beautiful UI components
- **Prisma** for excellent database tooling

---

**Built with ❤️ for the learning and affiliate marketing community**