import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// POST /api/commissions/payout - Request payout for earned commissions
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
    const { amount, paymentMethod, paymentDetails } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['bank_transfer', 'upi', 'wallet'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Valid payment method is required (bank_transfer, upi, wallet)' },
        { status: 400 }
      );
    }

    if (!paymentDetails) {
      return NextResponse.json(
        { success: false, error: 'Payment details are required' },
        { status: 400 }
      );
    }

    // Validate payment details based on method
    const validationError = validatePaymentDetails(paymentMethod, paymentDetails);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Check available balance (paid commissions that haven't been paid out)
    const availableBalance = await prisma.commission.aggregate({
      where: {
        userId: dbUser.id,
        status: 'PAID'
      },
      _sum: {
        amount: true
      }
    });

    // Check pending payout requests
    const pendingPayouts = await prisma.payoutRequest.aggregate({
      where: {
        userId: dbUser.id,
        status: {
          in: ['PENDING', 'PROCESSING']
        }
      },
      _sum: {
        amount: true
      }
    });

    // Check completed payouts
    const completedPayouts = await prisma.payoutRequest.aggregate({
      where: {
        userId: dbUser.id,
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    });

    const totalAvailable = (availableBalance._sum.amount || 0);
    const totalPending = (pendingPayouts._sum.amount || 0);
    const totalPaidOut = (completedPayouts._sum.amount || 0);
    const actualAvailable = totalAvailable - totalPaidOut - totalPending;

    if (amount > actualAvailable) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient balance. Available: ₹${actualAvailable}, Requested: ₹${amount}` 
        },
        { status: 400 }
      );
    }

    // Minimum payout amount check
    const minimumPayout = 100; // ₹100 minimum
    if (amount < minimumPayout) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Minimum payout amount is ₹${minimumPayout}` 
        },
        { status: 400 }
      );
    }

    // Create payout request
    const payoutRequest = await prisma.payoutRequest.create({
      data: {
        userId: dbUser.id,
        amount,
        paymentMethod,
        paymentDetails: JSON.stringify(paymentDetails),
        status: 'PENDING',
        requestedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        payoutRequest: {
          id: payoutRequest.id,
          amount: payoutRequest.amount,
          paymentMethod: payoutRequest.paymentMethod,
          status: payoutRequest.status,
          requestedAt: payoutRequest.requestedAt
        },
        balance: {
          totalEarned: totalAvailable,
          totalPaidOut,
          pendingPayouts: totalPending,
          availableForPayout: actualAvailable - amount
        }
      },
      message: 'Payout request submitted successfully. It will be processed within 3-5 business days.'
    });
  } catch (error) {
    console.error('Error creating payout request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create payout request'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/commissions/payout - Get payout history and available balance
export async function GET(request: NextRequest) {
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

    // Get payout requests
    const payoutRequests = await prisma.payoutRequest.findMany({
      where: {
        userId: dbUser.id
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    // Calculate balance information
    const totalEarned = await prisma.commission.aggregate({
      where: {
        userId: dbUser.id,
        status: 'PAID'
      },
      _sum: {
        amount: true
      }
    });

    const totalPaidOut = await prisma.payoutRequest.aggregate({
      where: {
        userId: dbUser.id,
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    });

    const pendingPayouts = await prisma.payoutRequest.aggregate({
      where: {
        userId: dbUser.id,
        status: {
          in: ['PENDING', 'PROCESSING']
        }
      },
      _sum: {
        amount: true
      }
    });

    const totalEarnedAmount = totalEarned._sum.amount || 0;
    const totalPaidOutAmount = totalPaidOut._sum.amount || 0;
    const pendingPayoutAmount = pendingPayouts._sum.amount || 0;
    const availableBalance = totalEarnedAmount - totalPaidOutAmount - pendingPayoutAmount;

    return NextResponse.json({
      success: true,
      data: {
        balance: {
          totalEarned: totalEarnedAmount,
          totalPaidOut: totalPaidOutAmount,
          pendingPayouts: pendingPayoutAmount,
          availableForPayout: Math.max(0, availableBalance)
        },
        payoutRequests: payoutRequests.map(payout => ({
          id: payout.id,
          amount: payout.amount,
          paymentMethod: payout.paymentMethod,
          status: payout.status,
          requestedAt: payout.requestedAt,
          processedAt: payout.processedAt,
          notes: payout.notes
        })),
        minimumPayout: 100
      }
    });
  } catch (error) {
    console.error('Error fetching payout data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payout data'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to validate payment details
function validatePaymentDetails(paymentMethod: string, paymentDetails: any): string | null {
  switch (paymentMethod) {
    case 'bank_transfer':
      if (!paymentDetails.accountNumber || !paymentDetails.ifscCode || !paymentDetails.accountHolderName) {
        return 'Bank transfer requires accountNumber, ifscCode, and accountHolderName';
      }
      if (!/^[0-9]{9,18}$/.test(paymentDetails.accountNumber)) {
        return 'Invalid account number format';
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(paymentDetails.ifscCode)) {
        return 'Invalid IFSC code format';
      }
      break;
    
    case 'upi':
      if (!paymentDetails.upiId) {
        return 'UPI requires upiId';
      }
      if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(paymentDetails.upiId)) {
        return 'Invalid UPI ID format';
      }
      break;
    
    case 'wallet':
      if (!paymentDetails.walletType || !paymentDetails.walletId) {
        return 'Wallet requires walletType and walletId';
      }
      if (!['paytm', 'phonepe', 'googlepay', 'amazonpay'].includes(paymentDetails.walletType)) {
        return 'Invalid wallet type';
      }
      break;
    
    default:
      return 'Invalid payment method';
  }
  
  return null;
}