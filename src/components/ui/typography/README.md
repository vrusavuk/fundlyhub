# Typography System

This directory contains reusable typography components that enforce our design system's text styling standards. All typography in the application should use these components instead of hardcoded Tailwind classes.

## 🎯 Why Use These Components?

- **Consistency**: Ensures all text follows the design system
- **Maintainability**: Update typography across the entire app from one place
- **Responsive**: Built-in responsive sizing support
- **Accessibility**: Proper semantic HTML and ARIA attributes
- **Type Safety**: TypeScript ensures you use valid props

## 📦 Available Components

### `<DisplayHeading>`

Large headings for hero sections and page titles.

**Props:**
- `level`: `'2xl' | 'xl' | 'lg' | 'md' | 'sm'` - Size variant
- `as`: `'h1' | 'h2' | 'h3'` - HTML element (default: `'h1'`)
- `responsive`: `boolean` - Enable responsive sizing (default: `false`)
- `className`: `string` - Additional Tailwind classes
- `children`: `React.ReactNode` - Content

**Example:**
```tsx
import { DisplayHeading } from '@/components/ui/typography';

<DisplayHeading level="2xl" as="h1" responsive>
  Welcome to FundlyHub
</DisplayHeading>
```

**Sizes:**
- `2xl`: 3xl → 4xl → 6xl (responsive)
- `xl`: 2xl → 3xl → 5xl
- `lg`: xl → 2xl → 4xl
- `md`: lg → xl → 3xl
- `sm`: base → lg → 2xl

---

### `<Heading>`

Section and card headings.

**Props:**
- `level`: `'xl' | 'lg' | 'md' | 'sm' | 'xs'` - Size variant
- `as`: `'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'` - HTML element (default: `'h2'`)
- `responsive`: `boolean` - Enable responsive sizing (default: `false`)
- `className`: `string` - Additional Tailwind classes
- `children`: `React.ReactNode` - Content

**Example:**
```tsx
import { Heading } from '@/components/ui/typography';

<Heading level="lg" as="h2">
  Section Title
</Heading>
```

**Sizes:**
- `xl`: text-2xl font-semibold
- `lg`: text-xl font-semibold
- `md`: text-lg font-semibold
- `sm`: text-base font-semibold
- `xs`: text-sm font-semibold

---

### `<Text>`

Body text and paragraphs.

**Props:**
- `size`: `'xl' | 'lg' | 'md' | 'sm'` - Size variant
- `as`: `'p' | 'span' | 'div'` - HTML element (default: `'p'`)
- `emphasis`: `'high' | 'medium' | 'low' | 'subtle'` - Text emphasis level
- `responsive`: `boolean` - Enable responsive sizing (default: `false`)
- `className`: `string` - Additional Tailwind classes
- `children`: `React.ReactNode` - Content

**Example:**
```tsx
import { Text } from '@/components/ui/typography';

<Text size="lg" emphasis="low">
  This is a description paragraph with muted emphasis.
</Text>
```

**Sizes:**
- `xl`: text-xl leading-relaxed
- `lg`: text-lg leading-relaxed
- `md`: text-base leading-normal
- `sm`: text-sm leading-normal

**Emphasis:**
- `high`: text-foreground
- `medium`: text-foreground/80
- `low`: text-muted-foreground
- `subtle`: text-muted-foreground/70

---

### `<Caption>`

Small text for metadata, labels, and supplementary information.

**Props:**
- `size`: `'lg' | 'md' | 'sm' | 'xs'` - Size variant
- `as`: `'p' | 'span' | 'div'` - HTML element (default: `'span'`)
- `className`: `string` - Additional Tailwind classes
- `children`: `React.ReactNode` - Content

**Example:**
```tsx
import { Caption } from '@/components/ui/typography';

<Caption size="sm">
  Posted 2 hours ago
</Caption>
```

**Sizes:**
- `lg`: text-sm
- `md`: text-xs
- `sm`: text-xs
- `xs`: text-xs

**Note:** Captions automatically use `text-muted-foreground` color.

---

### `<Label>`

Form labels and UI labels.

**Props:**
- `size`: `'lg' | 'md' | 'sm'` - Size variant
- `as`: `'label' | 'span'` - HTML element (default: `'label'`)
- `htmlFor`: `string` - Associated input ID
- `className`: `string` - Additional Tailwind classes
- `children`: `React.ReactNode` - Content

**Example:**
```tsx
import { Label } from '@/components/ui/typography';

<Label size="md" htmlFor="email">
  Email Address
</Label>
```

**Sizes:**
- `lg`: text-sm font-semibold uppercase tracking-wide
- `md`: text-xs font-semibold uppercase tracking-wide
- `sm`: text-xs font-medium

---

## 🔄 Migration Guide

### Before (Hardcoded Classes)
```tsx
<h1 className="text-3xl font-bold">Page Title</h1>
<h2 className="text-2xl font-semibold mb-4">Section Title</h2>
<p className="text-lg text-muted-foreground">Description text</p>
<span className="text-xs text-muted-foreground">Metadata</span>
```

### After (Typography Components)
```tsx
import { DisplayHeading, Heading, Text, Caption } from '@/components/ui/typography';

<DisplayHeading level="md" as="h1">Page Title</DisplayHeading>
<Heading level="xl" as="h2" className="mb-4">Section Title</Heading>
<Text size="lg" emphasis="low">Description text</Text>
<Caption size="xs">Metadata</Caption>
```

---

## 📐 Design Tokens

All components use design tokens from `src/lib/design/typography.ts`:

```typescript
typographyScale = {
  display: { /* Hero/page headings */ },
  heading: { /* Section headings */ },
  body: { /* Paragraph text */ },
  caption: { /* Small text */ },
  label: { /* Form labels */ }
}
```

---

## 🎨 Common Patterns

### Hero Section
```tsx
<DisplayHeading level="2xl" as="h1" responsive>
  Successful fundraisers start here
</DisplayHeading>
<Text size="xl" emphasis="low" className="max-w-2xl mx-auto">
  Get started in just a few minutes with our powerful platform.
</Text>
```

### Card Component
```tsx
<Card>
  <CardHeader>
    <Heading level="lg" as="h3">Card Title</Heading>
  </CardHeader>
  <CardContent>
    <Text size="md" emphasis="low">
      Card description text.
    </Text>
    <Caption size="sm" className="mt-2">Last updated 2 hours ago</Caption>
  </CardContent>
</Card>
```

### Stats Display
```tsx
<div className="space-y-2">
  <Heading level="xl" className="text-primary">$2.5M+</Heading>
  <Caption size="md">Total funds raised</Caption>
</div>
```

### Page Header
```tsx
<DisplayHeading level="sm" as="h1" responsive>
  Analytics Dashboard
</DisplayHeading>
<Text size="md" emphasis="low" className="mt-2">
  Platform performance metrics and insights
</Text>
```

---

## ⚠️ Best Practices

### DO:
✅ Use typography components for all text
✅ Use semantic HTML elements (`as` prop)
✅ Use `emphasis` prop for color variations
✅ Add responsive sizing for large text
✅ Keep heading hierarchy correct (h1 → h2 → h3)

### DON'T:
❌ Use hardcoded `text-*` or `font-*` classes
❌ Skip heading levels (h1 → h3)
❌ Use generic `<div>` when semantic tags work
❌ Override colors with hardcoded classes
❌ Duplicate typography patterns

---

## 🔧 Extending the System

To add new typography styles:

1. Update `src/lib/design/typography.ts` with new scale
2. Add new component or extend existing ones
3. Export from `index.ts`
4. Update this documentation

---

## 🐛 Troubleshooting

**Problem:** Text looks wrong in dark mode
**Solution:** Use `emphasis` prop instead of hardcoded colors

**Problem:** Need custom spacing
**Solution:** Use `className` prop for margins/padding only

**Problem:** Need different color
**Solution:** Check if semantic color exists in design system first

**Problem:** Component not accepting props
**Solution:** Check TypeScript types - you might be using wrong size/level

---

## 📚 Related Files

- `src/lib/design/typography.ts` - Design tokens and utilities
- `src/components/ui/typography/Heading.tsx` - Heading components
- `src/components/ui/typography/Text.tsx` - Text components
- `tailwind.config.ts` - Tailwind theme configuration
- `src/index.css` - Global typography styles

---

## 🤝 Contributing

When adding new components:
1. Follow existing patterns
2. Use design tokens from `typography.ts`
3. Add TypeScript types
4. Include JSDoc comments
5. Update this README
6. Add examples to design system docs

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-26  
**Maintained by:** Design System Team
