import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-utils-simple';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await requireAuth(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get user's affiliate data
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!affiliate || affiliateError) {
      return NextResponse.json({
        success: true,
        data: {
          totalEarnings: 0,
          pendingEarnings: 0,
          paidEarnings: 0,
          commissions: [],
          referrals: [],
          stats: {
            totalReferrals: 0,
            activeReferrals: 0,
            totalCommissions: 0
          }
        }
      });
    }

    // Get commission data
    const { data: commissions, error: commissionsError } = await supabase
      .from('commissions')
      .select(`
        *,
        transactions (
          id,
          amount,
          description,
          users (
            name,
            email
          )
        )
      `)
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get referral data
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        *,
        users!referrals_referred_user_id_fkey (
          name,
          email,
          created_at
        )
      `)
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    if (commissionsError || referralsError) {
      console.error('Error fetching commissions or referrals:', commissionsError, referralsError);
      return NextResponse.json(
        { error: 'Failed to fetch earnings data' },
        { status: 500 }
      );
    }

    // Calculate earnings
    const totalEarnings = (commissions || []).reduce((sum, comm) => sum + comm.amount, 0);
    const pendingEarnings = (commissions || [])
      .filter(comm => comm.status === 'pending')
      .reduce((sum, comm) => sum + comm.amount, 0);
    const paidEarnings = (commissions || [])
      .filter(comm => comm.status === 'paid')
      .reduce((sum, comm) => sum + comm.amount, 0);

    // Calculate stats
    const stats = {
      totalReferrals: (referrals || []).length,
      activeReferrals: (referrals || []).filter(ref => 
        ref.users && ref.users.created_at
      ).length,
      totalCommissions: (commissions || []).length
    };

    // Format commission data
    const formattedCommissions = (commissions || []).map(comm => ({
      id: comm.id,
      amount: comm.amount,
      type: comm.type,
      status: comm.status,
      createdAt: comm.created_at,
      transaction: comm.transactions ? {
        id: comm.transactions.id,
        amount: comm.transactions.amount,
        description: comm.transactions.description,
        user: comm.transactions.users
      } : null
    }));

    // Format referral data
    const formattedReferrals = (referrals || []).map(ref => ({
      id: ref.id,
      referredUser: {
        name: ref.users?.name,
        email: ref.users?.email,
        joinedAt: ref.users?.created_at,
        totalPurchases: 0 // We'll need to calculate this separately if needed
      },
      createdAt: ref.created_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        affiliate: {
          referralCode: affiliate.referral_code,
          commissionRate: affiliate.commission_rate,
          totalEarnings: affiliate.total_earnings
        },
        earnings: {
          totalEarnings,
          pendingEarnings,
          paidEarnings
        },
        commissions: formattedCommissions,
        referrals: formattedReferrals,
        stats
      }
    });

  } catch (error) {
    console.error('Dashboard earnings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    );
  }
}