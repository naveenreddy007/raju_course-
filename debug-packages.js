const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function debugPackages() {
  console.log('=== Debugging Package System ===\n');
  
  try {
    // Check database packages
    console.log('1. Database Packages:');
    const packages = await prisma.package.findMany({
      orderBy: { finalPrice: 'asc' }
    });
    
    console.log(`Found ${packages.length} packages:`);
    packages.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name}:`);
      console.log(`   - ID: ${pkg.id}`);
      console.log(`   - Base Price: ₹${pkg.basePrice}`);
      console.log(`   - GST: ₹${pkg.gst}`);
      console.log(`   - Final Price: ₹${pkg.finalPrice}`);
      console.log(`   - Commission Rates: ${JSON.stringify(pkg.commissionRates)}`);
      console.log(`   - Features: ${JSON.stringify(pkg.features)}`);
      console.log(`   - Active: ${pkg.isActive}`);
      console.log('');
    });
    
    // Test server connectivity
    console.log('2. Server Connectivity:');
    try {
      const response = await fetch('http://localhost:3000/api/packages', {
        timeout: 5000
      });
      console.log(`API Response Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`API returned ${data.length} packages`);
        console.log('API Package Data:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('API Error Response:', errorText);
      }
    } catch (apiError) {
      console.log('API Connection Error:', apiError.message);
      
      // Check if server is running on different port
      console.log('\n3. Checking alternative ports:');
      const ports = [3000, 3001, 8000, 8080];
      
      for (const port of ports) {
        try {
          const testResponse = await fetch(`http://localhost:${port}`, {
            timeout: 2000
          });
          console.log(`Port ${port}: ${testResponse.status} - Server responding`);
        } catch (portError) {
          console.log(`Port ${port}: No response`);
        }
      }
    }
    
    // Check if packages need to be seeded
    if (packages.length === 0) {
      console.log('\n4. No packages found. Database may need seeding.');
    } else if (packages.length > 0 && !packages.some(p => p.name === 'Silver')) {
      console.log('\n4. Packages exist but may have different names than expected.');
      console.log('Expected: Silver, Gold, Platinum');
      console.log('Found:', packages.map(p => p.name).join(', '));
    }
    
  } catch (error) {
    console.error('Debug Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPackages();