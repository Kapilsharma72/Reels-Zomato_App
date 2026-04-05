# Implementation Plan

- [x] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Missing CSS Classes, Missing Upload Flow, Unconditional Status Log
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: These tests encode the expected behavior — they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate each bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing cases for reproducibility
  - C1 — CSS: Render `ProfileView`, `SettingsView`, `PortfolioView`, `EarningsView` modal, `ActiveProjects`, `CompletedProjects` and assert each missing class (`.profile-fields`, `.field-group`, `.skills-container`, `.add-skill-btn`, `.remove-skill`, `.account-info`, `.info-item`, `.info-label`, `.info-value`, `.settings-view`, `.settings-section`, `.setting-item`, `.setting-info`, `.number-input`, `.time-selector`, `.account-actions`, `.item-content`, `.item-description`, `.item-stats`, `.play-btn`, `.item-duration`, `.tag`, `.withdrawal-info`, `.form-group`, `.project-card.detailed`, `.project-header`, `.project-description`, `.project-details`, `.requirements`, `.project-actions`, `.action-btn.edit`, `.action-btn.upload`, `.action-btn.complete`, `.completed-grid`, `.completed-card.detailed`, `.completed-overlay`) has a corresponding CSS rule in `EditorDashboard.css` — expect FAILURE (no rules defined)
  - C2 — Upload: Render `VideoSubmissionsManager` with an `in_progress` submission, assert a `<input type="file">` is present in the card DOM — expect FAILURE (no file input rendered); also spy on `videoSubmissionService.uploadEditedVideo` and click "Submit for Review", assert it was called — expect FAILURE (only `updateSubmissionStatus` is called)
  - C3 — Filter: Spy on `videoSubmissionService.getEditorSubmissions`, set `filter = 'all'`, trigger fetch, assert the call was made without a `status` key in params — this passes on unfixed code (params is `{}`), but verify backend `getEditorSubmissions` logs `Status filter: undefined` unconditionally (check `console.log('Status filter:', status)` runs even when `status` is `undefined`)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: C1 and C2 tests FAIL (proves bugs exist); C3 backend log test confirms unconditional logging
  - Document counterexamples found (e.g., "`.profile-fields` has no CSS rule", "`uploadEditedVideo` never called", "`<input type='file'>` absent")
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing CSS Rules, Non-in_progress Actions, Specific Filter Params
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: existing CSS classes (`.stats-grid`, `.stat-card`, `.project-card`, `.progress-bar`, `.modal-overlay`, `.toggle-switch`, `.profile-view`, `.profile-header`, `.earnings-view`, `.portfolio-view`, `.editor-settings-view`) are defined and apply styles on unfixed code
  - Observe: clicking "Start Editing" on an `assigned` submission calls `updateSubmissionStatus` with `'in_progress'` and `10` on unfixed code
  - Observe: clicking "Assign to Me" on a `submitted` submission calls `assignSubmission` on unfixed code
  - Observe: `filter = 'in_progress'` passes `{ status: 'in_progress' }` to `getEditorSubmissions` on unfixed code
  - Observe: `userType = 'food-partner'` calls `getFoodPartnerSubmissions` on unfixed code
  - Write property-based test: for all filter values in `['assigned', 'in_progress', 'review', 'completed']`, `getEditorSubmissions` is called with `{ status: filter }` (from Preservation Requirements 3.6 in design)
  - Write property-based test: for all submission actions other than `submit_for_review` on `in_progress`, the original handler is called unchanged (from Preservation Requirements 3.2, 3.3 in design)
  - Verify all preservation tests PASS on UNFIXED code
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix all three editor dashboard bugs

  - [x] 3.1 Add missing CSS class rules to EditorDashboard.css
    - Add `.profile-fields` (grid, 2 cols, gap), `.field-group` (flex col), `.skills-container` (flex wrap), `.add-skill-btn`, `.remove-skill`, `.account-info`, `.info-item`, `.info-label`, `.info-value`
    - Add `.settings-view` (flex col, gap), `.settings-section` (card container), `.setting-item` (flex row, space-between, border-bottom), `.setting-info h4` / `.setting-info p`, `.number-input`, `.time-selector`, `.account-actions`
    - Add `.item-content` (padding), `.item-description` (muted, line-clamp), `.item-stats` (flex row, gap), `.play-btn` (circular overlay), `.item-duration` (badge overlay), `.tag` (pill badge alias for `.item-tag`)
    - Add `.withdrawal-info` (info block), `.form-group` (flex col, label+input layout)
    - Add `.project-card.detailed`, `.project-header` (flex row, space-between), `.project-description`, `.project-details` (flex col), `.requirements`, `.project-actions` (flex row, gap, flex-wrap)
    - Add `.action-btn.edit`, `.action-btn.upload`, `.action-btn.complete` (colored action button variants)
    - Add `.completed-grid` (grid layout), `.completed-card.detailed`, `.completed-overlay` (thumbnail overlay)
    - _Bug_Condition: isBugCondition_C1(className) — className IN MISSING_CLASSES AND classDefinedInCSS = false_
    - _Expected_Behavior: classDefinedInCSS(className, 'EditorDashboard.css') = true for all previously missing classes_
    - _Preservation: All existing CSS rules in EditorDashboard.css remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1_

  - [x] 3.2 Add file input and upload flow to VideoSubmissionsManager
    - Add `uploadFile` and `showUploadModal` state variables (per-submission upload state)
    - Add `handleSubmitForReview(submissionId)` function: opens file picker, builds `FormData` with `editedVideo` field, calls `videoSubmissionService.uploadEditedVideo(submissionId, formData)`, refreshes submissions on success
    - Replace the `in_progress` "Submit for Review" button's `onClick` from `handleStatusUpdate(submission._id, 'review', 100)` to `handleSubmitForReview(submission._id)`
    - Add inline `<input type="file">` that appears on the card for `in_progress` submissions (accept video types), or a small modal prompting file selection before confirming
    - _Bug_Condition: isBugCondition_C2 — submission.status = 'in_progress' AND action = 'submit_for_review' AND uploadEditedVideo_called = false_
    - _Expected_Behavior: uploadEditedVideo(submissionId, formData) called with formData.has('editedVideo') = true_
    - _Preservation: "Start Editing" on assigned, "Assign to Me" on available, food-partner flow all unchanged_
    - _Requirements: 2.7, 2.8, 3.2, 3.3, 3.4_

  - [x] 3.3 Make status filter log conditional in backend controller
    - In `Backend/src/controllers/videoSubmission.controller.js`, change `console.log('Status filter:', status)` to `if (status) console.log('Status filter:', status)` so it only logs when a status filter is actually provided
    - _Bug_Condition: isBugCondition_C3 — filter = 'all' AND params_sent = {} AND status_query_param_present = false_
    - _Expected_Behavior: backend does not log 'Status filter: undefined' when no status param is sent_
    - _Preservation: filter = 'in_progress' / 'assigned' / 'review' / 'completed' still logs correctly; frontend params logic unchanged_
    - _Requirements: 2.9, 2.10, 3.6_

  - [x] 3.4 Verify bug condition exploration tests now pass
    - **Property 1: Expected Behavior** - CSS Classes Defined, Upload Flow Present, Log Conditional
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, it confirms the expected behavior is satisfied
    - Run all bug condition exploration tests from step 1
    - **EXPECTED OUTCOME**: All tests PASS (confirms all three bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing CSS, Non-buggy Actions, Specific Filter Params
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass; ask the user if questions arise.
