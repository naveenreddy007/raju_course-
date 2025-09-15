import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create packages
  const packages = [
    {
      id: 'silver',
      name: 'Silver Package',
      basePrice: 2999,
      gst: 539.82,
      finalPrice: 3538.82,
      features: {
        courses: ['Basic Trading Course', 'Market Analysis Basics'],
        support: '24/7 Chat Support',
        validity: '6 months',
        materials: 'Digital materials included',
        webinars: 'Monthly webinars'
      },
      commissionRates: {
        direct: 15,
        indirect: 5
      },
      isActive: true
    },
    {
      id: 'gold',
      name: 'Gold Package',
      basePrice: 4999,
      gst: 899.82,
      finalPrice: 5898.82,
      features: {
        courses: ['Advanced Trading Course', 'Technical Analysis', 'Risk Management'],
        support: '24/7 Phone & Chat Support',
        validity: '12 months',
        materials: 'Digital + Physical materials',
        webinars: 'Weekly webinars',
        mentorship: '1-on-1 monthly sessions'
      },
      commissionRates: {
        direct: 15,
        indirect: 5
      },
      isActive: true
    },
    {
      id: 'platinum',
      name: 'Platinum Package',
      basePrice: 9999,
      gst: 1799.82,
      finalPrice: 11798.82,
      features: {
        courses: ['Complete Trading Mastery', 'Advanced Strategies', 'Portfolio Management', 'Options Trading'],
        support: 'Dedicated account manager',
        validity: '24 months',
        materials: 'Premium physical kit + Digital access',
        webinars: 'Daily market analysis',
        mentorship: 'Weekly 1-on-1 sessions',
        exclusive: 'VIP trading signals',
        community: 'Exclusive trader community access'
      },
      commissionRates: {
        direct: 15,
        indirect: 5
      },
      isActive: true
    }
  ];

  for (const packageData of packages) {
    const existingPackage = await prisma.package.findUnique({
      where: { id: packageData.id }
    });

    if (!existingPackage) {
      await prisma.package.create({
        data: packageData
      });
      console.log(`✅ Created package: ${packageData.name}`);
    } else {
      console.log(`⏭️  Package already exists: ${packageData.name}`);
    }
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });