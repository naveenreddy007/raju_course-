const fs = require('fs');
const path = require('path');

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
    
    // Replace all instances of requireAuth with two parameters
    content = content.replace(/requireAuth\(request,\s*supabase\)/g, 'requireAuth(request)');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('All auth calls fixed!');