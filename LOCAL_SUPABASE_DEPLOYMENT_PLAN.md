# Local Supabase Deployment Plan

This document provides a comprehensive plan to deploy a local Supabase instance using Docker Compose, ensuring all services are properly configured with persistent volumes, and updating the environment variables to use local container endpoints.

## Overview

The goal is to replace the external Supabase dependencies with a local instance that provides all the same functionality:
- PostgreSQL database
- Authentication service
- Storage service
- Real-time service
- REST API service
- Web UI (Studio)

## Step 1: Create Docker Compose Configuration for Local Supabase with Persistent Volumes

### File: `docker-compose.local.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15
    container_name: supabase-db-local
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-local.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Supabase Studio (Web UI)
  studio:
    image: supabase/studio:latest
    container_name: supabase-studio-local
    environment:
      SUPABASE_URL: http://kong:8000
      SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTk2MDAwMDAwMH0.LOCAL_ANON_KEY
    ports:
      - "3001:3000"
    depends_on:
      - kong

  # Kong API Gateway
  kong:
    image: kong:2.8.1
    container_name: supabase-kong-local
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl,basic-auth
      KONG_NGINX_PROXY_PROXY_BUFFER_SIZE: 160k
      KONG_NGINX_PROXY_PROXY_BUFFERS: 64 160k
    volumes:
      - ./kong.yml:/var/lib/kong/kong.yml
    ports:
      - "8000:8000"
      - "8443:8443"
    depends_on:
      - auth

  # Supabase Auth
  auth:
    image: supabase/gotrue:v2.44.0
    container_name: supabase-auth-local
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: http://localhost:8000

      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgresql://postgres:postgres@db:5432/postgres

      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_ISSUER: http://localhost:8000/auth/v1
      GOTRUE_JWT_SECRET: super-secret-jwt-token-with-at-least-32-characters-long

      GOTRUE_SITE_URL: http://localhost:3000
      GOTRUE_URI_ALLOW_LIST: ""
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_EXTERNAL_EMAIL_ENABLED: true
      GOTRUE_MAILER_AUTOCONFIRM: true
      GOTRUE_SMTP_ADMIN_EMAIL: roprly@bilvanaturals.online
      GOTRUE_SMTP_HOST: smtp.hostinger.com
      GOTRUE_SMTP_PORT: 465
      GOTRUE_SMTP_SECURE: true
      GOTRUE_SMTP_USER: roprly@bilvanaturals.online
      GOTRUE_SMTP_PASS: Who@reddamma999
      GOTRUE_SMTP_SENDER_NAME: KBR & Associates
      GOTRUE_MAILER_URLPATHS_INVITE: /auth/v1/verify
      GOTRUE_MAILER_URLPATHS_CONFIRMATION: /auth/v1/verify
      GOTRUE_MAILER_URLPATHS_RECOVERY: /auth/v1/verify
      GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: /auth/v1/verify

      GOTRUE_EXTERNAL_GOOGLE_ENABLED: false
      GOTRUE_EXTERNAL_GITHUB_ENABLED: false
      GOTRUE_EXTERNAL_GITLAB_ENABLED: false
      GOTRUE_EXTERNAL_BITBUCKET_ENABLED: false
      GOTRUE_EXTERNAL_APPLE_ENABLED: false
      GOTRUE_EXTERNAL_FACEBOOK_ENABLED: false
      GOTRUE_EXTERNAL_MICROSOFT_ENABLED: false
      GOTRUE_EXTERNAL_TWILIO_ENABLED: false
      GOTRUE_EXTERNAL_DISCORD_ENABLED: false
    ports:
      - "9999:9999"
    depends_on:
      - db
    command: >
      sh -c "/bin/set-migration.sh && /bin/gotrue"

  # Supabase REST API
  rest:
    image: postgrest/postgrest:v11.2.0
    container_name: supabase-rest-local
    environment:
      PGRST_DB_URI: postgresql://postgres:postgres@db:5432/postgres
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_DB_USE_LEGACY_GUCS: false
      PGRST_JWT_SECRET: super-secret-jwt-token-with-at-least-32-characters-long
    depends_on:
      - db
    ports:
      - "3002:3000"

  # Supabase Realtime
  realtime:
    image: supabase/realtime:v2.27.1
    container_name: supabase-realtime-local
    environment:
      PORT: 4000
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_NAME: postgres
      DB_AFTER_CONNECT_QUERY: 'SET statement_timeout TO 60000'
      DB_ENC_KEY: super-secret-jwt-token-with-at-least-32-characters-long
      API_JWT_SECRET: super-secret-jwt-token-with-at-least-32-characters-long
      FLY_ALLOC_ID: fly123
      FLY_APP_NAME: realtime
      SECRET_KEY_BASE: UpNVntn3cDxHJpq99YMc1T1AQgQpc8kfWoUvCYTEnpp=
      ERL_AFLAGS: -proto inet +pc unicode
      ENABLE_TAILSCALE: false
      DNS_NODES: "realtime@realtime.supabase-realtime-local"
    depends_on:
      - db
    ports:
      - "4000:4000"
    command: >
      sh -c "/app/bin/migrate && /app/bin/realtime"

  # Supabase Storage
  storage:
    image: supabase/storage-api:v0.43.2
    container_name: supabase-storage-local
    environment:
      ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTk2MDAwMDAwMH0.LOCAL_ANON_KEY
      SERVICE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJlZiI6ImxvY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTYwMDAwMDAwfQ.LOCAL_SERVICE_ROLE_KEY
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: super-secret-jwt-token-with-at-least-32-characters-long
      DATABASE_URL: postgresql://postgres:postgres@db:5432/postgres
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: stub
      GLOBAL_S3_BUCKET: stub
      ENABLE_IMAGE_TRANSFORMATION: true
      IMGPROXY_URL: http://imgproxy:5001
    depends_on:
      - rest
      - db
    ports:
      - "5000:5000"

  # Supabase Imgproxy
  imgproxy:
    image: darthsim/imgproxy:v3.8.0
    container_name: supabase-imgproxy-local
    environment:
      IMGPROXY_BIND: ":5001"
      IMGPROXY_LOCAL_FILESYSTEM_ROOT: /var/lib/storage
      IMGPROXY_USE_ETAG: "true"
      IMGPROXY_ENABLE_WEBP_DETECTION: "true"
    volumes:
      - storage_data:/var/lib/storage
    depends_on:
      - storage

  # Supabase Meta
  meta:
    image: supabase/postgres-meta:v0.67.0
    container_name: supabase-meta-local
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: db
      PG_META_DB_PORT: 5432
      PG_META_DB_NAME: postgres
      PG_META_DB_USER: postgres
      PG_META_DB_PASSWORD: postgres
    depends_on:
      - db
    ports:
      - "8080:8080"

  # Supabase Functions
  functions:
    image: supabase/edge-runtime:v1.10.3
    container_name: supabase-functions-local
    environment:
      JWT_SECRET: super-secret-jwt-token-with-at-least-32-characters-long
    depends_on:
      - rest
      - db
    ports:
      - "9000:9000"
    volumes:
      - ./functions:/home/deno/functions:ro

volumes:
  postgres_data:
    driver: local
  storage_data:
    driver: local
```

### File: `kong.yml`

```yaml
_format_version: "1.1"
_transform: true

services:
  - name: auth-v1
    url: http://auth:9999/verify
    routes:
      - name: auth-v1
        strip_path: true
        paths:
          - /auth/v1/
  - name: rest-v1
    url: http://rest:3000/
    routes:
      - name: rest-v1
        strip_path: true
        paths:
          - /rest/v1/
  - name: realtime-v1
    url: http://realtime:4000/socket/
    routes:
      - name: realtime-v1
        strip_path: true
        paths:
          - /realtime/v1/
  - name: storage-v1
    url: http://storage:5000/
    routes:
      - name: storage-v1
        strip_path: true
        paths:
          - /storage/v1/
  - name: functions-v1
    url: http://functions:9000/
    routes:
      - name: functions-v1
        strip_path: true
        paths:
          - /functions/v1/

plugins:
  - name: cors
    config:
      origins:
        - "*"
      methods:
        - GET
        - POST
        - PUT
        - PATCH
        - DELETE
        - OPTIONS
      headers:
        - Accept
        - Accept-Language
        - Content-Language
        - Content-Type
        - Authorization
        - apikey
        - X-Client-Info
```

## Step 2: Update Environment Variables in .env and .env.local to Use Local Container Endpoints

### File: `.env`

```bash
# Database (Local PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/postgres

# Local Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTk2MDAwMDAwMH0.LOCAL_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJlZiI6ImxvY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTYwMDAwMDAwfQ.LOCAL_SERVICE_ROLE_KEY

# NextAuth (Testing)
NEXTAUTH_SECRET=+8Gctvaw8uBKMtDPp296e0B0PY3hdp3bJ0eJlT2xQs0=
NEXTAUTH_URL=http://localhost:3000

# Razorpay (Testing - use test keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=5TVK1iA2npjluW6vDb0EXIn1
RAZORPAY_SECRET=rzp_test_tqnBF5G0r15IsfNxgR8S

# Email Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=roprly@bilvanaturals.online
SMTP_PASSWORD=Who@reddamma999
FROM_EMAIL=roprly@bilvanaturals.online
FROM_NAME=KBR & Associates

# IMAP Configuration (for reading emails)
IMAP_HOST=imap.hostinger.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=roprly@bilvanaturals.online
IMAP_PASSWORD=Who@reddamma999

# POP3 Configuration (alternative)
POP_HOST=pop.hostinger.com
POP_PORT=995
POP_SECURE=true

# KYC API (Testing)
KYC_API_KEY=test_kyc_api_key
KYC_API_URL=http://localhost:3000/api/kyc

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### File: `.env.local`

```bash
# Database (Local PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/postgres

# Local Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTk2MDAwMDAwMH0.LOCAL_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1sb2NhbCIsInJlZiI6ImxvY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTYwMDAwMDAwfQ.LOCAL_SERVICE_ROLE_KEY

# NextAuth (Testing)
NEXTAUTH_SECRET=+8Gctvaw8uBKMtDPp296e0B0PY3hdp3bJ0eJlT2xQs0=
NEXTAUTH_URL=http://localhost:3000

# Razorpay (Testing - use test keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID=5TVK1iA2npjluW6vDb0EXIn1
RAZORPAY_SECRET=rzp_test_tqnBF5G0r15IsfNxgR8S

# Email Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=roprly@bilvanaturals.online
SMTP_PASSWORD=Who@reddamma999
FROM_EMAIL=roprly@bilvanaturals.online
FROM_NAME=KBR & Associates

# IMAP Configuration (for reading emails)
IMAP_HOST=imap.hostinger.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=roprly@bilvanaturals.online
IMAP_PASSWORD=Who@reddamma999

# POP3 Configuration (alternative)
POP_HOST=pop.hostinger.com
POP_PORT=995
POP_SECURE=true

# KYC API (Testing)
KYC_API_KEY=test_kyc_api_key
KYC_API_URL=http://localhost:3000/api/kyc

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Set Up Database Initialization Scripts for Local Supabase

### File: `scripts/init-local.sql`

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types (enums)
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

-- Create tables based on Prisma schema
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "panCard" TEXT,
    "aadharCard" TEXT,
    "kycStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "kycDocuments" JSONB,
    "kycVerifiedAt" TIMESTAMP(3),
    "supabaseId" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create other tables based on your Prisma schema
-- (Include all tables from your Prisma schema)

-- Create unique constraints
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "users_panCard_key" ON "users"("panCard");
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");

-- Create indexes for better performance
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_kycStatus_idx" ON "users"("kycStatus");
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- Grant permissions to authenticated and service roles
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Set default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
```

## Step 4: Configure Application to Use Local Supabase

### File: `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost:8000'],
    unoptimized: false,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Optimize webpack for development
      config.optimization.minimize = false;
      config.devtool = 'eval-source-map';
    }
    return config;
  },
  experimental: {
    // Enable SWC for faster compilation
    swcPlugins: [],
  },
};

module.exports = nextConfig;
```

### File: `package.json` (add these scripts)

```json
"scripts": {
  "dev:local": "docker-compose -f docker-compose.local.yml up -d && bun run dev",
  "db:local": "docker-compose -f docker-compose.local.yml up -d db",
  "supabase:local": "docker-compose -f docker-compose.local.yml up -d",
  "stop:local": "docker-compose -f docker-compose.local.yml down",
  "reset:local": "docker-compose -f docker-compose.local.yml down -v"
}
```

## Step 5: Test Local Supabase Integration

1. Start the local Supabase instance:
   ```bash
   docker-compose -f docker-compose.local.yml up -d
   ```

2. Check if all containers are running:
   ```bash
   docker-compose -f docker-compose.local.yml ps
   ```

3. Verify you can access Supabase Studio at http://localhost:3001

4. Check if PostgreSQL is accessible at localhost:5432

5. Run the validation script:
   ```bash
   node validate-config.js
   ```

6. Run the detailed Supabase test:
   ```bash
   node test-supabase-detailed.js
   ```

## Step 6: Fix Database Permission Issues in Local Supabase

1. Connect to the database:
   ```bash
   docker exec -it supabase-db-local psql -U postgres -d postgres
   ```

2. Run the following SQL commands:
   ```sql
   -- Disable RLS temporarily for testing
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE affiliates DISABLE ROW LEVEL SECURITY;
   ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE commissions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
   ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
   ALTER TABLE course_modules DISABLE ROW LEVEL SECURITY;
   ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
   ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
   ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
   ALTER TABLE newsletter_subscriptions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE bank_details DISABLE ROW LEVEL SECURITY;
   ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
   ALTER TABLE withdrawal_requests DISABLE ROW LEVEL SECURITY;

   -- Grant permissions to authenticated and service roles
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

   -- Set default permissions for future tables
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
   ```

3. Run the validation script again:
   ```bash
   node validate-config.js
   ```

4. Run the detailed Supabase test:
   ```bash
   node test-supabase-detailed.js
   ```

## Step 7: Verify Middleware Loads Correctly with Local Supabase

1. Start the development server:
   ```bash
   bun run dev:local
   ```

2. Check the console output for middleware compilation messages

3. Test accessing a protected route to verify middleware is working

## Step 8: Test All CRUD Operations with Local Supabase

1. Create test scripts for each CRUD operation

2. Test user creation:
   ```javascript
   // Create a file test-user-creation.js
   const { createClient } = require('@supabase/supabase-js');
   require('dotenv').config();

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

   const supabase = createClient(supabaseUrl, supabaseServiceKey);

   async function testUserCreation() {
     const { data, error } = await supabase.auth.admin.createUser({
       email: 'test@example.com',
       password: 'password123',
       email_confirm: true
     });

     if (error) {
       console.error('Error creating user:', error);
     } else {
       console.log('User created successfully:', data);
     }
   }

   testUserCreation();
   ```

3. Run the test:
   ```bash
   node test-user-creation.js
   ```

4. Create similar tests for other CRUD operations

## Step 9: Confirm Development Server Runs Without Errors

1. Start the development server:
   ```bash
   bun run dev:local
   ```

2. Check for any error messages in the console

3. Verify the server is listening on port 3000

4. Test accessing the application in a browser

## Step 10: Test Data Persistence Across Container Restarts

1. Create some test data in the database

2. Stop the containers:
   ```bash
   docker-compose -f docker-compose.local.yml down
   ```

3. Start the containers again:
   ```bash
   docker-compose -f docker-compose.local.yml up -d
   ```

4. Verify that the test data still exists

5. Test with a restart of the database container specifically:
   ```bash
   docker-compose -f docker-compose.local.yml restart db
   ```

6. Verify data persistence again

## Final Verification

After completing all steps, run a comprehensive test of the entire application:

1. Start the local Supabase instance: `bun run supabase:local`
2. Start the development server: `bun run dev`
3. Run the validation script: `node validate-config.js`
4. Run the API endpoint tests: `node test-api-endpoints.js`
5. Manually test the application in a browser

By following these steps, you should have a fully functional local development environment with a local Supabase instance, eliminating all third-party dependencies during development. The application will have persistent storage, proper environment configurations, and comprehensive testing infrastructure.