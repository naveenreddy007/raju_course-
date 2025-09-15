import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// POST /api/referrals/generate - Generate or get referral code and link
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id }
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate referral code if user doesn't have one
    let referralCode = dbUser.referralCode;
    if (!referralCode) {
      // Generate a unique referral code
      referralCode = generateReferralCode(dbUser.name || dbUser.email);
      
      // Ensure uniqueness
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await prisma.user.findUnique({
          where: { referralCode }
        });
        
        if (!existing) {
          isUnique = true;
        } else {
          referralCode = generateReferralCode(dbUser.name || dbUser.email, attempts + 1);
          attempts++;
        }
      }

      // Update user with referral code
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { referralCode }
      });
    }

    const body = await request.json();
    const { platform } = body;

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/register?ref=${referralCode}`;
    
    // Generate platform-specific sharing links
    const sharingLinks = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`🚀 Join our affiliate marketing platform and start earning! 💰\n\nChoose from 3 packages:\n• Silver (₹2,950) - 10% direct, 5% indirect commission\n• Gold (₹5,310) - 15% direct, 8% indirect commission\n• Platinum (₹8,850) - 20% direct, 12% indirect commission\n\nUse my referral link: ${referralLink}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('🚀 Join our affiliate marketing platform and start earning! Choose from Silver, Gold, or Platinum packages.')}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('🚀 Join our affiliate marketing platform! Choose from 3 packages and start earning commissions.')}`
    };

    return NextResponse.json({
      success: true,
      data: {
        referralCode,
        referralLink,
        sharingLink: platform ? sharingLinks[platform as keyof typeof sharingLinks] : null,
        allSharingLinks: sharingLinks
      }
    });
  } catch (error) {
    console.error('Error generating referral:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate referral'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to generate referral code
function generateReferralCode(name: string, attempt: number = 0): string {
  // Clean the name and take first 3 characters
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const namePrefix = cleanName.substring(0, 3).padEnd(3, 'X');
  
  // Generate random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  // Add attempt suffix if needed
  const suffix = attempt > 0 ? attempt.toString() : '';
  
  return `${namePrefix}${randomNum}${suffix}`;
}