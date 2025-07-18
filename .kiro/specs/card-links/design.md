# Design Document

## Overview

The card links feature extends the existing Kanban card system to support multiple links with optional titles. The feature integrates seamlessly with the current architecture, using the existing schema (which already includes the links field), UI patterns, and drag-and-drop system. The implementation follows the established patterns for data persistence, user interactions, and visual design.

## Architecture

### Data Model

The links feature leverages the existing schema structure in `convex/schema.ts`:

```typescript
cards: defineTable({
  listId: v.id("lists"),
  content: v.string(),
  position: v.number(),
  links: v.optional(
    v.array(
      v.object({
        id: v.string(),
        url: v.string(),
        title: v.optional(v.string()),
      })
    )
  ),
}).index("by_list", ["listId"]),
```

Each link object contains:

- `id`: Unique identifier for drag-and-drop operations and React keys
- `url`: The actual URL (validated for format)
- `title`: Optional display name (falls back to URL if not provided)

### Component Architecture

The feature extends the existing `EditCard` component with:

1. **Enhanced TabLinks Component**: Manages the links interface within the edit dialog
2. **LinkItem Component**: Individual link display and editing component with drag handle
3. **AddLinkForm Component**: Form for adding new links
4. **Enhanced Card Component**: Displays links in the card view

### State Management

The implementation uses React's built-in state management:

- Local state for link editing within the dialog
- Dirty state tracking for save/cancel functionality
- Optimistic updates with proper error handling

## Components and Interfaces

### LinkItem Component

```typescript
interface LinkItemProps {
  link: CardLink;
  index: number;
  onUpdate: (id: string, updates: Partial<CardLink>) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}
```

Features:

- Drag handle using `@atlaskit/pragmatic-drag-and-drop`
- Inline editing for URL and title
- Delete functionality
- Visual feedback during drag operations

### AddLinkForm Component

```typescript
interface AddLinkFormProps {
  onAdd: (link: Omit<CardLink, "id">) => void;
}
```

Features:

- URL validation
- Optional title input
- Form submission handling
- Reset after successful addition

### Enhanced TabLinks Component

```typescript
interface TabLinksProps {
  links: CardLink[];
  onLinksChange: (links: CardLink[]) => void;
}
```

Features:

- Link list management
- Drag-and-drop reordering
- Add/edit/delete operations
- Empty state handling

### Drag and Drop Integration

The links reordering system extends the existing drag-and-drop utilities:

```typescript
interface LinkDragData extends Record<string | symbol, unknown> {
  type: "link";
  linkId: string;
  cardId: Id<"cards">;
}

interface LinkDropData extends Record<string | symbol, unknown> {
  type: "link";
  linkId: string;
  cardId: Id<"cards">;
}
```

## Data Models

### CardLink Interface

```typescript
interface CardLink {
  id: string;
  url: string;
  title?: string;
}
```

### URL Validation

URL validation ensures proper format:

- Must be a valid URL format
- Supports http, https, and other common protocols
- Provides user-friendly error messages

### Link Display Logic

```typescript
const getDisplayText = (link: CardLink): string => {
  return link.title || link.url;
};
```

## Error Handling

### Client-Side Validation

- URL format validation before saving
- Required field validation
- Duplicate URL prevention within the same card

### Server-Side Validation

- URL format validation in Convex mutations
- Permission checks using existing `checkPermission` utility
- Proper error responses with descriptive messages

### User Feedback

- Toast notifications for success/error states
- Inline validation messages
- Loading states during operations

## Testing Strategy

### Unit Tests

- Link validation functions
- Component rendering with various link states
- Drag-and-drop reordering logic
- State management functions

### Integration Tests

- Full edit dialog workflow
- Save/cancel functionality with dirty state
- Link display on cards
- Drag-and-drop operations

### End-to-End Tests

- Complete user workflows
- Cross-browser compatibility
- Accessibility compliance
- Performance under load

## User Experience Design

### Visual Design

Links follow the established design system:

- Consistent with existing card styling
- `text-muted-foreground` and `text-xs` for card display
- Link icons from Lucide React
- Proper spacing and alignment

### Interaction Design

- Drag handles only visible in edit mode
- Hover states for interactive elements
- Clear visual feedback during operations
- Consistent with existing drag-and-drop patterns

### Accessibility

- Proper ARIA labels for drag handles
- Keyboard navigation support
- Screen reader compatibility
- Focus management during operations

## Performance Considerations

### Optimization Strategies

- Efficient re-rendering using React.memo where appropriate
- Debounced validation for URL inputs
- Optimistic updates for better perceived performance
- Minimal DOM manipulations during drag operations

### Data Efficiency

- Only send changed data to server
- Batch operations where possible
- Proper cleanup of event listeners
- Memory leak prevention

## Security Considerations

### URL Validation

- Client and server-side URL format validation
- Prevention of malicious URL schemes
- XSS protection through proper escaping

### Permission Model

- Consistent with existing card permissions
- Member+ required for adding/editing links
- Admin+ required for deleting links (if different from cards)

## Integration Points

### Existing Systems

- Convex mutations for data persistence
- Existing permission system
- Current toast notification system
- Established drag-and-drop patterns

### API Extensions

The feature uses existing `updateCardPositions` mutation pattern, potentially extending it or creating a new `updateCardContent` mutation:

```typescript
export const updateCardContent = mutation({
  args: {
    cardId: v.id("cards"),
    content: v.optional(v.string()),
    links: v.optional(
      v.array(
        v.object({
          id: v.string(),
          url: v.string(),
          title: v.optional(v.string()),
        })
      )
    ),
  },
  // ... implementation
});
```

## Migration Strategy

Since the schema already includes the links field as optional, no database migration is required. The feature can be deployed incrementally:

1. Backend mutations for link management
2. Frontend components for link editing
3. Card display updates
4. Drag-and-drop functionality

## Monitoring and Analytics

### Key Metrics

- Link addition/deletion rates
- Drag-and-drop usage frequency
- Error rates for URL validation
- User engagement with links feature

### Error Tracking

- Client-side error logging
- Server-side error monitoring
- Performance metrics tracking
- User feedback collection
