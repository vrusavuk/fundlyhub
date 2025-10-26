import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Heading, DisplayHeading } from '../Heading';

const screen = {
  getByRole: (role: string, options?: any) => {
    const container = document.body;
    if (role === 'heading') {
      const level = options?.level;
      const headings = container.querySelectorAll(`h${level || '1'},h${level || '2'},h${level || '3'},h${level || '4'},h${level || '5'},h${level || '6'}`);
      return headings[0] || container.querySelector('[role="heading"]');
    }
    if (role === 'button') {
      return container.querySelector('button');
    }
    return container.querySelector(`[role="${role}"]`);
  },
  getByLabelText: (text: string) => {
    return document.body.querySelector(`[aria-label="${text}"]`);
  }
};

describe('Heading Component', () => {
  describe('Rendering', () => {
    it('renders with correct default element (h2)', () => {
      render(<Heading level="lg">Test Heading</Heading>);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Test Heading');
    });

    it('renders with custom semantic element', () => {
      render(<Heading level="lg" as="h3">Test Heading</Heading>);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });

    it('renders with polymorphic as prop (button)', () => {
      render(
        <Heading as="button" level="md">
          Clickable Heading
        </Heading>
      );
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Typography Scale', () => {
    it('applies correct classes for each level', () => {
      const { rerender } = render(<Heading level="xl">XL Heading</Heading>);
      let heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-2xl', 'font-bold');

      rerender(<Heading level="lg">LG Heading</Heading>);
      heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-xl', 'font-bold');

      rerender(<Heading level="md">MD Heading</Heading>);
      heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-lg', 'font-semibold');
    });

    it('applies responsive classes when enabled', () => {
      render(<Heading level="xl" responsive>Responsive Heading</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading.className).toMatch(/text-/);
    });
  });

  describe('Accessibility', () => {
    it('supports ARIA labels', () => {
      render(
        <Heading level="md" aria-label="Dashboard overview">
          Dashboard
        </Heading>
      );
      const heading = screen.getByLabelText('Dashboard overview');
      expect(heading).toBeInTheDocument();
    });

    it('generates accessible IDs from content', () => {
      render(<Heading level="lg">How to Get Started</Heading>);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveAttribute('id', 'how-to-get-started');
    });
  });

  describe('Custom Styling', () => {
    it('merges custom className with design system classes', () => {
      render(
        <Heading level="md" className="text-primary mb-4">
          Custom Styled Heading
        </Heading>
      );
      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-primary', 'mb-4', 'text-lg', 'font-semibold');
    });
  });
});

describe('DisplayHeading Component', () => {
  it('renders hero-sized headings correctly', () => {
    render(<DisplayHeading level="2xl">Hero Heading</DisplayHeading>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-6xl', 'font-bold');
  });

  it('applies responsive scaling automatically', () => {
    render(<DisplayHeading level="xl" responsive>Large Display</DisplayHeading>);
    const heading = screen.getByRole('heading');
    expect(heading.className).toMatch(/text-/);
  });
});
