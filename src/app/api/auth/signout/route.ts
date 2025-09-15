import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/auth/signout - Sign out user
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get session from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'No session to sign out' },
        { status: 200 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Sign out from Supabase
    const { error } = await supabase.auth.admin.signOut(token);
    
    if (error) {
      console.error('Signout error:', error);
      // Still return success as the client should clear the token
    }

    return NextResponse.json({
      message: 'Successfully signed out'
    });
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json(
      { message: 'Successfully signed out' },
      { status: 200 }
    );
  }
}