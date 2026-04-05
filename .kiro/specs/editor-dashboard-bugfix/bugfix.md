# Bugfix Requirements Document

## Introduction

Three bugs affect the Editor Dashboard in ReelZomato. First, numerous CSS class names used in `EditorDashboard.jsx` are not defined in `EditorDashboard.css`, causing unstyled or broken layouts across ProfileView, SettingsView, PortfolioView, EarningsView modal, ActiveProjects, and CompletedProjects. Second, the `VideoSubmissionsManager` has no actual file upload flow for `in_progress` submissions — the "Submit for Review" button only changes status without uploading the edited video file, even though the backend endpoint `POST /api/video-submissions/editor/:submissionId/upload-edited` and the service method `uploadEditedVideo` already exist. Third, when the filter is set to `'all'` in `VideoSubmissionsManager`, an empty object `{}` is passed as params to `getEditorSubmissions`, resulting in no `status` query param being sent — the backend logs `Status filter: undefined` and the filter tabs for non-`all` values may not work correctly because the status param is never sent.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN ProfileView renders with `.profile-fields`, `.field-group`, `.skills-container`, `.add-skill-btn`, `.remove-skill`, `.account-info`, `.info-item`, `.info-label`, `.info-value` class names THEN the system applies no styles to those elements because those classes are not defined in `EditorDashboard.css`

1.2 WHEN SettingsView renders with `.settings-view`, `.settings-section`, `.settings-group`, `.setting-item`, `.setting-info`, `.number-input`, `.time-selector`, `.account-actions` class names THEN the system applies no styles to those elements because those classes are not defined in `EditorDashboard.css`

1.3 WHEN PortfolioView renders portfolio items using `.item-content`, `.item-description`, `.item-stats`, `.play-btn`, `.item-duration`, `.tag` class names THEN the system applies no styles to those elements because those classes are not defined in `EditorDashboard.css`

1.4 WHEN EarningsView renders the withdrawal modal using `.withdrawal-info` and `.form-group` class names THEN the system applies no styles to those elements because those classes are not defined in `EditorDashboard.css`

1.5 WHEN ActiveProjects renders project cards using `.project-card.detailed`, `.project-header`, `.project-description`, `.project-details`, `.detail-item`, `.requirements`, `.project-actions`, `.action-btn.edit`, `.action-btn.upload`, `.action-btn.complete` class names THEN the system applies no styles to those elements because those classes are not defined in `EditorDashboard.css`

1.6 WHEN CompletedProjects renders using `.completed-grid`, `.completed-card.detailed`, `.completed-overlay` class names THEN the system applies no styles to those elements because those classes are not defined in `EditorDashboard.css`

1.7 WHEN an editor has an `in_progress` submission and clicks the "Submit for Review" button in `VideoSubmissionsManager` THEN the system calls `updateSubmissionStatus` with status `review` and progress `100` but never uploads any edited video file to the backend

1.8 WHEN the editor clicks "Submit for Review" on an `in_progress` submission THEN the system changes the submission status to `review` without prompting the editor to select or upload an edited video file

1.9 WHEN `VideoSubmissionsManager` fetches editor submissions with `filter === 'all'` THEN the system passes `{}` as params, sending no `status` query parameter to the backend

1.10 WHEN `VideoSubmissionsManager` fetches editor submissions with a specific status filter (e.g. `filter === 'in_progress'`) THEN the system passes `{ status: 'in_progress' }` correctly, but the `'all'` case sends an empty object which causes the backend to log `Status filter: undefined`

### Expected Behavior (Correct)

2.1 WHEN ProfileView renders with `.profile-fields`, `.field-group`, `.skills-container`, `.add-skill-btn`, `.remove-skill`, `.account-info`, `.info-item`, `.info-label`, `.info-value` class names THEN the system SHALL apply appropriate layout and visual styles defined in `EditorDashboard.css` for those classes

2.2 WHEN SettingsView renders with `.settings-view`, `.settings-section`, `.settings-group`, `.setting-item`, `.setting-info`, `.number-input`, `.time-selector`, `.account-actions` class names THEN the system SHALL apply appropriate layout and visual styles defined in `EditorDashboard.css` for those classes

2.3 WHEN PortfolioView renders portfolio items using `.item-content`, `.item-description`, `.item-stats`, `.play-btn`, `.item-duration`, `.tag` class names THEN the system SHALL apply appropriate layout and visual styles defined in `EditorDashboard.css` for those classes

2.4 WHEN EarningsView renders the withdrawal modal using `.withdrawal-info` and `.form-group` class names THEN the system SHALL apply appropriate layout and visual styles defined in `EditorDashboard.css` for those classes

2.5 WHEN ActiveProjects renders project cards using `.project-card.detailed`, `.project-header`, `.project-description`, `.project-details`, `.detail-item`, `.requirements`, `.project-actions`, `.action-btn.edit`, `.action-btn.upload`, `.action-btn.complete` class names THEN the system SHALL apply appropriate layout and visual styles defined in `EditorDashboard.css` for those classes

2.6 WHEN CompletedProjects renders using `.completed-grid`, `.completed-card.detailed`, `.completed-overlay` class names THEN the system SHALL apply appropriate layout and visual styles defined in `EditorDashboard.css` for those classes

2.7 WHEN an editor has an `in_progress` submission and initiates the submission flow THEN the system SHALL present a file input allowing the editor to select their edited video file before submitting

2.8 WHEN the editor selects an edited video file and confirms submission THEN the system SHALL call `videoSubmissionService.uploadEditedVideo(submissionId, formData)` with the selected file as `editedVideo` in a multipart form, uploading it to `POST /api/video-submissions/editor/:submissionId/upload-edited`

2.9 WHEN `VideoSubmissionsManager` fetches editor submissions with `filter === 'all'` THEN the system SHALL send the request without a `status` query parameter (or explicitly omit it), so the backend returns all submissions without filtering

2.10 WHEN `VideoSubmissionsManager` fetches editor submissions with any specific status filter THEN the system SHALL send the correct `status` query parameter so the backend filters results accordingly

### Unchanged Behavior (Regression Prevention)

3.1 WHEN CSS classes that are already defined in `EditorDashboard.css` are used (e.g. `.stats-grid`, `.stat-card`, `.project-card`, `.progress-bar`, `.modal-overlay`, `.toggle-switch`, etc.) THEN the system SHALL CONTINUE TO apply those styles correctly without regression

3.2 WHEN an editor has an `assigned` submission and clicks "Start Editing" THEN the system SHALL CONTINUE TO call `handleStatusUpdate` with status `in_progress` and progress `10` as before

3.3 WHEN an editor has an `available` submission and clicks "Assign to Me" THEN the system SHALL CONTINUE TO call `handleAssignSubmission` correctly as before

3.4 WHEN `VideoSubmissionsManager` is used by a food partner (`userType === 'food-partner'`) THEN the system SHALL CONTINUE TO call `getFoodPartnerSubmissions` with the correct params as before

3.5 WHEN the `SubmissionDetailsModal` is opened for any submission THEN the system SHALL CONTINUE TO display project details, instructions, and messages tabs correctly

3.6 WHEN the filter is set to a specific status (e.g. `'assigned'`, `'in_progress'`, `'review'`, `'completed'`) THEN the system SHALL CONTINUE TO pass `{ status: filter }` as params to the API call
