const fs = require('fs');

// Files that need fixing
const filesToFix = [
  'src/app/api/courses/[id]/route.ts',
  'src/app/api/courses/progress/route.ts',
  'src/app/api/courses/modules/[id]/route.ts',
  'src/app/api/notifications/[id]/route.ts'
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the auth pattern
    content = content.replace(
      /const authResult = await requireAuth\(request\);\s*if \(authResult\.error\) \{\s*return authResult\.response;\s*\}\s*const userId = authResult\.user\.id;/g,
      'const { user } = await requireAuth(request);\n    const userId = user.id;'
    );
    
    // Also handle cases where userId is not immediately assigned
    content = content.replace(
      /const authResult = await requireAuth\(request\);\s*if \(authResult\.error\) \{\s*return authResult\.response;\s*\}/g,
      'const { user } = await requireAuth(request);'
    );
    
    // Handle cases where user is accessed later
    content = content.replace(/authResult\.user/g, 'user');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('All auth patterns fixed!');