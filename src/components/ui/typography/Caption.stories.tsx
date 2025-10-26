import type { Meta, StoryObj } from '@storybook/react';
import { Caption } from './Text';

const meta = {
  title: 'Design System/Typography/Caption',
  component: Caption,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Caption size variant',
    },
    muted: {
      control: 'boolean',
      description: 'Apply muted foreground color',
    },
  },
} satisfies Meta<typeof Caption>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small caption text (xs)',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium caption text (sm)',
  },
};

export const Muted: Story = {
  args: {
    size: 'md',
    muted: true,
    children: 'Muted caption text',
  },
};

export const WithCustomClass: Story = {
  args: {
    size: 'md',
    className: 'text-primary',
    children: 'Caption with custom color',
  },
};
