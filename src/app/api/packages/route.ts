import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// GET /api/packages - Get all available packages
export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        basePrice: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch packages'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/packages - Create a new package (Admin only)
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

    // Verify the user is authenticated and is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id }
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      basePrice,
      gstAmount,
      features,
      directCommissionRate,
      indirectCommissionRate
    } = body;

    // Validate required fields
    if (!name || !description || !price || !basePrice || !directCommissionRate || !indirectCommissionRate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        price,
        basePrice,
        gstAmount: gstAmount || 0,
        features: features || [],
        directCommissionRate,
        indirectCommissionRate,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      data: newPackage
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create package'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}