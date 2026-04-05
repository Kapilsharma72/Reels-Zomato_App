# Requirements Document

## Introduction

This feature covers the end-to-end delivery flow for edited videos in ReelZomato. When an editor finishes editing and uploads the result, the system must confirm the delivery to the editor and surface the video on the food partner's dashboard. The food partner can then view details, download the edited video, approve or request a revision, and rate the work. Real-time WebSocket notifications keep both parties informed without requiring a page refresh.

The feature builds on top of existing backend endpoints and the `videoSubmissionService.js` frontend service. The primary frontend work is:
1. A clear post-upload confirmation state on the editor side (`VideoSubmissionsManager`).
2. A fully functional "Edited Videos" review section in `FoodPartnerDashboard` (the `EditedVideos` component already exists but needs approve/revision actions and real-time notification wiring).

## Glossary

- **VideoSubmissionsManager**: The React component used by editors to manage their assigned video projects.
- **EditedVideos**: The React component rendered inside `FoodPartnerDashboard` under the "Edited Videos" tab.
- **FoodPartnerDashboard**: The main dashboard page for food partners (`FoodPartnerDashboard.jsx`).
- **Submission**: A `VideoSubmission` MongoDB document representing one video editing project.
- **Review_Status**: The `review` value of the `status` field on a Submission, set when an editor uploads the edited video.
- **Completed_Status**: The `completed` value of the `status` field, set when the food partner approves the video.
- **Revision_Requested_Status**: A status value (e.g. `revision_requested`) indicating the food partner wants changes.
- **WebSocket_Service**: The `websocketService` singleton used by the frontend (`useWebSocket` hook) and the backend (`websocket.service.js`).
- **video_edit_completed**: The Socket.io event name emitted by the backend when an editor uploads an edited video.

---

## Requirements

### Requirement 1: Editor Post-Upload Confirmation

**User Story:** As an editor, after I upload an edited video, I want to see a clear confirmation that it has been sent to the food partner, so that I know my work has been delivered successfully.

#### Acceptance Criteria

1. WHEN the editor successfully uploads an edited video via the upload modal in VideoSubmissionsManager, THE VideoSubmissionsManager SHALL display a success message reading "Sent to Food Partner" within the same modal or as an inline banner before the modal closes.
2. WHEN the upload completes successfully, THE VideoSubmissionsManager SHALL update the submission card's status badge to display "Under Review" (corresponding to `review` status) without requiring a full page reload.
3. WHEN the upload completes successfully, THE VideoSubmissionsManager SHALL close the upload modal after a 2-second delay to allow the editor to read the confirmation message.
4. IF the upload fails due to a network or server error, THEN THE VideoSubmissionsManager SHALL display a descriptive error message within the modal and SHALL NOT close the modal automatically.

---

### Requirement 2: Food Partner Edited Videos Section

**User Story:** As a food partner, I want a dedicated section in my dashboard that shows all videos currently under review or completed, so that I can track the status of my editing projects.

#### Acceptance Criteria

1. THE EditedVideos component SHALL fetch and display all Submissions belonging to the authenticated food partner that have a status of `review` or `completed` and contain an `editedVideo` field, by calling `GET /api/video-submissions/food-partner/edited-videos`.
2. WHEN the EditedVideos component mounts, THE EditedVideos component SHALL show a loading indicator while the fetch is in progress.
3. IF the fetch returns an empty list, THEN THE EditedVideos component SHALL display an empty-state message: "No edited videos yet. They will appear here once your editor completes a project."
4. IF the fetch fails, THEN THE EditedVideos component SHALL display an error message and a "Retry" button that re-triggers the fetch.
5. THE EditedVideos component SHALL display each Submission as a card showing: project title, editor name, upload date of the edited video, file size, and current status badge.
6. THE EditedVideos component SHALL allow the food partner to filter the list by status using tabs: "All", "Under Review", and "Completed".

---

### Requirement 3: Download Edited Video

**User Story:** As a food partner, I want to download the edited video file, so that I can review it locally or publish it.

#### Acceptance Criteria

1. WHEN a food partner clicks the "Download" button on a video card, THE EditedVideos component SHALL call `GET /api/video-submissions/food-partner/:submissionId/download` and trigger a browser file download.
2. WHILE a download is in progress, THE EditedVideos component SHALL disable the "Download" button for that card and display a loading spinner in place of the download icon.
3. IF the download request fails, THEN THE EditedVideos component SHALL re-enable the "Download" button and display an inline error message on the card.

---

### Requirement 4: Approve or Request Revision

**User Story:** As a food partner, I want to approve an edited video or request a revision, so that I can either accept the work or ask the editor to make changes.

#### Acceptance Criteria

1. WHEN a Submission has status `review`, THE EditedVideos component SHALL display an "Approve" button and a "Request Revision" button on the corresponding card.
2. WHEN the food partner clicks "Approve", THE EditedVideos component SHALL call `PATCH /api/video-submissions/food-partner/:submissionId/status` with `{ status: "completed" }` and update the card's status badge to "Completed" on success.
3. WHEN the food partner clicks "Request Revision", THE EditedVideos component SHALL display an inline text input for a revision note, and a "Send" button.
4. WHEN the food partner submits a revision note, THE EditedVideos component SHALL call `PATCH /api/video-submissions/food-partner/:submissionId/status` with `{ status: "revision_requested" }` and SHALL call `POST /api/video-submissions/food-partner/:submissionId/message` with the revision note text.
5. WHILE an approve or revision request is being submitted, THE EditedVideos component SHALL disable both action buttons for that card.
6. IF an approve or revision request fails, THEN THE EditedVideos component SHALL re-enable the action buttons and display an inline error message on the card.
7. WHEN a Submission has status `completed`, THE EditedVideos component SHALL NOT display the "Approve" or "Request Revision" buttons for that card.

---

### Requirement 5: Rate and Give Feedback

**User Story:** As a food partner, I want to rate the edited video and leave feedback after approving it, so that I can acknowledge the editor's work quality.

#### Acceptance Criteria

1. WHEN a Submission has status `completed` and has no existing `rating` field, THE EditedVideos component SHALL display a 1–5 star rating input and an optional feedback text area on the card.
2. WHEN the food partner selects a star rating and clicks "Submit Rating", THE EditedVideos component SHALL call `POST /api/video-submissions/food-partner/:submissionId/rate` with `{ rating, feedback }`.
3. WHEN the rating is submitted successfully, THE EditedVideos component SHALL replace the rating input with a read-only star display showing the submitted rating value.
4. IF the food partner attempts to submit a rating without selecting a star value, THEN THE EditedVideos component SHALL display a validation message: "Please select a star rating before submitting."
5. IF the rating submission fails, THEN THE EditedVideos component SHALL display an inline error message and keep the rating form visible.
6. WHEN a Submission already has a `rating` field, THE EditedVideos component SHALL display the rating as read-only stars and SHALL NOT show the rating form.

---

### Requirement 6: Real-Time Notification for New Edited Video

**User Story:** As a food partner, I want to receive a real-time notification when an editor uploads an edited video, so that I can review it promptly without refreshing the page.

#### Acceptance Criteria

1. WHEN the WebSocket_Service emits a `video_edit_completed` event for a Submission belonging to the authenticated food partner, THE FoodPartnerDashboard SHALL display a toast or banner notification with the message: "Your edited video for '[project title]' is ready for review."
2. WHEN the `video_edit_completed` event is received and the food partner is currently viewing the "Edited Videos" tab, THE EditedVideos component SHALL automatically refresh its list to include the newly delivered Submission.
3. WHEN the `video_edit_completed` event is received and the food partner is NOT currently viewing the "Edited Videos" tab, THE FoodPartnerDashboard SHALL show a badge count on the "Edited Videos" navigation item indicating the number of unread review-ready videos.
4. THE FoodPartnerDashboard SHALL register the `video_edit_completed` WebSocket listener on mount and SHALL deregister it on unmount.
