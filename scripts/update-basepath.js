import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const viewsDir = path.join(__dirname, '../src/views');
const publicJsDir = path.join(__dirname, '../src/public/js');

const basePath = '/testserver/client/0192481/site/abj';

// Pfade die ersetzt werden müssen (Reihenfolge ist wichtig!)
const replacements = [
  // Admin-Seiten mit /admin müssen vor einfachem / ersetzt werden
  { from: /href="\/admin\/([^"]*)"(?!<%-)/g, to: `href="<%- basePath %>/admin/$1"` },
  { from: /action="\/admin\/([^"]*)"(?!<%-)/g, to: `action="<%- basePath %>/admin/$1"` },
  { from: /action="\/admin"(?!<%-)/g, to: `action="<%- basePath %>/admin"` },
  
  // Warenkorb-Routen
  { from: /href="\/warenkorb"(?!<%-)/g, to: `href="<%- basePath %>/warenkorb"` },
  { from: /href="\/kasse"(?!<%-)/g, to: `href="<%- basePath %>/kasse"` },
  { from: /action="\/warenkorb\/([^"]*)"(?!<%-)/g, to: `action="<%- basePath %>/warenkorb/$1"` },
  
  // Shop/Produkt-Routen
  { from: /href="\/produkt\/([^"]*)"(?!<%-)/g, to: `href="<%- basePath %>/produkt/$1"` },
  { from: /href="\/shop([^"]*)"(?!<%-)/g, to: `href="<%- basePath %>/shop$1"` },
  { from: /action="\/shop"(?!<%-)/g, to: `action="<%- basePath %>/shop"` },
  { from: /action="\/kontakt"(?!<%-)/g, to: `action="<%- basePath %>/kontakt"` },
  { from: /href="\/kontakt"(?!<%-)/g, to: `href="<%- basePath %>/kontakt"` },
  { from: /href="\/wunschliste"(?!<%-)/g, to: `href="<%- basePath %>/wunschliste"` },
  { from: /href="\/gate"(?!<%-)/g, to: `href="<%- basePath %>/gate"` },
  { from: /action="\/gate"(?!<%-)/g, to: `action="<%- basePath %>/gate"` },
  
  // Home/Root
  { from: /href="\/"(?!<%-)/g, to: `href="<%- basePath %>"` },
  { from: /src="\/js\/([^"]*)"(?!<%-)/g, to: `src="<%- basePath %>/js/$1"` },
  
  // Newsletter
  { from: /action="\/newsletter"(?!<%-)/g, to: `action="<%- basePath %>/newsletter"` },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    replacements.forEach(({ from, to }) => {
      const newContent = content.replace(from, to);
      if (newContent !== content) {
        modified = true;
        content = newContent;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated: ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (err) {
    console.error(`✗ Error processing ${filePath}:`, err.message);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach((file) => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.name.endsWith('.ejs') || file.name.endsWith('.js')) {
      processFile(fullPath);
    }
  });
}

console.log('🔄 Updating paths to use basePath...\n');
processDirectory(viewsDir);
processDirectory(publicJsDir);
console.log('\n✅ Done!');
