# Kanban Drag & Drop Implementation Plan

## 📋 Overview

Implementing drag and drop functionality for the kanban board using Pragmatic Drag and Drop library.

**Target Features:**

- List reordering within board
- Card reordering within lists
- Card movement between lists
- Optimistic UI updates
- Visual feedback during drag operations

---

## 🏗️ Implementation Phases

### Phase 1: Setup & Dependencies

- [ ] Install Pragmatic Drag and Drop library (`@atlaskit/pragmatic-drag-and-drop`)
- [ ] Install drop indicator library (`@atlaskit/pragmatic-drag-and-drop-react-drop-indicator`)
- [ ] Create utility functions for position calculations
- [ ] Set up TypeScript types for drag operations
- [ ] Create custom hooks for drag and drop logic

**Files to create:**

- [ ] `src/_hooks/useDragAndDrop.ts` - Custom hook for drag and drop logic
- [ ] `src/_lib/dragUtils.ts` - Utility functions for position calculations
- [ ] `src/_components/kanban/DragPreview.tsx` - Preview components during drag

**Key APIs to use:**

- `draggable()` - makes elements draggable
- `dropTargetForElements()` - makes elements drop targets
- `monitorForElements()` - monitors global drag events
- `combine()` - combines cleanup functions

### Phase 2: List Drag & Drop

- [ ] Add drag handles to List components
- [ ] Implement drag source functionality for lists
- [ ] Create drop zones between lists
- [ ] Add visual feedback (ghost/preview) during list drag
- [ ] Hook up to `reorderLists` mutation
- [ ] Implement optimistic updates for list reordering
- [ ] Handle edge cases (first/last positions)

**Files to modify:**

- [ ] `src/routes/sync/$boardId.$boardName.tsx` - Add drag context for lists
- [ ] `src/_components/kanban/List.tsx` - Make lists draggable

### Phase 3: Card Drag & Drop

- [ ] Add drag handles to Card components
- [ ] Implement intra-list card reordering
- [ ] Implement inter-list card movement
- [ ] Create drop zones within lists
- [ ] Add visual feedback for card dragging
- [ ] Hook up to `reorderCards` and `moveCard` mutations
- [ ] Implement optimistic updates for card operations
- [ ] Handle empty list states

**Files to modify:**

- [ ] `src/_components/kanban/Card.tsx` - Add card drag functionality
- [ ] `src/_components/kanban/List.tsx` - Add card drop zones

### Phase 4: Polish & Testing

- [ ] Add smooth animations and transitions
- [ ] Improve visual feedback and indicators
- [ ] Test error handling and rollback scenarios
- [ ] Optimize performance for large boards
- [ ] Add accessibility features (keyboard navigation)
- [ ] Test edge cases and error scenarios

---

## 🔧 Technical Implementation Details

### Position Calculation Strategy

```typescript
// For lists: Calculate new positions based on drop location
const calculateListPosition = (lists: Doc<"lists">[], dragIndex: number, hoverIndex: number) => {
  // Use gap-based system to avoid position conflicts
  const sortedLists = lists.sort((a, b) => a.position - b.position);

  if (hoverIndex === 0) {
    return sortedLists[0].position - 1;
  } else if (hoverIndex >= sortedLists.length) {
    return sortedLists[sortedLists.length - 1].position + 1;
  } else {
    const prev = sortedLists[hoverIndex - 1];
    const next = sortedLists[hoverIndex];
    return (prev.position + next.position) / 2;
  }
};

// For cards: Handle both same-list and cross-list moves
const calculateCardPosition = (
  cards: Doc<"cards">[],
  dragIndex: number,
  hoverIndex: number,
  targetListId: Id<"lists">
) => {
  const listCards = cards.filter((card) => card.listId === targetListId);
  const sortedCards = listCards.sort((a, b) => a.position - b.position);

  // Similar gap-based calculation as lists
  if (hoverIndex === 0) {
    return sortedCards.length > 0 ? sortedCards[0].position - 1 : 0;
  } else if (hoverIndex >= sortedCards.length) {
    return sortedCards.length > 0 ? sortedCards[sortedCards.length - 1].position + 1 : 0;
  } else {
    const prev = sortedCards[hoverIndex - 1];
    const next = sortedCards[hoverIndex];
    return (prev.position + next.position) / 2;
  }
};
```

### Optimistic Updates Pattern

```typescript
const { mutate: reorderLists } = useMutation({
  mutationFn: useConvexMutation(api.lists.reorderLists),
  onMutate: async (variables) => {
    // Optimistically update the cache
    await queryClient.cancelQueries({ queryKey: ["board", boardId] });
    const previousData = queryClient.getQueryData(["board", boardId]);

    // Update cache with new order
    queryClient.setQueryData(["board", boardId], (old) => {
      // Update list positions optimistically
    });

    return { previousData };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(["board", boardId], context?.previousData);
  },
});
```

### Pragmatic Drag and Drop Setup Pattern

```typescript
// Basic draggable setup with React
useEffect(() => {
  const element = ref.current;
  if (!element) return;

  return combine(
    draggable({
      element,
      getInitialData: () => ({ type: "list", listId: list._id }),
      onDragStart: () => setState("dragging"),
      onDrop: () => setState("idle"),
    }),
    dropTargetForElements({
      element,
      canDrop: ({ source }) => source.data.type === "list",
      getData: ({ input, element }) => ({
        type: "list-drop-target",
        listId: list._id,
      }),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    })
  );
}, [list._id]);

// Global monitoring for drag operations
useEffect(() => {
  return monitorForElements({
    onDrop: ({ source, location }) => {
      const destination = location.current.dropTargets[0];
      if (!destination) return;

      // Handle the drop operation
      handleDrop(source.data, destination.data);
    },
  });
}, []);
```

---

## 📚 Convex Integration Points

### Existing Mutations to Use

- [x] `api.lists.reorderLists` - For list reordering
- [x] `api.cards.reorderCards` - For card reordering within same list
- [x] `api.cards.moveCard` - For moving cards between lists

### Data Structure Understanding

- [x] Lists use `position: number` for ordering
- [x] Cards use `position: number` for ordering
- [x] Current sorting: `sort((a, b) => a.position - b.position)`

---

## 🎯 Success Criteria

### Functional Requirements

- [ ] Users can drag lists to reorder them within a board
- [ ] Users can drag cards to reorder them within a list
- [ ] Users can drag cards between different lists
- [ ] All operations have optimistic UI updates
- [ ] Error states properly rollback changes

### Technical Requirements

- [ ] Follows Convex best practices for mutations
- [ ] Uses TanStack Query patterns for optimistic updates
- [ ] Maintains TypeScript type safety
- [ ] Handles loading and error states gracefully

### UX Requirements

- [ ] Smooth visual feedback during drag operations
- [ ] Clear drop zones and indicators
- [ ] Responsive design works on different screen sizes
- [ ] Accessible keyboard navigation (future enhancement)

---

## 📝 Implementation Notes

### Key Decisions

- **Library Choice:** Pragmatic Drag and Drop (user preference, actively maintained)
- **Position System:** Numeric positions with gap-based insertion
- **Optimistic Updates:** TanStack Query with rollback on error
- **Error Handling:** Toast notifications + cache rollback

### Architecture Considerations

- Use existing HTML structure (`<ol>` for lists, `<ul>` for cards)
- Leverage current TanStack Query setup
- Maintain separation of concerns (hooks, utils, components)
- Follow existing naming conventions and patterns

---

## 🐛 Known Challenges & Solutions

### Challenge 1: Position Calculation

**Problem:** Determining new position values when dropping items
**Solution:** Gap-based system with position recalculation

### Challenge 2: Optimistic Updates

**Problem:** UI must update immediately but rollback on error
**Solution:** TanStack Query's onMutate/onError pattern

### Challenge 3: Cross-List Card Movement

**Problem:** Complex state updates when moving cards between lists
**Solution:** Use existing `moveCard` mutation with proper position calculation

---

## 📋 Testing Checklist

### Basic Functionality

- [ ] List drag and drop works
- [ ] Card drag within list works
- [ ] Card drag between lists works
- [ ] Optimistic updates work correctly
- [ ] Error handling and rollback works

### Edge Cases

- [ ] Empty lists handle drops correctly
- [ ] First/last position calculations work
- [ ] Rapid successive drags don't break state
- [ ] Network errors properly rollback
- [ ] Large boards perform well

### Browser Compatibility

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

## 🎉 Completion Status

**Overall Progress: 0% Complete**

- [ ] Phase 1: Setup & Dependencies (0/4 tasks)
- [ ] Phase 2: List Drag & Drop (0/7 tasks)
- [ ] Phase 3: Card Drag & Drop (0/8 tasks)
- [ ] Phase 4: Polish & Testing (0/6 tasks)

**Next Steps:**

1. ✅ Get Pragmatic Drag and Drop documentation
2. Install dependencies and set up base structure
3. Begin with Phase 1 implementation

**Current Status:** Ready to begin implementation with complete documentation and patterns

**Available Reference Materials:**

- ✅ Complete Pragmatic Drag and Drop documentation (via context7)
- ✅ Official Atlassian kanban example (saved in `.cursor/atlassian-kanban-example.md`)
- ✅ Implementation patterns and best practices documented
- ✅ Technical approach validated with existing codebase

---

_Last Updated: [Current Date]_
_Implementation Status: Fully Prepared - Documentation + Official Example Ready_
