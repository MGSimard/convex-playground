# Implementation Plan

- [x] 1. Create core link management utilities and types
  - Create TypeScript interfaces for CardLink and drag-and-drop data types
  - Implement URL validation functions with proper error handling
  - Create utility functions for link display text and ID generation
  - _Requirements: 1.1, 1.4, 1.5, 1.6, 6.3_

- [x] 2. Extend Convex backend with link management mutations
  - Create updateCardContent mutation with proper argument validation using v.object
  - Create internal helper functions for card content and links operations
  - Implement proper permission checks using ctx.auth.getUserIdentity()
  - Ensure board activity updates are triggered when links are modified
  - Add comprehensive error handling with descriptive error messages
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 3. Implement AddLinkForm component for adding new links
  - Create form component with URL and optional title inputs
  - Implement client-side URL validation with real-time feedback
  - Add form submission handling with proper error states
  - Include form reset functionality after successful addition
  - _Requirements: 1.1, 1.4, 1.5, 1.6_

- [x] 4. Create LinkItem component with drag-and-drop functionality
  - Implement individual link display component with edit/delete actions
  - Add drag handle using @atlaskit/pragmatic-drag-and-drop patterns
  - Implement inline editing for URL and title fields
  - Add delete functionality with proper confirmation
  - Include visual feedback during drag operations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Enhance TabLinks component with full link management
  - Extend existing TabLinks to display current links in vertical list
  - Implement drag-and-drop reordering using pragmatic-drag-and-drop
  - Integrate AddLinkForm component for adding new links
  - Add empty state handling when no links exist
  - Implement proper state management for link operations
  - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Implement dirty state tracking and save/cancel functionality
  - Add state tracking for unsaved changes in EditCard dialog
  - Implement save button enable/disable logic based on dirty state
  - Create alert dialog for unsaved changes confirmation
  - Handle dialog close events (ESC, X button) with dirty state checks
  - Add loading states and proper error handling for save operations
  - Implement success/error toast notifications following existing patterns
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [x] 7. Update Card component to display links
  - Modify Card component to render links at bottom of card content
  - Implement proper styling with link icons and muted text
  - Add link display logic (title vs URL) with proper formatting
  - Ensure links are displayed as vertical list with proper spacing
  - Handle empty links state gracefully
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 8. Integrate link management with existing EditCard dialog
  - Connect all link components to the main EditCard component
  - Implement proper data flow between TabLinks and parent component
  - Ensure save/cancel functionality works with both content and links
  - Add proper loading states during save operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [x] 9. Add comprehensive error handling and user feedback
  - Implement proper error boundaries for link-related components
  - Add user-friendly error messages for various failure scenarios
  - Ensure proper cleanup of drag-and-drop event listeners
  - Add loading states for all async operations
  - _Requirements: 6.3, 6.4, 6.5_
