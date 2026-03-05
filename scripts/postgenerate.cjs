const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'api', 'generated');

function walk(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.startsWith('// @ts-nocheck')) {
        fs.writeFileSync(fullPath, '// @ts-nocheck\n' + content);
      }
    }
  }
}

walk(dir);
console.log('postgenerate: added @ts-nocheck to generated files');
