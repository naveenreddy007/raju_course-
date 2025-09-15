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
      .eq('user_id', user.id)
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
      .select('*, referredUser:users!referrals_referred_user_id_fkey(*)')
      .eq('affiliate_id', affiliate.id);

    // Get commissions
    const { data: commissions } = await supabase
      .from('commissions')
      .select(`
        *,
        transaction:transactions!commissions_transaction_id_fkey(
          *,
          package:packages!transactions_package_id_fkey(*),
          user:users!transactions_user_id_fkey(*)
        )
      `)
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    // Get user's packages (purchased packages) with package details
    const { data: packages, error: packagesError } = await supabase
      .from('package_purchases')
      .select(`
        *,
        package:packages(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'SUCCESS')
      .order('created_at', { ascending: false });

    const packageStats = {
      total: packages?.length || 0,
      active: packages?.filter(p => p.status === 'SUCCESS').length || 0
    };

    // Get user's transactions
    const { data: userTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);

    // Calculate statistics
    const totalEarnings = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const totalPackages = userTransactions?.length || 0;
    const pendingCommissions = commissions?.filter(c => c.status === 'pending').length || 0;
    const paidCommissions = commissions?.filter(c => c.status === 'paid').length || 0;

    // Calculate detailed earnings
    const allCommissions = commissions || [];
    const directCommissions = allCommissions.filter(c => c.level === 1);
    const indirectCommissions = allCommissions.filter(c => c.level > 1);

    const directEarnings = directCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0);
    const indirectEarnings = indirectCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0);
    const pendingEarnings = allCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0);
    
    // Calculate available balance
    const totalWithdrawn = 0; // Would need withdrawal tracking
    const availableBalance = totalEarnings - totalWithdrawn;

    // Calculate referral statistics
    const totalReferrals = referrals?.length || 0;
    const activeReferrals = (referrals || []).filter(r => r.status === 'active').length;
    const pendingReferrals = (referrals || []).filter(r => r.status === 'pending').length;

    // Calculate package statistics
    const activePackages = (userTransactions || []).filter(t => t.status === 'completed').length;
    const packagesPurchased = userTransactions?.length || 0;

    // Current balance (simplified)
    const currentBalance = totalEarnings;

    // Combine recent activities
    const recentCommissions = commissions?.slice(0, 5).map(c => ({
      id: c.id,
      type: 'commission',
      amount: c.amount,
      description: `Commission from ${c.transaction?.user?.name || 'Unknown'} - ${c.transaction?.package?.name || 'Package'}`,
      date: c.created_at,
      status: c.status
    })) || [];

    const recentReferrals = referrals?.slice(0, 5).map(r => ({
      id: r.id,
      type: 'referral',
      amount: 0,
      description: `New referral: ${r.referredUser?.name || 'Unknown User'}`,
      date: r.created_at,
      status: 'completed'
    })) || [];

    // Combine activities
    const allActivities = [...recentCommissions, ...recentReferrals]
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
      data: {
        earnings: {
          total: totalEarnings,
          direct: directEarnings,
          indirect: indirectEarnings,
          pending: pendingEarnings,
          available: availableBalance,
          withdrawn: totalWithdrawn
        },
        referrals: {
          total: totalReferrals,
          active: activeReferrals,
          pending: pendingReferrals
        },
        packages: packages || [],
        recentActivities: allActivities,
        affiliate: affiliate ? {
          id: affiliate.id,
          referralCode: affiliate.referral_code,
          referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${affiliate.referral_code}`,
          status: affiliate.status,
          createdAt: affiliate.created_at
        } : null
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