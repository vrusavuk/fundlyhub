/**
 * Secure HTML Renderer Component
 * Wraps DOMPurify sanitization in a React component for convenience
 */
import { sanitizeHTML } from '../utils/sanitize';

interface SecureHtmlRendererProps {
  html: string;
  className?: string;
}

/**
 * Component for safely rendering user-generated HTML content
 * Automatically sanitizes HTML to prevent XSS attacks
 */
export function SecureHtmlRenderer({ html, className = '' }: SecureHtmlRendererProps) {
  const sanitized = sanitizeHTML(html);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

/**
 * Usage example:
 * 
 * ```tsx
 * <SecureHtmlRenderer 
 *   html={fundraiser.story_html} 
 *   className="prose max-w-none"
 * />
 * ```
 */
