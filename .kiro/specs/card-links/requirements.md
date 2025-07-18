# Requirements Document

## Introduction

This feature adds comprehensive link management capabilities to Kanban cards, allowing users to attach, organize, and display multiple links within cards. Users can add links with optional titles, reorder them using drag-and-drop functionality, and view them both in the edit dialog and on the card itself. The feature includes proper validation, persistence, and user experience patterns consistent with the existing application.

## Requirements

### Requirement 1

**User Story:** As a user, I want to add multiple links to cards so that I can reference related resources and documentation.

#### Acceptance Criteria

1. WHEN a user opens the Edit Card dialog THEN the system SHALL display a links tab alongside existing tabs
2. WHEN a user clicks the links tab THEN the system SHALL show a vertical list of current links with their display order
3. WHEN a user clicks the add link button (+) THEN the system SHALL provide input fields for URL and optional title
4. WHEN a user enters a valid URL THEN the system SHALL accept and store the link
5. WHEN a user enters an optional title THEN the system SHALL use the title for display instead of the raw URL
6. WHEN a user leaves the title field empty THEN the system SHALL display the raw URL as the link text

### Requirement 2

**User Story:** As a user, I want to reorder links within cards so that I can prioritize and organize my references effectively.

#### Acceptance Criteria

1. WHEN viewing links in the edit dialog THEN each link SHALL display a drag handle for reordering
2. WHEN a user drags a link by its handle THEN the system SHALL provide visual feedback using pragmatic drag-and-drop
3. WHEN a user drops a link in a new position THEN the system SHALL update the link order immediately
4. WHEN links are reordered THEN the system SHALL maintain the new order in both the edit dialog and card display
5. WHEN drag operations occur THEN the system SHALL use the same drag-and-drop patterns as existing list and card reordering

### Requirement 3

**User Story:** As a user, I want to edit and delete existing links so that I can maintain accurate and relevant references.

#### Acceptance Criteria

1. WHEN a user clicks on an existing link in the edit dialog THEN the system SHALL allow editing of URL and title
2. WHEN a user modifies a link's URL or title THEN the system SHALL validate the URL format
3. WHEN a user clicks a delete button for a link THEN the system SHALL remove the link from the card
4. WHEN a link is deleted THEN the system SHALL update the display order of remaining links
5. WHEN editing links THEN the system SHALL mark the card as having unsaved changes

### Requirement 4

**User Story:** As a user, I want to see card links displayed on the card itself so that I can quickly access referenced resources without opening the edit dialog.

#### Acceptance Criteria

1. WHEN a card has links THEN the system SHALL display them at the bottom of the card content
2. WHEN displaying links on cards THEN each link SHALL show a small link icon before the text
3. WHEN a link has a title THEN the system SHALL display the title instead of the raw URL
4. WHEN a link has no title THEN the system SHALL display the raw URL
5. WHEN displaying links THEN the system SHALL use text-muted-foreground and text-xs styling
6. WHEN displaying multiple links THEN the system SHALL show them as a vertical list

### Requirement 5

**User Story:** As a user, I want proper save/cancel functionality in the edit dialog so that I can control when my changes are applied and avoid losing work accidentally.

#### Acceptance Criteria

1. WHEN a user makes changes to card content or links THEN the system SHALL mark the dialog as having unsaved changes (dirty state)
2. WHEN the dialog is in a dirty state THEN the Save button SHALL be enabled
3. WHEN the dialog has no unsaved changes THEN the Save button SHALL be disabled
4. WHEN a user clicks Cancel with unsaved changes THEN the system SHALL show an alert dialog asking for confirmation
5. WHEN a user attempts to close the dialog (ESC, X button) with unsaved changes THEN the system SHALL show an alert dialog asking for confirmation
6. WHEN a user clicks Save THEN the system SHALL display a loading state on the Save button with spinner animation
7. WHEN saving is successful THEN the system SHALL show a success toast message and close the dialog
8. WHEN saving fails THEN the system SHALL show an error toast message and keep the dialog open
9. WHEN a user confirms cancellation THEN the system SHALL discard changes and close the dialog

### Requirement 6

**User Story:** As a developer, I want the links feature to integrate seamlessly with the existing data model and API patterns so that it maintains consistency with the application architecture.

#### Acceptance Criteria

1. WHEN storing card links THEN the system SHALL extend the existing cards schema to include links data
2. WHEN updating card links THEN the system SHALL use the existing mutation patterns for data persistence
3. WHEN validating links THEN the system SHALL ensure URL format correctness before saving
4. WHEN handling link operations THEN the system SHALL maintain the same permission model as other card operations
5. WHEN updating links THEN the system SHALL trigger board activity updates consistent with other card modifications
