# Requirements Document

## Introduction

This feature adds board renaming functionality to the Kanban application, allowing users to rename boards from two different locations: the board dropdown menu in the board list view and an edit button in the site header when viewing a specific board. The feature leverages the existing `renameBoard` mutation in the backend and provides a consistent user experience across both entry points.

## Requirements

### Requirement 1

**User Story:** As a user with admin permissions, I want to rename a board from the board list dropdown menu, so that I can update board names without navigating to the board itself.

#### Acceptance Criteria

1. WHEN a user clicks on a board's dropdown menu in the board list THEN the system SHALL display a "Rename" option in the dropdown menu
2. WHEN a user clicks the "Rename" option THEN the system SHALL open a rename dialog with the current board name pre-filled
3. WHEN a user submits a new board name THEN the system SHALL validate the name is not empty and update the board using the existing `renameBoard` mutation
4. WHEN the rename operation succeeds THEN the system SHALL show a success toast notification and update the board list display
5. WHEN the rename operation fails THEN the system SHALL show an error toast with the failure reason
6. IF the user does not have admin permissions THEN the system SHALL NOT display the rename option in the dropdown menu

### Requirement 2

**User Story:** As a user with admin permissions viewing a specific board, I want to rename the board from the site header, so that I can quickly update the board name while working on it.

#### Acceptance Criteria

1. WHEN a user is viewing a specific board THEN the system SHALL display an edit button to the right of the existing + button in the site header
2. WHEN a user clicks the edit button THEN the system SHALL open a rename dialog with the current board name pre-filled
3. WHEN a user submits a new board name THEN the system SHALL validate the name is not empty and update the board using the existing `renameBoard` mutation
4. WHEN the rename operation succeeds THEN the system SHALL show a success toast notification and update the board title in the header and URL if needed
5. WHEN the rename operation fails THEN the system SHALL show an error toast with the failure reason
6. IF the user does not have admin permissions THEN the system SHALL NOT display the edit button in the header
7. WHEN the user is not viewing a specific board THEN the system SHALL NOT display the edit button

### Requirement 3

**User Story:** As a user, I want a consistent rename dialog experience, so that the interface feels cohesive regardless of where I initiate the rename action.

#### Acceptance Criteria

1. WHEN either rename dialog is opened THEN the system SHALL display the same dialog component with consistent styling and behavior
2. WHEN the dialog opens THEN the system SHALL focus the input field and select all existing text for easy replacement
3. WHEN a user presses Enter in the input field THEN the system SHALL submit the rename request
4. WHEN a user presses Escape or clicks outside the dialog THEN the system SHALL close the dialog without saving changes
5. WHEN the input field is empty or contains only whitespace THEN the system SHALL disable the submit button
6. WHEN the rename operation is in progress THEN the system SHALL show a loading state and disable form interactions

### Requirement 4

**User Story:** As a user, I want immediate feedback when renaming boards, so that I understand the current state of my actions.

#### Acceptance Criteria

1. WHEN a rename operation is initiated THEN the system SHALL show a loading indicator in the dialog
2. WHEN a rename operation succeeds THEN the system SHALL display a success toast message indicating the board was renamed
3. WHEN a rename operation fails due to permissions THEN the system SHALL display an error toast with "ERROR: Unauthorized" message
4. WHEN a rename operation fails due to board not found THEN the system SHALL display an error toast with "ERROR: Board not found" message
5. WHEN a rename operation fails due to network issues THEN the system SHALL display an appropriate error message
6. WHEN the board list or header updates after rename THEN the system SHALL reflect the new name immediately without requiring a page refresh
