import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-utils-simple';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/packages/purchase - Purchase a package
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user } = await requireAuth(request);

    // Get user from Supabase users table
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { packageId, paymentDetails } = body;

    // Validate required fields
    if (!packageId) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // Get the package details
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .eq('isActive', true)
      .single();

    if (packageError || !packageData) {
      return NextResponse.json(
        { success: false, error: 'Package not found or inactive' },
        { status: 404 }
      );
    }

    // Check if user already has this package
    const { data: existingPurchase } = await supabase
      .from('package_purchases')
      .select('*')
      .eq('user_id', dbUser.id)
      .eq('package_id', packageId)
      .eq('status', 'SUCCESS')
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { success: false, error: 'Package already purchased' },
        { status: 400 }
      );
    }

    // Create the package purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('package_purchases')
      .insert({
        user_id: dbUser.id,
        package_id: packageId,
        amount: packageData.finalPrice,
        payment_details: paymentDetails || {},
        status: 'SUCCESS' // In real implementation, this would be PENDING until payment is verified
      })
      .select()
      .single();

    if (purchaseError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create purchase record' },
        { status: 500 }
      );
    }

    // Process commissions for referrers
    // Get user's referrer if any
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', dbUser.id)
      .single();

    if (affiliate && affiliate.referred_by) {
      // Create commission for direct referrer
      const directCommission = (packageData.finalPrice * packageData.commissionRates.direct) / 100;
      
      await supabase
        .from('commissions')
        .insert({
          affiliate_id: affiliate.referred_by,
          referred_user_id: dbUser.id,
          transaction_id: purchase.id,
          package_id: packageId,
          amount: directCommission,
          commission_type: 'direct',
          status: 'pending'
        });

      // Get indirect referrer and create indirect commission
      const { data: directReferrer } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', affiliate.referred_by)
        .single();

      if (directReferrer && directReferrer.referred_by) {
        const indirectCommission = (packageData.finalPrice * packageData.commissionRates.indirect) / 100;
        
        await supabase
          .from('commissions')
          .insert({
            affiliate_id: directReferrer.referred_by,
            referred_user_id: dbUser.id,
            transaction_id: purchase.id,
            package_id: packageId,
            amount: indirectCommission,
            commission_type: 'indirect',
            status: 'pending'
          });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        purchase,
        package: packageData
      }
    });
  } catch (error) {
    console.error('Error purchasing package:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to purchase package'
      },
      { status: 500 }
    );
  }
}