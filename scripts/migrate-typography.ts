/**
 * Typography Migration Script
 * Automatically migrates hardcoded Tailwind typography to design system components
 * 
 * Usage: npx tsx scripts/migrate-typography.ts [file-pattern]
 * Example: npx tsx scripts/migrate-typography.ts "src/pages/admin/*.tsx"
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface MigrationResult {
  file: string;
  changes: number;
  patterns: string[];
}

const PATTERNS = [
  // Display Headings (h1 with large text)
  {
    match: /<h1\s+className="([^"]*text-(4xl|5xl|6xl)[^"]*font-bold[^"]*)"/g,
    replace: (match: string, className: string, size: string) => {
      const level = size === '6xl' ? '2xl' : size === '5xl' ? 'xl' : 'lg';
      const hasResponsive = /sm:|md:|lg:/.test(className);
      const utilities = className
        .replace(/text-(4xl|5xl|6xl)/g, '')
        .replace(/font-bold/g, '')
        .replace(/text-foreground/g, '')
        .trim();
      
      return `<DisplayHeading level="${level}"${hasResponsive ? ' responsive' : ''}${utilities ? ` className="${utilities}"` : ''}>`;
    },
    closeTag: '</h1>',
    newCloseTag: '</DisplayHeading>',
  },
  
  // Regular Headings (h2, h3 with medium text)
  {
    match: /<(h[2-3])\s+className="([^"]*text-(xl|2xl)[^"]*font-(semibold|bold)[^"]*)"/g,
    replace: (match: string, tag: string, className: string, size: string) => {
      const level = size === '2xl' ? 'xl' : 'lg';
      const utilities = className
        .replace(/text-(xl|2xl)/g, '')
        .replace(/font-(semibold|bold)/g, '')
        .replace(/text-foreground/g, '')
        .trim();
      
      return `<Heading level="${level}" as="${tag}"${utilities ? ` className="${utilities}"` : ''}>`;
    },
    closeTag: /<\/(h[2-3])>/g,
    newCloseTag: '</Heading>',
  },
  
  // Body Text
  {
    match: /<p\s+className="([^"]*text-(base|lg|xl)[^"]*)"/g,
    replace: (match: string, className: string, size: string) => {
      const textSize = size === 'base' ? 'md' : size;
      const hasEmphasis = className.includes('text-muted-foreground');
      const emphasis = hasEmphasis ? ' emphasis="low"' : '';
      const utilities = className
        .replace(/text-(base|lg|xl)/g, '')
        .replace(/text-muted-foreground/g, '')
        .replace(/leading-(normal|relaxed)/g, '')
        .trim();
      
      return `<Text size="${textSize}"${emphasis}${utilities ? ` className="${utilities}"` : ''}>`;
    },
    closeTag: '</p>',
    newCloseTag: '</Text>',
  },
  
  // Captions (small text with muted color)
  {
    match: /<(span|div)\s+className="([^"]*text-(xs|sm)[^"]*text-muted-foreground[^"]*)"/g,
    replace: (match: string, tag: string, className: string, size: string) => {
      const captionSize = size === 'xs' ? 'md' : 'lg';
      const utilities = className
        .replace(/text-(xs|sm)/g, '')
        .replace(/text-muted-foreground/g, '')
        .trim();
      
      return `<Caption size="${captionSize}"${utilities ? ` className="${utilities}"` : ''}>`;
    },
    closeTag: /<\/(span|div)>/g,
    newCloseTag: '</Caption>',
  },
];

function addImportIfNeeded(content: string, components: Set<string>): string {
  const importLine = `import { ${Array.from(components).join(', ')} } from '@/components/ui/typography';\n`;
  
  // Check if import already exists
  if (content.includes("from '@/components/ui/typography'")) {
    // Update existing import
    return content.replace(
      /import\s+{([^}]+)}\s+from\s+'@\/components\/ui\/typography'/,
      (match, existingImports) => {
        const existing = new Set(
          existingImports.split(',').map((s: string) => s.trim())
        );
        components.forEach(c => existing.add(c));
        return `import { ${Array.from(existing).join(', ')} } from '@/components/ui/typography'`;
      }
    );
  }
  
  // Add new import after first import statement
  const firstImportIndex = content.indexOf('import');
  if (firstImportIndex === -1) {
    return importLine + content;
  }
  
  const lines = content.split('\n');
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import')) {
      insertIndex = i + 1;
    } else if (insertIndex > 0) {
      break;
    }
  }
  
  lines.splice(insertIndex, 0, importLine.trim());
  return lines.join('\n');
}

function migrateFile(filePath: string): MigrationResult {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let changes = 0;
  const usedComponents = new Set<string>();
  const patternsMatched: string[] = [];
  
  PATTERNS.forEach(pattern => {
    const matches = content.match(pattern.match);
    if (matches) {
      matches.forEach(match => {
        const replaced = match.replace(pattern.match, pattern.replace as any);
        content = content.replace(match, replaced);
        changes++;
        
        // Track which component was used
        if (replaced.includes('DisplayHeading')) usedComponents.add('DisplayHeading');
        if (replaced.includes('<Heading')) usedComponents.add('Heading');
        if (replaced.includes('<Text')) usedComponents.add('Text');
        if (replaced.includes('<Caption')) usedComponents.add('Caption');
        if (replaced.includes('<Label')) usedComponents.add('Label');
        
        patternsMatched.push(pattern.match.source);
      });
      
      // Replace closing tags
      if (pattern.newCloseTag) {
        content = content.replace(
          new RegExp(pattern.closeTag, 'g'),
          pattern.newCloseTag
        );
      }
    }
  });
  
  if (changes > 0) {
    content = addImportIfNeeded(content, usedComponents);
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return {
    file: filePath,
    changes,
    patterns: Array.from(new Set(patternsMatched)),
  };
}

async function main() {
  const pattern = process.argv[2] || 'src/**/*.tsx';
  console.log(`🔍 Scanning files: ${pattern}\n`);
  
  const files = await glob(pattern, {
    ignore: [
      '**/node_modules/**',
      '**/*.test.tsx',
      '**/*.spec.tsx',
      '**/ui/typography/**', // Don't migrate typography components themselves
    ],
  });
  
  console.log(`📁 Found ${files.length} files to analyze\n`);
  
  const results: MigrationResult[] = [];
  let totalChanges = 0;
  
  for (const file of files) {
    const result = migrateFile(file);
    if (result.changes > 0) {
      results.push(result);
      totalChanges += result.changes;
      console.log(`✅ ${file}: ${result.changes} changes`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Migration Summary:`);
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Files modified: ${results.length}`);
  console.log(`   Total changes: ${totalChanges}`);
  console.log('='.repeat(60) + '\n');
  
  if (results.length > 0) {
    console.log('🎉 Migration complete! Review the changes and test your app.');
    console.log('💡 Tip: Run your test suite to catch any issues.');
  } else {
    console.log('✨ No hardcoded typography found. Your codebase is clean!');
  }
}

main().catch(console.error);
