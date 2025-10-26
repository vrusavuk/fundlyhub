import type { Meta, StoryObj } from '@storybook/react';
import { Heading, DisplayHeading } from './Heading';

/**
 * Typography components enforce design system consistency
 * 
 * ## When to use
 * - Use `<DisplayHeading>` for hero sections and page titles
 * - Use `<Heading>` for section and card headings
 * 
 * ## Accessibility
 * - Always use semantic heading hierarchy (h1 → h2 → h3)
 * - Use `as` prop to control HTML element
 * - Add `id` for anchor link support
 */
const meta = {
  title: 'Design System/Typography/Heading',
  component: Heading,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Semantic heading component with design system styling'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'select',
      options: ['xl', 'lg', 'md', 'sm', 'xs'],
      description: 'Size variant from design system scale'
    },
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description: 'Semantic HTML element'
    },
    responsive: {
      control: 'boolean',
      description: 'Enable responsive sizing (mobile → desktop)'
    }
  }
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    level: 'md',
    children: 'Section Heading',
  },
};

export const AllLevels: Story = {
  args: {
    level: 'md',
    children: 'Example'
  },
  render: () => (
    <div className="space-y-4">
      <Heading level="xl" as="h2">Extra Large Heading</Heading>
      <Heading level="lg" as="h3">Large Heading</Heading>
      <Heading level="md" as="h4">Medium Heading</Heading>
      <Heading level="sm" as="h5">Small Heading</Heading>
      <Heading level="xs" as="h6">Extra Small Heading</Heading>
    </div>
  ),
};

export const Responsive: Story = {
  args: {
    level: 'xl',
    responsive: true,
    children: 'Responsive Heading (resize to see)',
  },
};

export const CustomStyled: Story = {
  args: {
    level: 'lg',
    className: 'text-primary mb-4',
    children: 'Custom Styled Heading',
  },
};

export const DisplayHeadings: Story = {
  args: {
    level: 'md',
    children: 'Example'
  },
  render: () => (
    <div className="space-y-6">
      <DisplayHeading level="2xl" as="h1" responsive>
        Display 2XL - Hero Heading
      </DisplayHeading>
      <DisplayHeading level="xl" as="h1" responsive>
        Display XL - Large Hero
      </DisplayHeading>
      <DisplayHeading level="lg" as="h1">
        Display LG - Medium Hero
      </DisplayHeading>
      <DisplayHeading level="md" as="h1">
        Display MD - Small Hero
      </DisplayHeading>
      <DisplayHeading level="sm" as="h1">
        Display SM - Minimal Hero
      </DisplayHeading>
    </div>
  ),
};

export const AccessibilityExample: Story = {
  args: {
    level: 'md',
    children: 'Example'
  },
  render: () => (
    <article className="space-y-4">
      <DisplayHeading level="md" as="h1" id="article-title">
        Article Title (H1)
      </DisplayHeading>
      <Heading level="lg" as="h2" id="section-1">
        First Section (H2)
      </Heading>
      <Heading level="md" as="h3">
        Subsection (H3)
      </Heading>
      <Heading level="lg" as="h2" id="section-2">
        Second Section (H2)
      </Heading>
    </article>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates proper heading hierarchy for accessibility'
      }
    }
  }
};

export const WithAriaLabel: Story = {
  args: {
    level: 'md',
    'aria-label': 'Dashboard overview section',
    children: 'Dashboard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use aria-label for additional context for screen readers'
      }
    }
  }
};
