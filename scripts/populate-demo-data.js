import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateDemoData() {
  try {
    console.log('🚀 Starting demo data population...');

    // 1. Create demo packages
    console.log('📦 Creating demo packages...');
    const packages = [
      {
        id: 'pkg_basic',
        name: 'Basic Package',
        basePrice: 99.00,
        gst: 17.82,
        finalPrice: 116.82,
        features: ['Access to 10 courses', 'Basic support', 'Certificate of completion'],
        commissionRates: { level1: 0.15, level2: 0.10, level3: 0.05 },
        isActive: true
      },
      {
        id: 'pkg_premium',
        name: 'Premium Package',
        basePrice: 199.00,
        gst: 35.82,
        finalPrice: 234.82,
        features: ['Access to all courses', 'Priority support', 'Live sessions', 'Advanced certificates'],
        commissionRates: { level1: 0.20, level2: 0.15, level3: 0.10 },
        isActive: true
      },
      {
        id: 'pkg_enterprise',
        name: 'Enterprise Package',
        basePrice: 499.00,
        gst: 89.82,
        finalPrice: 588.82,
        features: ['Unlimited access', '24/7 support', 'Custom content', 'Team management'],
        commissionRates: { level1: 0.25, level2: 0.20, level3: 0.15 },
        isActive: true
      }
    ];

    const { data: packagesData, error: packagesError } = await supabase
      .from('packages')
      .upsert(packages, { onConflict: 'id' })
      .select();

    if (packagesError) throw packagesError;
    console.log(`✅ Created ${packages.length} packages`);

    // 2. Create demo courses
    console.log('📚 Creating demo courses...');
    const courses = [
      {
        id: 'course_js_basics',
        title: 'JavaScript Fundamentals',
        description: 'Learn the basics of JavaScript programming',
        shortDescription: 'Complete guide to JavaScript fundamentals including variables, functions, and objects.',
        videoUrl: 'https://example.com/js-basics.mp4',
        thumbnailUrl: 'https://example.com/js-basics-thumb.jpg',
        duration: 120,
        price: 49.99,
        packageTypes: ['SILVER', 'GOLD', 'PLATINUM'],
        isActive: true,
        isPublished: true,
        slug: 'javascript-fundamentals',
        metaTitle: 'JavaScript Fundamentals Course',
        metaDescription: 'Learn JavaScript from scratch with our comprehensive course',
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      },
      {
        id: 'course_react_advanced',
        title: 'Advanced React Development',
        description: 'Master advanced React concepts and patterns',
        shortDescription: 'Deep dive into React hooks, context, performance optimization, and advanced patterns.',
        videoUrl: 'https://example.com/react-advanced.mp4',
        thumbnailUrl: 'https://example.com/react-advanced-thumb.jpg',
        duration: 180,
        price: 99.99,
        packageTypes: ['GOLD', 'PLATINUM'],
        isActive: true,
        isPublished: true,
        slug: 'advanced-react-development',
        metaTitle: 'Advanced React Development Course',
        metaDescription: 'Master React with advanced concepts and patterns',
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      },
      {
        id: 'course_marketing_101',
        title: 'Digital Marketing Basics',
        description: 'Introduction to digital marketing strategies',
        shortDescription: 'Learn SEO, social media marketing, email campaigns, and analytics.',
        videoUrl: 'https://example.com/marketing-101.mp4',
        thumbnailUrl: 'https://example.com/marketing-101-thumb.jpg',
        duration: 90,
        price: 39.99,
        packageTypes: ['SILVER', 'GOLD', 'PLATINUM'],
        isActive: true,
        isPublished: true,
        slug: 'digital-marketing-basics',
        metaTitle: 'Digital Marketing Basics Course',
        metaDescription: 'Learn digital marketing fundamentals and strategies',
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString()
      }
    ];

    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .upsert(courses, { onConflict: 'id' })
      .select();

    if (coursesError) throw coursesError;
    console.log(`✅ Created ${courses.length} courses`);

    // 3. Create demo users (affiliates)
    console.log('👥 Creating demo users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .upsert([
        {
          id: 'user_demo_1',
          email: 'john.doe@example.com',
          name: 'John Doe',
          phone: '+1234567001',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20businessman&image_size=square',
          role: 'USER',
          isActive: true,
          panCard: null,
          aadharCard: null,
          kycStatus: 'APPROVED',
          kycDocuments: null,
          kycVerifiedAt: new Date().toISOString(),
          supabaseId: 'user_1',
          emailVerified: true,
          phoneVerified: true,
          referralCode: 'JOHN2024',
          referredBy: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        },
        {
          id: 'user_demo_2',
          email: 'jane.smith@example.com',
          name: 'Jane Smith',
          phone: '+1234567002',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20businesswoman&image_size=square',
          role: 'USER',
          isActive: true,
          panCard: null,
          aadharCard: null,
          kycStatus: 'APPROVED',
          kycDocuments: null,
          kycVerifiedAt: new Date().toISOString(),
          supabaseId: 'user_2',
          emailVerified: true,
          phoneVerified: true,
          referralCode: 'JANE2024',
          referredBy: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        },
        {
          id: 'user_demo_3',
          email: 'admin@example.com',
          name: 'Admin User',
          phone: '+1234567003',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20an%20administrator&image_size=square',
          role: 'ADMIN',
          isActive: true,
          panCard: null,
          aadharCard: null,
          kycStatus: 'APPROVED',
          kycDocuments: null,
          kycVerifiedAt: new Date().toISOString(),
          supabaseId: 'user_3',
          emailVerified: true,
          phoneVerified: true,
          referralCode: 'ADMIN2024',
          referredBy: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        }
      ], { onConflict: 'email' })
      .select();

    if (usersError) throw usersError;
    console.log(`✅ Created ${users.length} users`);

    // 4. Create demo affiliates
    console.log('🤝 Creating demo affiliates...');
    const { data: affiliates, error: affiliatesError } = await supabase
      .from('affiliates')
      .upsert([
        {
          id: 'aff_demo_1',
          userId: 'user_demo_1',
          referralCode: 'JOHN2024',
          packageType: 'GOLD',
          packagePrice: 199.00,
          purchaseDate: new Date().toISOString(),
          commissionRate: 0.15,
          totalDirectEarnings: 450.00,
          totalIndirectEarnings: 0,
          totalWithdrawn: 0,
          currentBalance: 450.00,
          isActive: true,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'aff_demo_2',
          userId: 'user_demo_2',
          referralCode: 'JANE2024',
          packageType: 'SILVER',
          packagePrice: 99.00,
          purchaseDate: new Date().toISOString(),
          commissionRate: 0.12,
          totalDirectEarnings: 320.00,
          totalIndirectEarnings: 0,
          totalWithdrawn: 0,
          currentBalance: 320.00,
          isActive: true,
          updatedAt: new Date().toISOString()
        },
        {
          id: 'aff_demo_3',
          userId: 'user_demo_3',
          referralCode: 'MIKE2024',
          packageType: 'PLATINUM',
          packagePrice: 299.00,
          purchaseDate: new Date().toISOString(),
          commissionRate: 0.18,
          totalDirectEarnings: 180.00,
          totalIndirectEarnings: 0,
          totalWithdrawn: 0,
          currentBalance: 180.00,
          isActive: true,
          updatedAt: new Date().toISOString()
        }
      ], { onConflict: 'id' })
      .select();

    if (affiliatesError) throw affiliatesError;
    console.log(`✅ Created ${affiliates.length} affiliates`);

    // 5. Create demo package purchases
    console.log('📦 Creating demo package purchases...');
    const packagePurchases = [
      {
        id: 'pkg_purchase_1',
        userId: 'user_demo_2',
        packageId: 'pkg_basic',
        amount: 116.82,
        status: 'SUCCESS',
        razorpayOrderId: 'order_demo_1',
        razorpayPaymentId: 'pay_demo_1',
        purchasedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'pkg_purchase_2',
        userId: 'user_demo_3',
        packageId: 'pkg_premium',
        amount: 234.82,
        status: 'SUCCESS',
        razorpayOrderId: 'order_demo_2',
        razorpayPaymentId: 'pay_demo_2',
        purchasedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'pkg_purchase_3',
        userId: 'user_demo_1',
        packageId: 'pkg_enterprise',
        amount: 588.82,
        status: 'SUCCESS',
        razorpayOrderId: 'order_demo_3',
        razorpayPaymentId: 'pay_demo_3',
        purchasedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: packagePurchasesData, error: packagePurchasesError } = await supabase
      .from('package_purchases')
      .upsert(packagePurchases, { onConflict: 'id' })
      .select();

    if (packagePurchasesError) throw packagePurchasesError;
    console.log(`✅ Created ${packagePurchases.length} package purchases`);

    // 6. Create demo referrals
    console.log('🔗 Creating demo referrals...');
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .upsert([
        {
          id: 'ref_demo_1',
          affiliateId: 'aff_demo_1',
          referredUserId: 'user_demo_2',
          commissionEarned: 14.85,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        },
        {
          id: 'ref_demo_2',
          affiliateId: 'aff_demo_1',
          referredUserId: 'user_demo_3',
          commissionEarned: 29.85,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        },
        {
          id: 'ref_demo_3',
          affiliateId: 'aff_demo_2',
          referredUserId: 'user_demo_1',
          commissionEarned: 5.99,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        }
      ], { onConflict: 'id' })
      .select();

    if (referralsError) throw referralsError;
    console.log(`✅ Created ${referrals.length} referrals`);

    // 6. Create demo transactions
    console.log('💰 Creating demo transactions...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .upsert([
        {
          id: 'txn_demo_1',
          userId: 'user_demo_2',
          amount: 99.00,
          status: 'SUCCESS',
          type: 'COURSE_PURCHASE',
          description: 'Basic Package Purchase',
          paymentMethod: 'credit_card',
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          processedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'txn_demo_2',
          userId: 'user_demo_3',
          amount: 199.00,
          status: 'SUCCESS',
          type: 'COURSE_PURCHASE',
          description: 'Premium Package Purchase',
          paymentMethod: 'credit_card',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          processedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'txn_demo_3',
          userId: 'user_demo_1',
          amount: 49.99,
          status: 'SUCCESS',
          type: 'COURSE_PURCHASE',
          description: 'JavaScript Fundamentals Course',
          paymentMethod: 'paypal',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ], { onConflict: 'id' })
      .select();

    if (transactionsError) throw transactionsError;
    console.log(`✅ Created ${transactions.length} transactions`);

    // 7. Create demo commissions
    console.log('💸 Creating demo commissions...');
    const { data: commissions, error: commissionsError } = await supabase
      .from('commissions')
      .upsert([
        {
          id: 'comm_demo_1',
          userId: 'user_demo_1',
          sourceUserId: 'user_demo_2',
          packagePurchaseId: 'pkg_purchase_1',
          amount: 14.85, // 15% of $99
          type: 'DIRECT',
          level: 1,
          affiliateId: 'aff_demo_1',
          transactionId: 'txn_demo_1',
          status: 'PAID',
          paidAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'comm_demo_2',
          userId: 'user_demo_2',
          sourceUserId: 'user_demo_3',
          packagePurchaseId: 'pkg_purchase_2',
          amount: 29.70,
          type: 'DIRECT',
          level: 1,
          affiliateId: 'aff_demo_2',
          transactionId: 'txn_demo_2',
          status: 'PAID',
          paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'comm_demo_3',
          userId: 'user_demo_3',
          sourceUserId: 'user_demo_1',
          packagePurchaseId: 'pkg_purchase_3',
          amount: 73.82,
          type: 'DIRECT',
          level: 1,
          affiliateId: 'aff_demo_3',
          transactionId: 'txn_demo_3',
          status: 'PENDING',
          paidAt: null,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ], { onConflict: 'id' })
      .select();

    if (commissionsError) throw commissionsError;
    console.log(`✅ Created ${commissions.length} commissions`);

    // 8. Create demo blog posts
    console.log('📝 Creating demo blog posts...');
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .upsert([
        {
          id: 'blog_demo_1',
          title: 'Getting Started with Affiliate Marketing',
          content: 'Learn the basics of affiliate marketing and how to get started with our platform.',
          excerpt: 'A comprehensive guide to starting your affiliate marketing journey.',
          slug: 'getting-started-affiliate-marketing',
          authorId: 'user_demo_1',
          isPublished: true,
          publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 125,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'blog_demo_2',
          title: '5 Tips for Successful Online Learning',
          content: 'Discover proven strategies to maximize your online learning experience.',
          excerpt: 'Essential tips to help you succeed in your online courses.',
          slug: '5-tips-successful-online-learning',
          authorId: 'user_demo_2',
          isPublished: true,
          publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: 89,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ], { onConflict: 'id' })
      .select();

    if (blogError) throw blogError;
    console.log(`✅ Created ${blogPosts.length} blog posts`);

    console.log('\n🎉 Demo data population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${packages.length} packages`);
    console.log(`   • ${courses.length} courses`);
    console.log(`   • ${users.length} users`);
    console.log(`   • ${affiliates.length} affiliates`);
    console.log(`   • ${referrals.length} referrals`);
    console.log(`   • ${transactions.length} transactions`);
    console.log(`   • ${commissions.length} commissions`);
    console.log(`   • ${blogPosts.length} blog posts`);

  } catch (error) {
    console.error('❌ Error populating demo data:', error);
    process.exit(1);
  }
}

// Run the script
populateDemoData();