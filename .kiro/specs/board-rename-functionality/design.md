# Design Document

## Overview

The board renaming functionality will be implemented by adding rename capabilities to two existing UI locations: the board dropdown menu in the OverviewActions component and a new edit button in the sync route header. The implementation will leverage the existing `renameBoard` mutation from the backend and follow established UI patterns in the codebase.

The design focuses on creating a reusable rename dialog component that can be triggered from multiple locations, ensuring consistency and maintainability. The solution integrates seamlessly with the existing permission system and provides immediate feedback through toast notifications.

## Architecture

### Component Structure

```
src/_components/kanban/
├── RenameBoardDialog.tsx (new)
├── OverviewActions.tsx (modified)
└── Combobox.tsx (no changes needed)

src/routes/sync/
└── route.tsx (modified)
```

### Data Flow

1. **User Interaction**: User clicks rename button in either location
2. **Permission Check**: Component checks user permissions (admin required)
3. **Dialog Display**: RenameBoardDialog opens with current board name
4. **Form Submission**: User submits new name, validation occurs
5. **API Call**: `renameBoard` mutation is called with new name
6. **State Update**: React Query optimistically updates and then refetches
7. **User Feedback**: Toast notification shows success/error status

### Integration Points

- **Existing Backend**: Uses `api.boards.renameBoard` mutation
- **Permission System**: Leverages `checkPermission` function (admin level required)
- **State Management**: Integrates with React Query for cache management
- **UI Components**: Uses existing shadcn/ui components (Dialog, Button, Input)
- **Notifications**: Uses existing Sonner toast system

## Components and Interfaces

### RenameBoardDialog Component

**Purpose**: Reusable dialog component for renaming boards

**Props Interface**:

```typescript
interface RenameBoardDialogProps {
  boardId: Id<"boards">;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
```

**Key Features**:

- Pre-fills input with current board name
- Auto-focuses and selects text on open
- Validates input (non-empty, trimmed)
- Shows loading state during mutation
- Handles keyboard shortcuts (Enter to submit, Escape to close)
- Provides success/error feedback via toast

**State Management**:

- Local state for form input value
- Loading state from mutation
- Form validation state

### Modified OverviewActions Component

**Changes**:

- Add rename dialog state management
- Add "Rename" menu item between "Favorite" and "Permissions"
- Include RenameBoardDialog component
- Handle rename success by invalidating queries

**Permission Integration**:

- Only show rename option for users with admin permissions
- Use existing permission checking pattern from the component

### Modified Sync Route Header

**Changes**:

- Add edit button next to existing AddBoard component
- Show edit button only when viewing a specific board (boardId exists)
- Include RenameBoardDialog component
- Handle rename success by updating URL if board name changes

**Conditional Rendering**:

- Edit button only appears when `currentShortId` is present
- Button uses existing styling patterns from AddBoard component

## Data Models

### Form State

```typescript
interface RenameFormState {
  name: string;
  isValid: boolean;
  isSubmitting: boolean;
}
```

### Mutation Parameters

```typescript
// Uses existing renameBoard mutation signature
{
  boardId: Id<"boards">;
  newName: string;
}
```

## Error Handling

### Validation Errors

- **Empty Name**: Disable submit button, show visual feedback
- **Whitespace Only**: Trim input, treat as empty
- **Same Name**: Allow submission (no-op on backend)

### API Errors

- **Unauthorized**: Show "ERROR: Unauthorized" toast
- **Board Not Found**: Show "ERROR: Board not found" toast
- **Network Error**: Show generic error message with retry option
- **Unknown Error**: Show error message from API response

### UI Error States

- **Loading State**: Disable form inputs, show spinner
- **Error State**: Keep dialog open, show error toast
- **Success State**: Close dialog, show success toast, update UI

## Testing Strategy

### Unit Tests

- **RenameBoardDialog Component**:
  - Renders with correct initial state
  - Validates input correctly
  - Handles form submission
  - Shows loading states
  - Handles keyboard events

- **OverviewActions Integration**:
  - Shows rename option for admin users
  - Hides rename option for non-admin users
  - Opens dialog with correct props

- **Route Header Integration**:
  - Shows edit button only when viewing board
  - Opens dialog with correct board data
  - Handles successful rename

### Integration Tests

- **End-to-End Rename Flow**:
  - Complete rename from board list
  - Complete rename from board header
  - Permission-based access control
  - Error handling scenarios

### Manual Testing Scenarios

- **Permission Testing**:
  - Admin user can access rename functionality
  - Non-admin user cannot see rename options
  - Proper error messages for unauthorized attempts

- **UI/UX Testing**:
  - Dialog opens with correct focus
  - Keyboard navigation works properly
  - Loading states are clear
  - Success/error feedback is immediate

## Implementation Notes

### Styling Consistency

- Use existing shadcn/ui component patterns
- Follow established spacing and typography
- Maintain consistent icon usage (PencilIcon for edit actions)
- Use existing color schemes for buttons and states

### Performance Considerations

- Optimistic updates for immediate UI feedback
- Proper query invalidation to maintain data consistency
- Debounced input validation to reduce unnecessary renders
- Lazy loading of dialog content until needed

### Accessibility

- Proper ARIA labels for dialog and form elements
- Keyboard navigation support (Tab, Enter, Escape)
- Screen reader announcements for state changes
- Focus management when dialog opens/closes

### Browser Compatibility

- Uses standard React patterns supported in target browsers
- Leverages existing Radix UI primitives for cross-browser consistency
- No additional polyfills required beyond existing setup
