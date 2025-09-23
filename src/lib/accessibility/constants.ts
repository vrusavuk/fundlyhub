/**
 * Accessibility constants and ARIA labels
 * Centralized accessibility strings and configurations
 */

// ARIA Labels
export const ARIA_LABELS = {
  // Navigation
  MAIN_NAVIGATION: 'Main navigation',
  USER_MENU: 'User account menu',
  SEARCH: 'Search fundraisers',
  BREADCRUMB: 'Breadcrumb navigation',
  PAGINATION: 'Pagination navigation',
  
  // Actions
  EDIT: 'Edit',
  DELETE: 'Delete', 
  SAVE: 'Save changes',
  CANCEL: 'Cancel',
  CLOSE: 'Close',
  OPEN: 'Open',
  VIEW: 'View details',
  DONATE: 'Make a donation',
  SHARE: 'Share fundraiser',
  
  // Forms
  REQUIRED_FIELD: 'Required field',
  OPTIONAL_FIELD: 'Optional field',
  FORM_ERROR: 'Form contains errors',
  FORM_SUCCESS: 'Form submitted successfully',
  
  // Content
  FUNDRAISER_CARD: 'Fundraiser information',
  DONOR_LIST: 'List of donors',
  PROGRESS_BAR: 'Fundraising progress',
  IMAGE_GALLERY: 'Image gallery',
  
  // Status
  LOADING: 'Loading content',
  ERROR: 'Error occurred',
  SUCCESS: 'Success',
  WARNING: 'Warning',
  
  // Filters and sorting
  FILTER: 'Filter options',
  SORT: 'Sort options',
  SEARCH_RESULTS: 'Search results',
  NO_RESULTS: 'No results found',
} as const;

// Live region messages
export const LIVE_MESSAGES = {
  PAGE_LOADED: 'Page loaded',
  CONTENT_UPDATED: 'Content updated',
  ERROR_OCCURRED: 'An error occurred',
  ITEM_ADDED: 'Item added',
  ITEM_REMOVED: 'Item removed',
  ITEM_UPDATED: 'Item updated',
  SEARCH_COMPLETE: 'Search completed',
  FILTER_APPLIED: 'Filter applied',
  FORM_SUBMITTED: 'Form submitted',
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  // Navigation
  HOME: 'Alt+H',
  SEARCH: 'Alt+S', 
  SKIP_TO_CONTENT: 'Alt+C',
  HELP: 'Alt+?',
  
  // Actions
  SAVE: 'Ctrl+S',
  CANCEL: 'Escape',
  SUBMIT: 'Ctrl+Enter',
  
  // Movement
  NEXT: 'ArrowDown',
  PREVIOUS: 'ArrowUp',
  FIRST: 'Home',
  LAST: 'End',
} as const;

// Focus management selectors
export const FOCUSABLE_ELEMENTS = [
  'button',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
] as const;

// Color contrast ratios (WCAG guidelines)
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
} as const;

// Screen reader text helpers
export const SR_TEXT = {
  EXTERNAL_LINK: '(opens in new window)',
  REQUIRED: '(required)',
  OPTIONAL: '(optional)',
  ERROR: 'Error:',
  WARNING: 'Warning:',
  SUCCESS: 'Success:',
  INFO: 'Info:',
} as const;

// Reduced motion preferences
export const MOTION_PREFERENCES = {
  REDUCE: 'reduce',
  NO_PREFERENCE: 'no-preference',
} as const;

// Landmark roles
export const LANDMARK_ROLES = {
  BANNER: 'banner',
  MAIN: 'main',
  NAVIGATION: 'navigation',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  SEARCH: 'search',
  REGION: 'region',
} as const;