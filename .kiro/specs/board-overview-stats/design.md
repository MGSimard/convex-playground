# Design Document

## Overview

This design enhances the board overview cards by replacing placeholder statistics with actual data. The solution extends the existing `getBoards` query to include list counts, card counts, and a meaningful third metric, ensuring efficient data fetching without performance degradation.

## Architecture

### Data Flow

1. The existing `getBoards` query in `convex/boards.ts` will be enhanced to include statistics
2. Statistics will be calculated server-side during the query execution
3. The React component will consume the enhanced data without additional client-side queries
4. No new API endpoints or queries are needed

### Performance Considerations

- Statistics calculation will be integrated into the existing `getBoards` query to avoid N+1 queries
- Batch processing will be used to calculate stats for all boards efficiently
- Fallback values will be provided for error cases

## Components and Interfaces

### Enhanced Board Query Response

```typescript
// Enhanced return type for getBoards query
{
  _id: v.id("boards"),
  _creationTime: v.number(),
  shortId: v.string(),
  name: v.string(),
  createdBy: v.id("users"),
  createdByName: v.optional(v.string()),
  lastModifiedTime: v.number(),
  lastModifiedBy: v.id("users"),
  lastModifiedByName: v.optional(v.string()),
  isFavorited: v.boolean(),
  // New statistics fields
  listsCount: v.number(),
  cardsCount: v.number(),
  activityStatus: v.string(), // "Recent", "X days ago", or "Inactive"
}
```

### Statistics Calculation Logic

```typescript
// Pseudo-code for statistics calculation
for each board:
  1. Query lists by boardId
  2. For each list, query cards by listId
  3. Sum card counts across all lists
  4. Calculate activity status based on lastModifiedTime
  5. Return aggregated statistics
```

### Activity Status Algorithm

- **"Recent"**: lastModifiedTime within 7 days
- **"X days ago"**: lastModifiedTime between 7-30 days (show exact days)
- **"Inactive"**: lastModifiedTime > 30 days ago
- **Fallback**: Use creation time if lastModifiedTime is unavailable

## Data Models

### No Schema Changes Required

The existing schema supports all required data:

- `boards` table: provides lastModifiedTime for activity calculation
- `lists` table: indexed by boardId for efficient counting
- `cards` table: indexed by listId for efficient counting

### Query Optimization Strategy

```typescript
// Efficient batch processing approach
1. Fetch all boards (existing logic)
2. Extract all board IDs
3. Batch query all lists for these boards
4. Batch query all cards for the retrieved lists
5. Group and count by board
6. Merge statistics with board data
```

## Error Handling

### Statistics Calculation Failures

- If list count fails: display "Lists: -"
- If card count fails: display "Cards: -"
- If activity calculation fails: display "Activity: -"
- Log errors for debugging but don't block board display

### Data Consistency

- Handle cases where lists exist but board is deleted
- Handle cases where cards exist but list is deleted
- Graceful degradation when statistics are partially available

## Testing Strategy

### Unit Tests

1. Test statistics calculation with various board configurations:
   - Empty boards (0 lists, 0 cards)
   - Boards with lists but no cards
   - Boards with multiple lists and cards
   - Boards with recent vs old activity

2. Test activity status calculation:
   - Recent activity (< 7 days)
   - Medium activity (7-30 days)
   - Inactive boards (> 30 days)
   - Edge cases around boundary dates

3. Test error handling:
   - Missing board data
   - Corrupted list/card relationships
   - Database query failures

### Integration Tests

1. Test enhanced getBoards query performance with large datasets
2. Verify statistics accuracy against manual counts
3. Test React component rendering with new statistics data

### Performance Tests

1. Measure query execution time with various board counts
2. Verify no N+1 query patterns
3. Test memory usage during statistics calculation

## Implementation Approach

### Phase 1: Enhance Backend Query

1. Modify `getBoards` query in `convex/boards.ts`
2. Add statistics calculation logic
3. Update return type validation
4. Add error handling and fallbacks

### Phase 2: Update Frontend Component

1. Update TypeScript types for enhanced board data
2. Replace placeholder statistics in board cards
3. Add proper formatting for activity status
4. Handle loading and error states

### Phase 3: Testing and Optimization

1. Add comprehensive test coverage
2. Performance testing and optimization
3. Error handling verification
4. User acceptance testing
