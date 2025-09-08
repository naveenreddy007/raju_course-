import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('=== SUPABASE TEST START ===');
    
    // Check environment variables
    console.log('Environment variables:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      isServer: typeof window === 'undefined'
    });
    
    // Create client
    console.log('Creating Supabase client...');
    const supabase = createClient();
    console.log('Supabase client created:', !!supabase);
    
    // Test simple query
    console.log('Testing simple query...');
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id')
      .limit(1);
    
    console.log('Query result:', { data, error });
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    console.log('=== SUPABASE TEST SUCCESS ===');
    return NextResponse.json({
      success: true,
      message: 'Supabase connection working',
      data: data,
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        isServer: typeof window === 'undefined'
      }
    });
    
  } catch (error) {
    console.error('=== SUPABASE TEST ERROR ===', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}