# Supabase Integration Setup Guide

This guide will help you set up a fresh Supabase integration for complete codebase indexing.

## Prerequisites

1. A Supabase account (https://supabase.com)
2. A new Supabase project created

## Setup Steps

### 1. Create a New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Enter project name and database password
5. Select a region close to your users
6. Click "Create new project"

### 2. Get Your Project Credentials

Once your project is ready:

1. Go to Settings > API
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the Supabase configuration in `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. Update the database URLs:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
   DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
   ```

### 4. Test the Connection

Run the test script to verify your connection:
```bash
node scripts/test-supabase.js
```

### 5. Set Up Database Schema

If you have existing database migrations, run:
```bash
npm run db:push
```

## Features Enabled

With this fresh setup, you get:

- ✅ **Authentication**: User sign-up, sign-in, and session management
- ✅ **Real-time subscriptions**: Live data updates
- ✅ **Row Level Security (RLS)**: Secure data access
- ✅ **Database operations**: Full CRUD operations
- ✅ **File storage**: Upload and manage files
- ✅ **Edge functions**: Serverless functions

## Client Usage

### Client-side (Browser)
```typescript
import { supabase } from '@/lib/supabase'

// Authentication
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Database operations
const { data: users } = await supabase
  .from('users')
  .select('*')
```

### Server-side (API routes)
```typescript
import { supabaseAdmin } from '@/lib/supabase'

// Admin operations (bypasses RLS)
const { data } = await supabaseAdmin
  .from('users')
  .select('*')
```

## Security Best Practices

1. **Never expose service role key** in client-side code
2. **Enable RLS** on all tables
3. **Use anon key** for client-side operations
4. **Use service role key** only on server-side
5. **Validate user permissions** in your application logic

## Troubleshooting

### Common Issues

1. **Connection refused**: Check your project URL and keys
2. **Permission denied**: Ensure RLS policies are configured
3. **Invalid JWT**: Regenerate your keys from Supabase dashboard

### Debug Mode

Enable debug logging by adding to your `.env`:
```env
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

## Next Steps

1. Set up your database schema
2. Configure RLS policies
3. Implement authentication flows
4. Add real-time subscriptions
5. Deploy to production

For more information, visit the [Supabase Documentation](https://supabase.com/docs).