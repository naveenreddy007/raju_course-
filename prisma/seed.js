const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create the three affiliate packages
  const packages = [
    {
      id: 'silver-package',
      name: 'Silver Package',
      description: 'Entry-level affiliate package with basic commission structure',
      price: 2950.00, // ₹2,950 including GST
      basePrice: 2500.00, // Base price before GST
      gstAmount: 450.00, // 18% GST
      features: [
        'Basic affiliate dashboard',
        '10% direct commission',
        '5% indirect commission',
        'Email support',
        'Basic training materials'
      ],
      directCommissionRate: 0.10, // 10%
      indirectCommissionRate: 0.05, // 5%
      isActive: true
    },
    {
      id: 'gold-package',
      name: 'Gold Package',
      description: 'Premium affiliate package with enhanced commission rates',
      price: 5310.00, // ₹5,310 including GST
      basePrice: 4500.00, // Base price before GST
      gstAmount: 810.00, // 18% GST
      features: [
        'Advanced affiliate dashboard',
        '15% direct commission',
        '8% indirect commission',
        'Priority email & chat support',
        'Advanced training materials',
        'Marketing toolkit',
        'Performance analytics'
      ],
      directCommissionRate: 0.15, // 15%
      indirectCommissionRate: 0.08, // 8%
      isActive: true
    },
    {
      id: 'platinum-package',
      name: 'Platinum Package',
      description: 'Elite affiliate package with maximum commission potential',
      price: 8850.00, // ₹8,850 including GST
      basePrice: 7500.00, // Base price before GST
      gstAmount: 1350.00, // 18% GST
      features: [
        'Elite affiliate dashboard',
        '20% direct commission',
        '12% indirect commission',
        '24/7 priority support',
        'Exclusive training content',
        'Complete marketing suite',
        'Advanced analytics & insights',
        'Personal account manager',
        'Exclusive webinars & events'
      ],
      directCommissionRate: 0.20, // 20%
      indirectCommissionRate: 0.12, // 12%
      isActive: true
    }
  ];

  // Insert packages
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

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });