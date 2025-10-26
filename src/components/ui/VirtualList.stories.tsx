import type { Meta, StoryObj } from '@storybook/react';
import { VirtualList } from './VirtualList';

const meta = {
  title: 'Design System/Performance/VirtualList',
  component: VirtualList,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VirtualList>;

export default meta;
type Story = StoryObj<typeof meta>;

interface SampleItem {
  id: number;
  title: string;
  description: string;
}

const sampleItems: SampleItem[] = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  title: `Item ${i + 1}`,
  description: `This is the description for item ${i + 1}`,
}));

export const BasicList: Story = {
  args: {
    items: sampleItems.slice(0, 100),
    renderItem: (item: SampleItem) => (
      <div className="p-4 border-b hover:bg-muted/50 transition-colors">
        <h3 className="font-semibold">{item.title}</h3>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
    ),
    estimateSize: 80,
    className: 'h-[600px] border rounded-lg',
  },
};

export const LargeDataset: Story = {
  args: {
    items: sampleItems,
    renderItem: (item: SampleItem) => (
      <div className="p-3 border-b">
        <div className="font-medium">{item.title}</div>
        <div className="text-xs text-muted-foreground">{item.description}</div>
      </div>
    ),
    estimateSize: 60,
    className: 'h-[500px] border rounded-lg',
  },
};

export const CompactList: Story = {
  args: {
    items: sampleItems.slice(0, 200),
    renderItem: (item: SampleItem) => (
      <div className="px-4 py-2 border-b text-sm">{item.title}</div>
    ),
    estimateSize: 40,
    className: 'h-[400px] border rounded-lg',
  },
};
