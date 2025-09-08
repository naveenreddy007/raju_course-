import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';

// GET /api/blog/posts/[id] - Get blog post details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // Try to find by ID first, then by slug
    let post = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // If not found by ID, try by slug
    if (!post) {
      post = await prisma.blogPost.findUnique({
        where: { slug: postId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    }

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        viewCount: post.viewCount + 1
      }
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

// PUT /api/blog/posts/[id] - Update blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user and check if admin
    const user = await prisma.user.findUnique({
      where: { supabaseId: session.user.id }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const postId = params.id;
    const body = await request.json();
    const { 
      title, 
      content, 
      excerpt, 
      category, 
      tags, 
      featuredImage, 
      published, 
      metaTitle, 
      metaDescription 
    } = body;

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (title !== undefined) {
      updateData.title = title;
      // Update slug if title changed
      const newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if new slug conflicts with existing posts (excluding current post)
      if (newSlug !== existingPost.slug) {
        const slugConflict = await prisma.blogPost.findFirst({
          where: {
            slug: newSlug,
            id: { not: postId }
          }
        });
        
        if (slugConflict) {
          return NextResponse.json(
            { success: false, error: 'A post with this title already exists' },
            { status: 400 }
          );
        }
        
        updateData.slug = newSlug;
      }
    }
    
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    
    // Handle published status
    if (published !== undefined) {
      updateData.isPublished = published;
      if (published && !existingPost.isPublished) {
        // First time publishing
        updateData.publishedAt = new Date();
      } else if (!published) {
        // Unpublishing
        updateData.publishedAt = null;
      }
    }

    // Update blog post
    const updatedPost = await prisma.blogPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'Blog post updated successfully'
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/posts/[id] - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user and check if admin
    const user = await prisma.user.findUnique({
      where: { supabaseId: session.user.id }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const postId = params.id;

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Delete blog post
    await prisma.blogPost.delete({
      where: { id: postId }
    });

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}