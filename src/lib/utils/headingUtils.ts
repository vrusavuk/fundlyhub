/**
 * Utility functions for heading manipulation and table of contents generation
 */

export interface TocItem {
  id: string;
  text: string;
  level: number;
  element: Element;
}

/**
 * Generates a unique, URL-safe ID from text
 */
export function generateHeadingId(text: string, existingIds: Set<string>): string {
  const baseId = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim();

  if (!baseId) return 'heading'; // Fallback for empty text

  let uniqueId = baseId;
  let counter = 1;

  while (existingIds.has(uniqueId)) {
    uniqueId = `${baseId}-${counter}`;
    counter++;
  }

  return uniqueId;
}

/**
 * Extracts and processes headings from the document
 */
export function extractHeadings(
  selector: string = 'h1, h2',
  containerSelector?: string
): TocItem[] {
  const container = containerSelector 
    ? document.querySelector(containerSelector) 
    : document;

  if (!container) return [];

  const headings = Array.from(container.querySelectorAll(selector));
  const existingIds = new Set<string>();

  return headings.map((heading) => {
    const text = heading.textContent?.trim() || '';
    const level = parseInt(heading.tagName.charAt(1));

    // Get or generate ID
    let id = heading.getAttribute('id');
    if (!id && text) {
      id = generateHeadingId(text, existingIds);
      heading.setAttribute('id', id);
    }

    if (id) {
      existingIds.add(id);
    }

    return {
      id: id || '',
      text,
      level,
      element: heading,
    };
  }).filter(item => item.id && item.text); // Filter out invalid items
}

/**
 * Smoothly scrolls to a heading with proper offset
 */
export function scrollToHeading(
  id: string, 
  offset: number = 100,
  behavior: ScrollBehavior = 'smooth'
): boolean {
  const element = document.getElementById(id);
  if (!element) return false;

  const elementTop = element.getBoundingClientRect().top;
  const offsetPosition = elementTop + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior,
  });

  return true;
}

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}