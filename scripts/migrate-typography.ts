#!/usr/bin/env node

/**
 * Typography Migration Script
 * Automatically migrates hardcoded Tailwind typography to design system components
 */

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationResult {
  file: string;
  changes: number;
  components: Set<string>;
}

/**
 * Migration patterns - converts Tailwind classes to typography components
 */
const PATTERNS = [
  // DisplayHeading patterns
  {
    match: /<(h[1-6]|div|p)\s+className="([^"]*(?:text-(?:4xl|5xl|6xl)[^"]*font-bold|font-bold[^"]*text-(?:4xl|5xl|6xl))[^"]*)">([^<]+)<\/\1>/g,
    replace: (match: string, tag: string, className: string, content: string) => {
      const level = className.includes('6xl') ? '2xl' : className.includes('5xl') ? 'xl' : 'lg';
      const additionalClasses = className.replace(/text-(?:4xl|5xl|6xl)|font-bold/g, '').trim();
      const classAttr = additionalClasses ? ` className="${additionalClasses}"` : '';
      return `<DisplayHeading level="${level}"${classAttr}>${content}</DisplayHeading>`;
    },
    closeTag: /<\/(h[1-6]|div|p)>/,
    newCloseTag: '</DisplayHeading>',
    component: 'DisplayHeading'
  },
  
  // Heading patterns (large)
  {
    match: /<(h[1-6]|div|p)\s+className="([^"]*(?:text-(?:2xl|3xl)[^"]*font-(?:bold|semibold)|font-(?:bold|semibold)[^"]*text-(?:2xl|3xl))[^"]*)">([^<]+)<\/\1>/g,
    replace: (match: string, tag: string, className: string, content: string) => {
      const level = className.includes('3xl') ? 'xl' : 'lg';
      const additionalClasses = className.replace(/text-(?:2xl|3xl)|font-(?:bold|semibold)/g, '').trim();
      const classAttr = additionalClasses ? ` className="${additionalClasses}"` : '';
      return `<Heading level="${level}"${classAttr}>${content}</Heading>`;
    },
    closeTag: /<\/(h[1-6]|div|p)>/,
    newCloseTag: '</Heading>',
    component: 'Heading'
  },
  
  // Heading patterns (medium/small)
  {
    match: /<(h[1-6]|div|p)\s+className="([^"]*(?:text-(?:lg|xl)[^"]*font-(?:bold|semibold)|font-(?:bold|semibold)[^"]*text-(?:lg|xl))[^"]*)">([^<]+)<\/\1>/g,
    replace: (match: string, tag: string, className: string, content: string) => {
      const level = className.includes('xl') ? 'lg' : 'md';
      const additionalClasses = className.replace(/text-(?:lg|xl)|font-(?:bold|semibold)/g, '').trim();
      const classAttr = additionalClasses ? ` className="${additionalClasses}"` : '';
      return `<Heading level="${level}"${classAttr}>${content}</Heading>`;
    },
    closeTag: /<\/(h[1-6]|div|p)>/,
    newCloseTag: '</Heading>',
    component: 'Heading'
  },
  
  // Body text patterns
  {
    match: /<(p|div|span)\s+className="([^"]*text-(?:base|lg)[^"]*)">([^<]+)<\/\1>/g,
    replace: (match: string, tag: string, className: string, content: string) => {
      const size = className.includes('text-lg') ? 'lg' : 'md';
      const additionalClasses = className.replace(/text-(?:base|lg)/g, '').trim();
      const classAttr = additionalClasses ? ` className="${additionalClasses}"` : '';
      return `<Text size="${size}"${classAttr}>${content}</Text>`;
    },
    closeTag: /<\/(p|div|span)>/,
    newCloseTag: '</Text>',
    component: 'Text'
  },
  
  // Caption patterns
  {
    match: /<(p|span|div)\s+className="([^"]*text-(?:xs|sm)[^"]*)">([^<]+)<\/\1>/g,
    replace: (match: string, tag: string, className: string, content: string) => {
      const size = className.includes('text-xs') ? 'sm' : 'md';
      const additionalClasses = className.replace(/text-(?:xs|sm)/g, '').trim();
      const classAttr = additionalClasses ? ` className="${additionalClasses}"` : '';
      return `<Caption size="${size}"${classAttr}>${content}</Caption>`;
    },
    closeTag: /<\/(p|span|div)>/,
    newCloseTag: '</Caption>',
    component: 'Caption'
  }
];

/**
 * Adds import statement for typography components if needed
 */
function addImportIfNeeded(content: string, components: Set<string>): string {
  if (components.size === 0) return content;

  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/components\/ui\/typography['"]/;
  const match = content.match(importRegex);
  
  if (match) {
    // Update existing import
    const existingImports = match[1].split(',').map(s => s.trim());
    const allImports = new Set([...existingImports, ...Array.from(components)]);
    const newImportList = Array.from(allImports).sort().join(', ');
    return content.replace(importRegex, `import { ${newImportList} } from '@/components/ui/typography'`);
  } else {
    // Add new import after other imports
    const importList = Array.from(components).sort().join(', ');
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const afterLastImport = content.indexOf('\n', lastImportIndex) + 1;
      return content.slice(0, afterLastImport) + 
             `import { ${importList} } from '@/components/ui/typography';\n` + 
             content.slice(afterLastImport);
    } else {
      // No imports yet, add at the beginning
      return `import { ${importList} } from '@/components/ui/typography';\n\n` + content;
    }
  }
}

/**
 * Migrates a single file
 */
function migrateFile(filePath: string, isDryRun = false): MigrationResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  let modifiedContent = content;
  let changes = 0;
  const usedComponents = new Set<string>();

  // Apply each pattern
  PATTERNS.forEach(pattern => {
    const matches = modifiedContent.match(pattern.match);
    if (matches) {
      modifiedContent = modifiedContent.replace(pattern.match, (...args) => {
        changes++;
        usedComponents.add(pattern.component);
        return pattern.replace(...args);
      });
    }
  });

  // Add imports if changes were made
  if (changes > 0) {
    modifiedContent = addImportIfNeeded(modifiedContent, usedComponents);
    
    // Write modified content back to file (skip if dry run)
    if (!isDryRun) {
      fs.writeFileSync(filePath, modifiedContent, 'utf-8');
    }
  }

  return {
    file: path.relative(process.cwd(), filePath),
    changes,
    components: usedComponents
  };
}

/**
 * Main execution
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const pattern = process.argv[2] && !process.argv[2].startsWith('--') 
    ? process.argv[2] 
    : 'src/**/*.tsx';

  console.log(`🔍 Searching for files matching: ${pattern}`);
  console.log(isDryRun ? '⚠️  DRY RUN MODE - No files will be modified\n' : '');

  // Find all matching files
  const files = await glob(pattern, {
    ignore: [
      '**/node_modules/**',
      '**/*.test.tsx',
      '**/*.spec.tsx',
      '**/*.stories.tsx',
      '**/ui/typography/**'
    ]
  });

  if (files.length === 0) {
    console.log('❌ No files found matching the pattern');
    return;
  }

  console.log(`📝 Found ${files.length} files to process\n`);

  const results: MigrationResult[] = [];

  // Process each file
  for (const file of files) {
    const result = migrateFile(file, isDryRun);
    results.push(result);

    if (result.changes > 0) {
      console.log(`✅ ${result.file} - ${result.changes} change(s) - Components: ${Array.from(result.components).join(', ')}`);
    }
  }

  console.log(`\n📊 Migration Summary ${isDryRun ? '(DRY RUN)' : ''}:`);
  console.log(`   Files processed: ${results.length}`);
  console.log(`   Files modified: ${results.filter(r => r.changes > 0).length}`);
  console.log(`   Total changes: ${results.reduce((sum, r) => sum + r.changes, 0)}`);
  
  if (isDryRun) {
    console.log('\n⚠️  This was a dry run. No files were modified.');
    console.log('   Run without --dry-run to apply changes.');
  }
}

main().catch(console.error);
