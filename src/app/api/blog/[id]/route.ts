import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { APIError, authenticateUser, requireAdmin, logger } from '@/lib/api-utils';
import { withRateLimit } from '@/middleware/rate-limit';

// Update blog post schema
const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional()
});

// GET /api/blog/[id] - Get blog post by ID or slug
export const GET = withRateLimit(async function(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Try to find by ID first, then by slug
    let post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });
    
    // If not found by ID, try by slug
    if (!post) {
      post = await prisma.blogPost.findUnique({
        where: { slug: id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      });
    }
    
    if (!post) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Blog post not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }
    
    // Check if user can access draft posts
    if (!post.isPublished) {
      try {
        await requireAdmin(request);
      } catch (error) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Blog post not found',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }
    }
    
    // Get related posts (same author, published, excluding current post)
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        authorId: post.authorId,
        isPublished: true,
        id: {
          not: post.id
        }
      },
      take: 3,
      orderBy: {
        publishedAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        publishedAt: true
      }
    });
    
    logger.info(`Blog post retrieved: ${post.id}`, {
      postId: post.id,
      title: post.title,
      isPublished: post.isPublished
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...post,
        relatedPosts
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to fetch blog post:', error);
    if (error instanceof APIError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch blog post',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

// PUT /api/blog/[id] - Update blog post (Admin only)
export const PUT = withRateLimit(async function(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require admin authentication
    const { user } = await authenticateUser(request);
    await requireAdmin(request);
    
    const { id } = params;
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateBlogPostSchema.safeParse(body);
    
    if (!validationResult.success) {
      throw new APIError(
        `Invalid request data: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400,
        'INVALID_REQUEST_DATA'
      );
    }
    
    const validatedData = validationResult.data;
    
    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });
    
    if (!existingPost) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Blog post not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }
    
    // Generate new slug if title is being updated
    let slug = existingPost.slug;
    if (validatedData.title && validatedData.title !== existingPost.title) {
      slug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if new slug already exists
      const slugExists = await prisma.blogPost.findFirst({
        where: {
          slug,
          id: {
            not: id
          }
        }
      });
      
      if (slugExists) {
        return NextResponse.json(
          { 
            success: false,
            error: 'A blog post with this title already exists',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        );
      }
    }
    
    // Generate excerpt if content is being updated but excerpt is not provided
    let excerpt = validatedData.excerpt;
    if (validatedData.content && !excerpt) {
      excerpt = validatedData.content.substring(0, 200) + (validatedData.content.length > 200 ? '...' : '');
    }
    
    // Handle published date
    let publishedAt = existingPost.publishedAt;
    if (validatedData.isPublished !== undefined) {
      if (validatedData.isPublished && !existingPost.isPublished) {
        // Publishing for the first time
        publishedAt = new Date();
      } else if (!validatedData.isPublished) {
        // Unpublishing
        publishedAt = null;
      }
    }
    
    // Update the blog post
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        ...validatedData,
        slug,
        excerpt,
        publishedAt
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });
    
    logger.info(`Blog post updated: ${updatedPost.id}`, {
      userId: user.id,
      postId: updatedPost.id,
      title: updatedPost.title,
      isPublished: updatedPost.isPublished
    });
    
    return NextResponse.json({
      success: true,
      data: updatedPost,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to update blog post:', error);
    if (error instanceof APIError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update blog post',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

// DELETE /api/blog/[id] - Delete blog post (Admin only)
export const DELETE = withRateLimit(async function(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Require admin authentication
    const { user } = await authenticateUser(request);
    await requireAdmin(request);
    
    const { id } = params;
    
    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });
    
    if (!existingPost) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Blog post not found',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }
    
    // Delete the blog post
    await prisma.blogPost.delete({
      where: { id }
    });
    
    logger.info(`Blog post deleted: ${id}`, {
      userId: user.id,
      postId: id,
      title: existingPost.title
    });
    
    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to delete blog post:', error);
    if (error instanceof APIError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete blog post',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});