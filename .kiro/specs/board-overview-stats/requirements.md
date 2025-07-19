# Requirements Document

## Introduction

Replace the placeholder statistics "Lists: #, Cards: #, Members: #" on board overview cards with actual useful data that helps users quickly understand each board's content and scale.

## Requirements

### Requirement 1

**User Story:** As a user browsing boards, I want to see the actual number of lists in each board, so that I can understand the board's organizational structure.

#### Acceptance Criteria

1. WHEN viewing the board overview THEN each board card SHALL display "Lists: X" where X is the actual count of lists
2. WHEN a board has no lists THEN it SHALL display "Lists: 0"

### Requirement 2

**User Story:** As a user browsing boards, I want to see the total number of cards across all lists, so that I can gauge the amount of work or content in each board.

#### Acceptance Criteria

1. WHEN viewing the board overview THEN each board card SHALL display "Cards: X" where X is the total count of cards across all lists
2. WHEN a board has no cards THEN it SHALL display "Cards: 0"
3. WHEN counting cards THEN the system SHALL sum cards from all lists within that board

### Requirement 3

**User Story:** As a user browsing boards, I want to see something more useful than member count (since members aren't implemented), so that the third statistic provides value.

#### Acceptance Criteria

1. WHEN viewing the board overview THEN each board card SHALL display a third useful metric instead of "Members: #"
2. WHEN determining the third metric THEN it SHALL be either recent activity indicator, favorite status, or board age
3. WHEN the metric is activity-based THEN it SHALL use existing lastModifiedTime data
4. WHEN the metric cannot be calculated THEN it SHALL display a meaningful fallback

### Requirement 4

**User Story:** As a user, I want the board statistics to load efficiently, so that the overview page remains fast and responsive.

#### Acceptance Criteria

1. WHEN loading board statistics THEN the system SHALL fetch data efficiently without N+1 queries
2. WHEN statistics are unavailable THEN the system SHALL show appropriate fallback values
3. WHEN the page loads THEN statistics SHALL appear without additional loading indicators
