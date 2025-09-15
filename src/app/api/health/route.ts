import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is working correctly'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'API health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}