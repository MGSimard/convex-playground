# Implementation Plan

- [x] 1. Enhance the getBoards query to include statistics calculation
  - Modify the `getBoards` query in `convex/boards.ts` to calculate and return list counts, card counts, and activity status
  - Add efficient batch processing to avoid N+1 queries when calculating statistics
  - Update the return type validation to include the new statistics fields
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 4.1, 4.2_

- [ ] 2. Determine what to show instead of "Members: #"
  - Since member functionality isn't implemented yet, decide on a useful third statistic
  - Options could be: remove the third item, show favorite status, or show board age
  - Update the design to reflect the chosen approach
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Add error handling and fallback values for statistics
  - Implement try-catch blocks around statistics calculations
  - Provide fallback values ("Lists: -", "Cards: -", "Activity: -") when calculations fail
  - Ensure board display is not blocked by statistics calculation failures
  - _Requirements: 4.3_

- [ ] 4. Update TypeScript types for enhanced board data
  - Update the board interface/type definitions to include the new statistics fields
  - Ensure type safety for listsCount, cardsCount, and activityStatus fields
  - Update any existing type imports in the frontend component
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 5. Replace placeholder statistics in the board overview component
  - Update the board card rendering in `src/routes/sync/index.tsx` to display actual statistics
  - Replace "Lists: #, Cards: #, Members: #" with actual listsCount, cardsCount, and activityStatus
  - Ensure proper formatting and display of the statistics
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3_

- [ ] 6. Add unit tests for statistics calculation functions
  - Write tests for the activity status calculation helper function
  - Test statistics calculation with various board configurations (empty boards, boards with content)
  - Test error handling scenarios and fallback value behavior
  - _Requirements: 4.3_

- [ ] 7. Test the complete feature integration
  - Verify that the enhanced board overview displays correct statistics
  - Test with various board states (new boards, active boards, inactive boards)
  - Ensure no performance regression in the board overview loading
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_
