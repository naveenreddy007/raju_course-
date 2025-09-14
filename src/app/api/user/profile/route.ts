import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils-simple';

// GET /api/user/profile - Get authenticated user's profile
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    // Get user with related data
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        affiliate: {
          select: {
            referralCode: true,
            totalDirectEarnings: true,
            totalIndirectEarnings: true,
            currentBalance: true
          }
        },
        bankDetails: {
          select: {
            id: true,
            bankName: true,
            accountNumber: true,
            accountHolderName: true,
            ifscCode: true,
            isVerified: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            referrals: true
          }
        }
      }
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const { supabaseId, ...safeProfile } = userProfile;

    return NextResponse.json({
      success: true,
      data: safeProfile
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update authenticated user's profile
export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const body = await request.json();

    // Validate allowed fields for update
    const allowedFields = ['name', 'phone', 'avatar', 'panCard', 'aadharCard'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        panCard: true,
        aadharCard: true,
        role: true,
        kycStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}