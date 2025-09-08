const fs = require('fs');

// Fix variable conflicts in specific files
const fixes = [
  {
    file: 'src/app/api/courses/modules/[id]/route.ts',
    replacements: [
      {
        from: /const user = await prisma\.user\.findUnique\(\{\s*where: \{ id: userId \},\s*select: \{ role: true \}\s*\}\);/g,
        to: 'const userRole = await prisma.user.findUnique({\n      where: { id: userId },\n      select: { role: true }\n    });'
      },
      {
        from: /const isAdmin = user\?\.role === 'ADMIN';/g,
        to: 'const isAdmin = userRole?.role === \'ADMIN\';'
      }
    ]
  },
  {
    file: 'src/app/api/notifications/[id]/route.ts',
    replacements: [
      {
        from: /const \[user, notification\] = await Promise\.all\(\[/g,
        to: 'const [userRole, notification] = await Promise.all(['
      },
      {
        from: /const isAdmin = user\?\.role === 'ADMIN';/g,
        to: 'const isAdmin = userRole?.role === \'ADMIN\';'
      }
    ]
  }
];

fixes.forEach(({ file, replacements }) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    
    fs.writeFileSync(file, content);
    console.log(`Fixed variable conflicts in ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('All variable conflicts fixed!');