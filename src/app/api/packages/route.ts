import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/packages - Get all available packages
export async function GET() {
  try {
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .eq('isActive', true)
      .order('basePrice', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch packages'
        },
        { status: 500 }
      );
    }

    // Transform packages to match frontend expectations
    const transformedPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      price: pkg.basePrice,
      gst: pkg.gst,
      totalPrice: pkg.finalPrice,
      features: Array.isArray(pkg.features) ? pkg.features : [],
      directCommissionRate: pkg.commissionRates?.direct || 10,
      indirectCommissionRate: pkg.commissionRates?.indirect || 5,
      isPopular: pkg.name.toLowerCase().includes('gold')
    }));

    return NextResponse.json({
      success: true,
      data: transformedPackages
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
  }
}

// POST /api/packages - Create a new package (Admin only)
export async function POST(request: NextRequest) {
  try {
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

    // Check if user is admin using Supabase
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('supabase_id', user.id)
      .single();

    if (userError || !dbUser || dbUser.role !== 'admin') {
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
      features,
      directCommissionRate,
      indirectCommissionRate
    } = body;

    // Validate required fields
    if (!name || !description || !basePrice || !directCommissionRate || !indirectCommissionRate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: newPackage, error: createError } = await supabase
      .from('packages')
      .insert({
        name,
        description,
        basePrice: parseFloat(basePrice),
        gst: Math.round(parseFloat(basePrice) * 0.18),
        finalPrice: Math.round(parseFloat(basePrice) + (parseFloat(basePrice) * 0.18)),
        features: features || [],
        commissionRates: {
          direct: parseFloat(directCommissionRate),
          indirect: parseFloat(indirectCommissionRate)
        },
        isActive: true
      })
      .select()
      .single();

    if (createError) {
      console.error('Supabase create error:', createError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create package'
        },
        { status: 500 }
      );
    }

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
  }
}