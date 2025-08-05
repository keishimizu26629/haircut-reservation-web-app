# Frontend Development Guidelines for Claude

## Project Overview
This is the frontend module of the Haircut Reservation System built with React and TypeScript.

## Code Review Focus Areas

### 1. React Best Practices
- Use functional components with hooks
- Proper state management (useState, useReducer, Context API)
- Avoid unnecessary re-renders (useMemo, useCallback)
- Component composition over inheritance
- Proper key usage in lists

### 2. TypeScript Standards
- Strong typing for all components, props, and state
- Avoid using `any` type
- Use interfaces for object shapes
- Proper type exports/imports

### 3. Security Requirements
- Sanitize all user inputs
- Prevent XSS attacks
- Secure API calls with proper authentication
- Never expose sensitive data in frontend code

### 4. Performance Guidelines
- Lazy loading for routes and heavy components
- Image optimization
- Bundle size monitoring
- Code splitting strategies

### 5. Accessibility (a11y)
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

### 6. Styling Standards
- CSS Modules or styled-components
- Responsive design (mobile-first)
- Consistent spacing and typography
- Theme variables for colors

## File Structure
```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utility functions
│   ├── services/       # API services
│   ├── types/          # TypeScript types
│   └── styles/         # Global styles
```

## Testing Requirements
- Unit tests for utilities and hooks
- Component testing with React Testing Library
- Integration tests for critical user flows
- Minimum 80% code coverage

## Prohibited Practices
- Direct DOM manipulation
- Inline styles (except for dynamic values)
- Console.log in production code
- Hardcoded API endpoints
- Storing sensitive data in localStorage