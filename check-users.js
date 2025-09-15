const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`);
    });
    
    // Try to create blog posts with the first user
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`\nUsing user: ${firstUser.email} for blog posts`);
      
      const blogPosts = [
        {
          title: 'Getting Started with Affiliate Marketing',
          slug: 'getting-started-affiliate-marketing',
          content: 'Learn the fundamentals of affiliate marketing and how to build a successful affiliate business. This comprehensive guide covers everything from choosing the right products to promoting them effectively.',
          excerpt: 'Master the basics of affiliate marketing with this beginner-friendly guide.',
          authorId: firstUser.id,
          isPublished: true,
          publishedAt: new Date(),
          metaTitle: 'Getting Started with Affiliate Marketing',
          metaDescription: 'Complete guide to affiliate marketing for beginners'
        },
        {
          title: 'Advanced Marketing Strategies',
          slug: 'advanced-marketing-strategies',
          content: 'Explore advanced marketing techniques including social media marketing, content marketing, email campaigns, and conversion optimization strategies.',
          excerpt: 'Take your marketing to the next level with these advanced strategies.',
          authorId: firstUser.id,
          isPublished: true,
          publishedAt: new Date(),
          metaTitle: 'Advanced Marketing Strategies',
          metaDescription: 'Learn advanced marketing techniques and strategies'
        },
        {
          title: 'Building Passive Income Streams',
          slug: 'building-passive-income-streams',
          content: 'Discover how to create multiple passive income streams through affiliate marketing, digital products, and online courses.',
          excerpt: 'Learn how to build sustainable passive income streams.',
          authorId: firstUser.id,
          isPublished: true,
          publishedAt: new Date(),
          metaTitle: 'Building Passive Income Streams',
          metaDescription: 'Create multiple passive income streams online'
        }
      ];
      
      for (const post of blogPosts) {
        const existingPost = await prisma.blogPost.findUnique({
          where: { slug: post.slug }
        });
        
        if (!existingPost) {
          await prisma.blogPost.create({ data: post });
          console.log(`Created blog post: ${post.title}`);
        } else {
          console.log(`Blog post already exists: ${post.title}`);
        }
      }
      
      console.log('\n✅ Blog posts setup completed!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();