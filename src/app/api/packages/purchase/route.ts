import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// POST /api/packages/purchase - Purchase a package
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
    const packageData = await prisma.package.findUnique({
      where: { id: packageId }
    });

    if (!packageData || !packageData.isActive) {
      return NextResponse.json(
        { success: false, error: 'Package not found or inactive' },
        { status: 404 }
      );
    }

    // Check if user already has this package
    const existingPurchase = await prisma.packagePurchase.findFirst({
      where: {
        userId: dbUser.id,
        packageId: packageId,
        status: 'SUCCESS'
      }
    });

    if (existingPurchase) {
      return NextResponse.json(
        { success: false, error: 'Package already purchased' },
        { status: 400 }
      );
    }

    // Create the package purchase
    const purchase = await prisma.packagePurchase.create({
      data: {
        userId: dbUser.id,
        packageId: packageId,
        amount: packageData.price,
        paymentDetails: paymentDetails || {},
        status: 'SUCCESS' // In real implementation, this would be PENDING until payment is verified
      }
    });

    // Process commissions for referrers using the commission calculator
    const { calculateCommissions, createCommissionRecords, getPackageCommissionRates } = await import('@/utils/commissionCalculator');
    
    const commissionRates = getPackageCommissionRates(packageData.name);
    const commissions = await calculateCommissions(
      purchase.id,
      dbUser.id,
      packageData.price,
      commissionRates
    );

    if (commissions.length > 0) {
      await createCommissionRecords(commissions, purchase.id);
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
  } finally {
    await prisma.$disconnect();
  }
}