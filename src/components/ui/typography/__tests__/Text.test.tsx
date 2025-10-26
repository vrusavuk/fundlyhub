import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text, Caption, Label } from '../Text';

describe('Text Component', () => {
  describe('Rendering', () => {
    it('renders with default size (md)', () => {
      render(<Text>Test text</Text>);
      const text = screen.getByText('Test text');
      expect(text).toBeInTheDocument();
      expect(text.tagName).toBe('P');
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<Text size="lg">Large text</Text>);
      let text = screen.getByText('Large text');
      expect(text).toHaveClass('text-lg');

      rerender(<Text size="sm">Small text</Text>);
      text = screen.getByText('Small text');
      expect(text).toHaveClass('text-sm');
    });

    it('renders with polymorphic as prop', () => {
      render(<Text as="span">Span text</Text>);
      const text = screen.getByText('Span text');
      expect(text.tagName).toBe('SPAN');
    });
  });

  describe('Styling', () => {
    it('applies muted styling', () => {
      render(<Text muted>Muted text</Text>);
      const text = screen.getByText('Muted text');
      expect(text).toHaveClass('text-muted-foreground');
    });

    it('merges custom className', () => {
      render(<Text className="custom-class">Custom text</Text>);
      const text = screen.getByText('Custom text');
      expect(text).toHaveClass('custom-class');
    });
  });
});

describe('Caption Component', () => {
  it('renders with correct default size', () => {
    render(<Caption>Caption text</Caption>);
    const caption = screen.getByText('Caption text');
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveClass('text-sm');
  });

  it('renders small caption', () => {
    render(<Caption size="sm">Small caption</Caption>);
    const caption = screen.getByText('Small caption');
    expect(caption).toHaveClass('text-xs');
  });

  it('applies muted styling', () => {
    render(<Caption muted>Muted caption</Caption>);
    const caption = screen.getByText('Muted caption');
    expect(caption).toHaveClass('text-muted-foreground');
  });
});

describe('Label Component', () => {
  it('renders with uppercase styling', () => {
    render(<Label>Label text</Label>);
    const label = screen.getByText('Label text');
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass('uppercase', 'tracking-wider');
  });

  it('renders with semibold weight', () => {
    render(<Label>Bold label</Label>);
    const label = screen.getByText('Bold label');
    expect(label).toHaveClass('font-semibold');
  });
});
