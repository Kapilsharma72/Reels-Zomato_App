# Implementation Plan: Video Delivery — Food Partner

## Overview

Implement the end-to-end video editing delivery loop: editor upload confirmation, food partner review UI (filter tabs, approve/revision actions, rating fix), real-time WebSocket notification with badge and toast, and the backend `projectTitle` payload fix.

## Tasks

- [x] 1. Fix backend: include `projectTitle` in `notifyVideoEditCompleted` payload
  - In `Backend/src/controllers/videoSubmission.controller.js`, pass `submission.projectTitle` as part of the `editedVideoData` argument to `websocketService.notifyVideoEditCompleted`
  - Verify `websocket.service.js` forwards the field in the emitted `video_edit_completed` event payload
  - _Requirements: 6.1_

- [x] 2. Add upload confirmation state to `VideoSubmissionsManager`
  - [x] 2.1 Add `uploadSuccess` state and update `handleUploadEditedVideo`
    - Add `const [uploadSuccess, setUploadSuccess] = useState(false)` and a `closeTimerRef = useRef(null)`
    - On success: set `uploadSuccess = true`, start a `setTimeout` (2 s) that sets `uploadModalSubmission = null` and resets `uploadSuccess`; store ref so manual close can cancel it
    - On error: set error message only — do NOT set `uploadSuccess`, do NOT start timer
    - On manual close: clear the timer ref before closing
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 2.2 Render "Sent to Food Partner" confirmation banner in upload modal
    - When `uploadSuccess` is true, show a success banner ("✓ Sent to Food Partner") inside the modal
    - Hide the file picker and upload button while `uploadSuccess` is true
    - _Requirements: 1.1, 1.2_

  - [x] 2.3 Write property test for upload confirmation (Property 1)
    - **Property 1: Upload confirmation shown before modal closes**
    - **Validates: Requirements 1.1, 1.3**
    - Mock `videoSubmissionService.uploadEditedVideo` to resolve; assert confirmation banner is visible and modal is still open immediately after success

  - [x] 2.4 Write property test for upload modal stays open on error (Property 2)
    - **Property 2: Upload modal stays open on error**
    - **Validates: Requirements 1.4**
    - Mock service to reject; assert modal remains open and no auto-close timer fires

- [x] 3. Add filter tabs to `EditedVideos`
  - [x] 3.1 Add `activeFilter` state and filter logic
    - Add `const [activeFilter, setActiveFilter] = useState('all')`
    - Derive `filteredVideos` from `editedVideos` based on `activeFilter` (`'all'` | `'review'` | `'completed'`)
    - _Requirements: 2.6_

  - [x] 3.2 Render filter tab buttons ("All", "Under Review", "Completed")
    - Add tab bar above the videos grid; clicking a tab sets `activeFilter` and renders only matching cards
    - Add CSS for active/inactive tab states in `EditedVideos.css`
    - _Requirements: 2.6_

  - [x] 3.3 Write property test for filter tabs (Property 4)
    - **Property 4: Filter tabs correctly partition the list**
    - **Validates: Requirements 2.6**
    - Use fast-check to generate random arrays of submissions with statuses from `['review', 'completed']`; for each filter value assert the rendered list matches exactly

- [x] 4. Add approve and revision actions to `EditedVideos`
  - [x] 4.1 Add action state and `handleApprove` function
    - Add `actionLoading: {}`, `actionError: {}`, `revisionMode: {}`, `revisionNote: {}` state maps
    - Implement `handleApprove(submissionId)`: set loading, call `updateSubmissionStatus(id, 'completed', undefined, 'food-partner')`, update local entry on success, set error on failure, clear loading in finally
    - _Requirements: 4.1, 4.2, 4.5, 4.6_

  - [x] 4.2 Add `handleRevisionSubmit` function
    - Implement `handleRevisionSubmit(submissionId)`: set loading, call `updateSubmissionStatus` with `revision_requested` then `addMessage` with the revision note, update local entry and clear `revisionMode` on success, set error on failure
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [x] 4.3 Render approve/revision buttons and revision note input on cards
    - Show "Approve" and "Request Revision" buttons only when `video.status === 'review'`
    - When revision mode is active for a card, show inline text input + "Send" button
    - Disable both action buttons while `actionLoading[id]` is true
    - Show `actionError[id]` as inline error on the card when set
    - Add CSS for action buttons, revision input, and error state in `EditedVideos.css`
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7_

  - [x] 4.4 Write property test for approve/revision button visibility (Property 6)
    - **Property 6: Approve/Revision buttons shown iff status is review**
    - **Validates: Requirements 4.1, 4.7**

  - [x] 4.5 Write property test for revision triggers both API calls (Property 7)
    - **Property 7: Revision submission triggers both API calls**
    - **Validates: Requirements 4.4**
    - Generate random submission IDs and revision note strings; mock both service methods; assert both called with correct args

  - [x] 4.6 Write property test for action buttons disabled during in-flight (Property 8)
    - **Property 8: Action buttons disabled during in-flight requests**
    - **Validates: Requirements 4.5**

- [x] 5. Fix rating form visibility in `EditedVideos`
  - [x] 5.1 Move rating form to show only for `completed` and unrated submissions
    - Change the condition guarding the rating section from `status === 'review' && !video.rating` to `status === 'completed' && !video.rating`
    - Ensure read-only star display is shown when `video.rating` exists (already present, just verify condition)
    - Add rating submission error state: on failure keep form visible and show inline error; on success replace form with read-only display
    - _Requirements: 5.1, 5.3, 5.5, 5.6_

  - [x] 5.2 Write property test for rating form visibility (Property 9)
    - **Property 9: Rating form shown iff completed and unrated**
    - **Validates: Requirements 5.1, 5.6**
    - Use fast-check to generate submissions with all combinations of `status` and `rating` presence; assert form visibility matches `status === 'completed' && !rating`

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Wire WebSocket `video_edit_completed` in `FoodPartnerDashboard`
  - [x] 7.1 Add badge, refresh trigger, and toast state
    - Add `const [editedVideosBadge, setEditedVideosBadge] = useState(0)`
    - Add `const [editedVideosRefreshTrigger, setEditedVideosRefreshTrigger] = useState(0)`
    - Add `const [toastNotification, setToastNotification] = useState(null)`
    - _Requirements: 6.1, 6.3_

  - [x] 7.2 Register `video_edit_completed` WebSocket listener
    - Add a `useEffect` that calls `socket.on('video_edit_completed', handler)` and returns a cleanup calling `socket.off`
    - Handler: if `activeTab === 'edited-videos'` increment `editedVideosRefreshTrigger`; else increment `editedVideosBadge`; always set `toastNotification`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.3 Reset badge and render badge on nav item
    - When the user clicks the "Edited Videos" nav item, set `editedVideosBadge(0)` before or during the tab switch
    - Render a badge element on the "Edited Videos" nav item when `editedVideosBadge > 0`
    - Add badge CSS in `FoodPartnerDashboard.css`
    - _Requirements: 6.3_

  - [x] 7.4 Render toast notification and auto-dismiss
    - Render the toast when `toastNotification` is non-null, showing `toastNotification.message`
    - Add a `useEffect` watching `toastNotification?.id` that sets a 4-second timeout to clear it
    - Add toast CSS in `FoodPartnerDashboard.css`
    - _Requirements: 6.1_

  - [x] 7.5 Pass `refreshTrigger` prop to `EditedVideos` and handle it
    - In `FoodPartnerDashboard`, pass `refreshTrigger={editedVideosRefreshTrigger}` to `<EditedVideos />`
    - In `EditedVideos`, accept the `refreshTrigger` prop and add a `useEffect([refreshTrigger])` that calls `fetchEditedVideos()` when the value changes (skip on initial mount if trigger is 0)
    - _Requirements: 6.2_

  - [x] 7.6 Write property test for badge increment (Property 12)
    - **Property 12: Badge increments when not on edited-videos tab**
    - **Validates: Requirements 6.3**
    - Generate a random N; fire N `video_edit_completed` events while active tab is not `edited-videos`; assert badge equals N

  - [x] 7.7 Write property test for WebSocket listener lifecycle (Property 13)
    - **Property 13: WebSocket listener registered on mount and cleaned up on unmount**
    - **Validates: Requirements 6.4**
    - Mock `socket.on` / `socket.off`; mount and unmount component; assert each called exactly once with `'video_edit_completed'` and the same handler reference

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use **fast-check** with Vitest (already in the project)
- Tag format for property tests: `// Feature: video-delivery-foodpartner, Property N: <property text>`
- All inline errors are scoped per-card via the `actionError` map keyed by `submissionId`
- The badge count is ephemeral in-memory state — it resets to 0 on tab switch and is not persisted
