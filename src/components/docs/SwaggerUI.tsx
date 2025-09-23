/**
 * Swagger UI wrapper component for API documentation
 * Uses CDN to avoid bundle bloat
 */
import { useEffect, useRef } from 'react';
import { apiSpecification } from '@/data/api-specification';

declare global {
  interface Window {
    SwaggerUIBundle: any;
  }
}

interface SwaggerUIProps {
  className?: string;
}

export function SwaggerUI({ className }: SwaggerUIProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Swagger UI CSS and JS from CDN
    const loadSwaggerUI = async () => {
      // Load CSS
      if (!document.querySelector('#swagger-ui-css')) {
        const cssLink = document.createElement('link');
        cssLink.id = 'swagger-ui-css';
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css';
        document.head.appendChild(cssLink);
      }

      // Load JS
      if (!window.SwaggerUIBundle) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js';
        script.onload = () => initSwagger();
        document.head.appendChild(script);
      } else {
        initSwagger();
      }
    };

    const initSwagger = () => {
      if (containerRef.current && window.SwaggerUIBundle) {
        window.SwaggerUIBundle({
          url: '',
          spec: apiSpecification,
          dom_id: '#swagger-container',
          deepLinking: true,
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIBundle.presets.standalone
          ],
          plugins: [
            window.SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          tryItOutEnabled: true,
          requestInterceptor: (request: any) => {
            // Add authentication header if available
            const token = localStorage.getItem('supabase.auth.token');
            if (token) {
              request.headers.Authorization = `Bearer ${token}`;
            }
            return request;
          },
          onComplete: () => {
            // Custom styling for better integration
            const swaggerContainer = document.querySelector('#swagger-container');
            if (swaggerContainer) {
              swaggerContainer.classList.add('swagger-custom');
            }
          }
        });
      }
    };

    loadSwaggerUI();
  }, []);

  useEffect(() => {
    // Add custom CSS for Swagger UI styling
    const styleId = 'swagger-ui-custom-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .swagger-custom {
          font-family: inherit !important;
        }
        .swagger-custom .swagger-ui .topbar {
          display: none;
        }
        .swagger-custom .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-custom .swagger-ui .scheme-container {
          background: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
        }
        .swagger-custom .swagger-ui .opblock {
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .swagger-custom .swagger-ui .opblock.opblock-get .opblock-summary {
          background: hsl(var(--success) / 0.1);
          border-color: hsl(var(--success));
        }
        .swagger-custom .swagger-ui .opblock.opblock-post .opblock-summary {
          background: hsl(var(--primary) / 0.1);
          border-color: hsl(var(--primary));
        }
        .swagger-custom .swagger-ui .opblock.opblock-put .opblock-summary {
          background: hsl(var(--warning) / 0.1);
          border-color: hsl(var(--warning));
        }
        .swagger-custom .swagger-ui .opblock.opblock-delete .opblock-summary {
          background: hsl(var(--destructive) / 0.1);
          border-color: hsl(var(--destructive));
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className={className}>
      <div id="swagger-container" ref={containerRef} />
    </div>
  );
}