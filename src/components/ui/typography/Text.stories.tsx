import type { Meta, StoryObj } from '@storybook/react';
import { Text, Caption, Label } from './Text';

const meta = {
  title: 'Design System/Typography/Text',
  component: Text,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Text components for body content, captions, and labels'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xl', 'lg', 'md', 'sm'],
      description: 'Size variant from design system scale'
    },
    emphasis: {
      control: 'select',
      options: ['high', 'medium', 'low', 'subtle'],
      description: 'Text emphasis level'
    },
    as: {
      control: 'select',
      options: ['p', 'span', 'div'],
      description: 'HTML element'
    }
  }
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 'md',
    children: 'This is body text using the design system.',
  },
};

export const AllSizes: Story = {
  args: {
    size: 'md',
    children: 'Example'
  },
  render: () => (
    <div className="space-y-4">
      <Text size="xl">Extra Large Text - Perfect for lead paragraphs</Text>
      <Text size="lg">Large Text - Good for important content</Text>
      <Text size="md">Medium Text - Standard body text</Text>
      <Text size="sm">Small Text - For secondary information</Text>
    </div>
  ),
};

export const EmphasisLevels: Story = {
  args: {
    size: 'md',
    children: 'Example'
  },
  render: () => (
    <div className="space-y-4">
      <Text size="md" emphasis="high">High Emphasis - Most important text</Text>
      <Text size="md" emphasis="medium">Medium Emphasis - Standard text</Text>
      <Text size="md" emphasis="low">Low Emphasis - Less important text</Text>
      <Text size="md" emphasis="subtle">Subtle Emphasis - Minimal prominence</Text>
    </div>
  ),
};

export const CaptionComponent: Story = {
  args: {
    size: 'md',
    children: 'Example'
  },
  render: () => (
    <div className="space-y-4">
      <div>
        <Caption size="lg">Large Caption</Caption>
        <p className="text-sm text-muted-foreground">For metadata and timestamps</p>
      </div>
      <div>
        <Caption size="md">Medium Caption</Caption>
        <p className="text-sm text-muted-foreground">Standard caption size</p>
      </div>
      <div>
        <Caption size="sm">Small Caption</Caption>
        <p className="text-sm text-muted-foreground">For fine print</p>
      </div>
      <div>
        <Caption size="xs">Extra Small Caption</Caption>
        <p className="text-sm text-muted-foreground">Minimal text size</p>
      </div>
    </div>
  ),
};

export const LabelComponent: Story = {
  args: {
    size: 'md',
    children: 'Example'
  },
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label size="lg" htmlFor="input-1">Large Label</Label>
        <input id="input-1" className="border rounded px-3 py-2 w-full" placeholder="Input field" />
      </div>
      <div className="space-y-2">
        <Label size="md" htmlFor="input-2">Medium Label</Label>
        <input id="input-2" className="border rounded px-3 py-2 w-full" placeholder="Input field" />
      </div>
      <div className="space-y-2">
        <Label size="sm" htmlFor="input-3">Small Label</Label>
        <input id="input-3" className="border rounded px-3 py-2 w-full" placeholder="Input field" />
      </div>
    </div>
  ),
};

export const RealWorldExample: Story = {
  args: {
    size: 'md',
    children: 'Example'
  },
  render: () => (
    <article className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Caption size="sm">Published on January 15, 2025</Caption>
        <Text size="xl" emphasis="high">
          How to Build Enterprise-Grade React Applications
        </Text>
      </div>
      
      <Text size="lg" emphasis="low">
        A comprehensive guide to building scalable, maintainable React applications
        with TypeScript, testing, and modern best practices.
      </Text>
      
      <div className="space-y-3">
        <Text size="md">
          In this article, we'll explore the essential patterns and tools needed to create
          production-ready React applications that can scale to millions of users.
        </Text>
        
        <Text size="md">
          We'll cover testing strategies, performance optimization, type safety with TypeScript,
          and architectural patterns that have proven successful in large-scale applications.
        </Text>
      </div>
      
      <div className="border-t pt-4 mt-6">
        <Caption size="md">By John Doe • 10 min read</Caption>
      </div>
    </article>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of how typography components work together in a real article'
      }
    }
  }
};
