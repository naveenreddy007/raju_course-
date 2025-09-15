import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-utils-simple';
import { createClient } from '@supabase/supabase-js';

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

    // Get user's affiliate data
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('userId', user.id)
      .single();

    if (affiliateError && affiliateError.code !== 'PGRST116') {
      console.error('Affiliate lookup error:', affiliateError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch affiliate data' },
        { status: 500 }
      );
    }

    if (!affiliate) {
      return NextResponse.json({
        success: true,
        stats: {
          totalEarnings: 0,
          directEarnings: 0,
          indirectEarnings: 0,
          pendingEarnings: 0,
          totalReferrals: 0,
          activeReferrals: 0,
          directReferrals: 0,
          indirectReferrals: 0,
          coursesCompleted: 0,
          currentBalance: 0,
          totalWithdrawn: 0,
          packagesPurchased: 0
        },
        recentActivities: [],
        referralStats: {
          totalClicks: 0,
          conversionRate: 0,
          topPerformingPackage: null
        }
      });
    }

    // Get referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*, referredUser:users!referrals_referredUserId_fkey(*)')
      .eq('affiliateId', affiliate.id);

    // Get commissions
    const { data: commissions } = await supabase
      .from('commissions')
      .select(`
        *,
        transaction:transactions!commissions_transactionId_fkey(
          *,
          package:packages!transactions_packageId_fkey(*),
          user:users!transactions_userId_fkey(*)
        )
      `)
      .eq('affiliateId', affiliate.id)
      .order('createdAt', { ascending: false });

    // Get user's transactions
    const { data: userTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('userId', user.id);

    // Calculate statistics
    const allCommissions = commissions || [];
    const paidCommissions = allCommissions.filter(c => c.status === 'PAID');
    const pendingCommissions = allCommissions.filter(c => c.status === 'PENDING');
    const directCommissions = allCommissions.filter(c => c.level === 1);
    const indirectCommissions = allCommissions.filter(c => c.level > 1);

    const totalEarnings = paidCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const directEarnings = directCommissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + (c.amount || 0), 0);
    const indirectEarnings = indirectCommissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + (c.amount || 0), 0);
    const pendingEarnings = pendingCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);

    // Calculate referral statistics
    const totalReferrals = referrals?.length || 0;
    const activeReferrals = totalReferrals; // Simplified for now
    const directReferrals = totalReferrals;
    const indirectReferrals = 0;

    // Package statistics
    const packagesPurchased = userTransactions?.length || 0;

    // Current balance (simplified)
    const currentBalance = totalEarnings;
    const totalWithdrawn = 0; // Would need withdrawal tracking

    // Recent activities
    const recentActivities = allCommissions.slice(0, 10).map(commission => ({
      id: commission.id,
      type: 'commission',
      description: `Commission from ${commission.transaction?.package?.name || 'package'} purchase`,
      amount: commission.amount || 0,
      date: new Date(commission.createdAt).toLocaleDateString(),
      status: commission.status
    }));

    // Add referral activities
    const recentReferrals = (referrals || []).slice(0, 5).map(referral => ({
      id: `ref-${referral.id}`,
      type: 'referral',
      description: `New referral: ${referral.referredUser?.name || referral.referredUser?.email || 'User'}`,
      amount: 0,
      date: new Date(referral.createdAt).toLocaleDateString(),
      status: 'completed'
    }));

    // Combine activities
    const allActivities = [...recentActivities, ...recentReferrals]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Package performance stats
    const packageStats = allCommissions.reduce((acc, commission) => {
      const packageName = commission.transaction?.package?.name || 'Unknown';
      if (!acc[packageName]) {
        acc[packageName] = { count: 0, earnings: 0 };
      }
      acc[packageName].count++;
      acc[packageName].earnings += commission.amount || 0;
      return acc;
    }, {} as Record<string, { count: number; earnings: number }>);

    const topPerformingPackage = Object.entries(packageStats)
      .sort(([,a], [,b]) => b.earnings - a.earnings)[0]?.[0] || null;

    const conversionRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalEarnings,
        directEarnings,
        indirectEarnings,
        pendingEarnings,
        totalReferrals,
        activeReferrals,
        directReferrals,
        indirectReferrals,
        coursesCompleted: 0,
        currentBalance,
        totalWithdrawn,
        packagesPurchased
      },
      recentActivities: allActivities,
      referralStats: {
        totalClicks: affiliate.totalClicks || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        topPerformingPackage,
        packageStats
      },
      affiliate: {
        referralCode: affiliate.referralCode,
        referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${affiliate.referralCode}`,
        joinedAt: affiliate.createdAt
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}