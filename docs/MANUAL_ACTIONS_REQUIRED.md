# Manual Actions Required

Due to read-only file restrictions, the following changes must be made manually by the user.

---

## 1. Add NPM Scripts to package.json

**File:** `package.json`  
**Action:** Add the following scripts to the `"scripts"` section:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    
    // ADD THESE SCRIPTS:
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build",
    "migrate:typography": "tsx scripts/migrate-typography.ts",
    "migrate:typography:dry": "tsx scripts/migrate-typography.ts --dry-run"
  }
}
```

---

## 2. Enable TypeScript Strict Mode

**File:** `tsconfig.json`  
**Action:** Change `noImplicitAny` from `false` to `true`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "noImplicitAny": true,  // ← Change this from false to true
    "noUnusedParameters": false,
    "skipLibCheck": true,
    "allowJs": true,
    "noUnusedLocals": false,
    "strictNullChecks": false
  }
}
```

**Expected Result:** TypeScript will show ~223 type errors that need to be fixed.

---

## 3. Run Typography Migration (After Scripts Added)

**Commands to run after adding NPM scripts:**

```bash
# Step 1: Test migration in dry-run mode
npm run migrate:typography:dry -- "src/pages/Auth.tsx"

# Step 2: Review output, then migrate all pages
npm run migrate:typography -- "src/pages/**/*.tsx"

# Step 3: Migrate components
npm run migrate:typography -- "src/components/**/*.tsx"

# Step 4: Manual review of changes
git diff
```

---

## 4. Test the Implementation

**Commands to run after adding NPM scripts:**

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Start Storybook
npm run storybook
```

---

## 5. Fix Type Errors (After Enabling Strict Mode)

**After enabling `noImplicitAny`, you'll need to fix common patterns:**

### Common Pattern 1: Function Parameters
```typescript
// ❌ Before
function handleClick(event) {
  console.log(event);
}

// ✅ After
function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
  console.log(event);
}
```

### Common Pattern 2: Error Handling
```typescript
// ❌ Before
} catch (error) {
  console.log(error.message);
}

// ✅ After
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.log(message);
}
```

### Common Pattern 3: API Responses
```typescript
// ❌ Before
const { data } = await api.get('/campaigns');

// ✅ After
const { data }: { data: Campaign[] } = await api.get('/campaigns');
```

---

## Priority Order

1. **Immediate (5 min):** Add NPM scripts to package.json
2. **Test (10 min):** Run tests and Storybook to verify setup
3. **High Priority (2 hours):** Run typography migration
4. **Medium Priority (8 hours):** Enable strict mode and fix type errors
5. **Ongoing:** Increase test coverage incrementally

---

## Verification Checklist

After completing manual actions:

- [ ] All NPM scripts added and working
- [ ] `npm run test` executes successfully
- [ ] `npm run storybook` starts on port 6006
- [ ] Typography migration completes without errors
- [ ] TypeScript strict mode enabled
- [ ] All type errors resolved
- [ ] E2E tests passing
- [ ] Storybook stories render correctly

---

## Getting Help

If you encounter issues:

1. Check build errors in the console
2. Review `docs/IMPLEMENTATION_REVIEW.md` for context
3. See `docs/ENTERPRISE_ARCHITECTURE.md` for architecture details
4. Ask for assistance with specific error messages
