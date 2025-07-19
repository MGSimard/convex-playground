# Design Document

## Overview

This design implements the disabling of drag functionality when a link is in edit mode within the LinkItem component. The solution focuses on conditionally disabling the drag and drop setup and providing appropriate visual feedback to users.

## Architecture

The solution leverages the existing drag and drop architecture using @atlaskit/pragmatic-drag-and-drop but adds conditional logic based on the `isEditing` state. The design maintains the current component structure while adding safeguards to prevent drag operations during editing.

### Key Design Principles

1. **State-driven behavior**: Use the existing `isEditing` state to control drag functionality
2. **Conditional setup**: Only initialize drag and drop when not in edit mode
3. **Visual consistency**: Maintain visual hierarchy while clearly indicating disabled state
4. **Accessibility**: Ensure screen readers understand when drag functionality is unavailable

## Components and Interfaces

### LinkItem Component Modifications

The LinkItem component will be modified to:

1. **Conditional Drag Setup**: The `useEffect` hook that sets up drag and drop will include a condition to only initialize when `!isEditing`
2. **Visual State Management**: The drag handle will have conditional styling based on edit state
3. **Cursor Management**: The cursor will not change to grab/grabbing when in edit mode

### State Management

No new state variables are required. The existing `isEditing` boolean state will be used to control:

- Drag and drop initialization
- Visual styling of the drag handle
- Cursor behavior

## Data Models

No changes to existing data models are required. The solution works with the current:

- `CardLink` interface
- `LinkDragData` and `LinkDropData` types
- Component props interface

## Error Handling

### Edge Cases Handled

1. **Mid-edit drag attempts**: If somehow a drag is initiated while editing, it will be ignored
2. **State transitions**: Proper cleanup when transitioning between edit and non-edit modes
3. **Multiple simultaneous edits**: Each link item manages its own edit state independently

### Error Prevention

- Drag setup is completely bypassed when in edit mode, preventing any drag-related errors
- Visual cues prevent user confusion about available interactions

## Testing Strategy

### Unit Tests

1. **Drag Handle Visibility**: Test that drag handle has appropriate styling in edit vs non-edit modes
2. **Drag Setup Conditional**: Verify drag and drop is only initialized when not editing
3. **State Transitions**: Test behavior when entering and exiting edit mode
4. **Visual Feedback**: Confirm cursor and opacity changes work correctly

### Integration Tests

1. **Multi-link Scenarios**: Test that editing one link doesn't affect drag functionality of others
2. **Drag and Drop Flow**: Verify normal drag operations work when not in edit mode
3. **Edit Mode Isolation**: Confirm that edit mode completely prevents drag operations

### Accessibility Tests

1. **Screen Reader Support**: Verify aria-labels and roles are appropriate for disabled state
2. **Keyboard Navigation**: Ensure keyboard users can still navigate effectively
3. **Focus Management**: Test focus behavior when entering/exiting edit mode

## Implementation Details

### Conditional Drag Setup

```typescript
useEffect(() => {
  const element = linkRef.current;
  if (!element || isEditing) return; // Add isEditing condition

  // Existing drag and drop setup code...
}, [link.id, cardId, index, onReorder, dragState, closestEdge, isEditing]); // Add isEditing to deps
```

### Visual State Management

The drag handle will use conditional classes:

```typescript
<GripVertical
  className={cn(
    "h-4 w-4 text-muted-foreground transition-opacity",
    isEditing
      ? "opacity-30 cursor-default" // Disabled state
      : "cursor-grab hover:text-foreground opacity-0 group-hover:opacity-100" // Normal state
  )}
  aria-label={isEditing ? "Drag disabled while editing" : "Drag to reorder"}
/>
```

### Drop Target Behavior

When in edit mode, the link should still be able to receive drops from other links, but should not be draggable itself. The drop target functionality will remain active to maintain consistent reordering behavior.

## Performance Considerations

- **Minimal overhead**: The conditional check adds negligible performance impact
- **Memory efficiency**: Drag listeners are not created when in edit mode, reducing memory usage
- **Re-render optimization**: Changes only affect the specific link being edited

## Security Considerations

No security implications as this is purely a UI/UX enhancement that doesn't affect data handling or API interactions.
