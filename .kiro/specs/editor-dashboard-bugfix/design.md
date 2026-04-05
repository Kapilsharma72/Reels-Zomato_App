# Editor Dashboard Bugfix Design

## Overview

Three bugs affect the Editor Dashboard. First, `EditorDashboard.css` is missing CSS class definitions for several components (`ProfileView`, `SettingsView`, `PortfolioView`, `EarningsView` modal, `ActiveProjects`, `CompletedProjects`), causing unstyled layouts. Second, `VideoSubmissionsManager`'s "Submit for Review" button for `in_progress` submissions only changes status — it never prompts for or uploads an edited video file, even though the backend endpoint and service method already exist. Third, when `filter === 'all'`, an empty `{}` is passed as params, so no `status` query param is sent and the backend logs `Status filter: undefined`.

The fix strategy is: (1) add the missing CSS rules to `EditorDashboard.css`, (2) add a file input and call `uploadEditedVideo` in `VideoSubmissionsManager`, and (3) fix the filter params logic to omit `status` entirely when `filter === 'all'`.

## Glossary

- **Bug_Condition (C)**: The set of inputs/states that trigger one of the three bugs
- **Property (P)**: The desired correct behavior when the bug condition holds
- **Preservation**: Existing behavior that must remain unchanged after the fix
- **VideoSubmissionsManager**: `Frontend/src/components/VideoSubmissionsManager.jsx` — renders submission cards and handles editor actions
- **EditorDashboard.css**: `Frontend/src/styles/EditorDashboard.css` — stylesheet for all EditorDashboard sub-components
- **uploadEditedVideo**: Service method in `videoSubmissionService.js` that POSTs to `/api/video-submissions/editor/:submissionId/upload-edited` with a `FormData` containing `editedVideo`
- **filter**: State variable in `VideoSubmissionsManager` controlling which status tab is active; `'all'` means no status filter

## Bug Details

### Bug Condition

Three independent bug conditions exist:

**Bug C1 — Missing CSS Classes**

The bug manifests when any of the following components render: `ProfileView`, `SettingsView`, `PortfolioView`, `EarningsView` (withdrawal modal), `ActiveProjects`, or `CompletedProjects`. These components use class names that have no corresponding rules in `EditorDashboard.css`.

```
FUNCTION isBugCondition_C1(className)
  INPUT: className of type string (CSS class applied in JSX)
  OUTPUT: boolean

  MISSING_CLASSES = [
    'profile-fields', 'field-group', 'skills-container', 'add-skill-btn',
    'remove-skill', 'account-info', 'info-item', 'info-label', 'info-value',
    'settings-view', 'settings-section', 'setting-item', 'setting-info',
    'number-input', 'time-selector', 'account-actions',
    'item-content', 'item-description', 'item-stats', 'play-btn',
    'item-duration', 'tag',
    'withdrawal-info', 'form-group',
    'project-card.detailed', 'project-header', 'project-description',
    'project-details', 'requirements', 'project-actions',
    'action-btn.edit', 'action-btn.upload', 'action-btn.complete',
    'completed-grid', 'completed-card.detailed', 'completed-overlay'
  ]

  RETURN className IN MISSING_CLASSES
         AND classDefinedInCSS(className, 'EditorDashboard.css') = false
END FUNCTION
```

**Bug C2 — Missing Video Upload Flow**

```
FUNCTION isBugCondition_C2(submission, action)
  INPUT: submission (VideoSubmission object), action (user action string)
  OUTPUT: boolean

  RETURN submission.status = 'in_progress'
         AND action = 'submit_for_review'
         AND uploadEditedVideo_called = false
END FUNCTION
```

**Bug C3 — Filter Sends Empty Params**

```
FUNCTION isBugCondition_C3(filter)
  INPUT: filter of type string (active filter tab value)
  OUTPUT: boolean

  RETURN filter = 'all'
         AND params_sent_to_api = {}
         AND status_query_param_present = false
END FUNCTION
```

### Examples

**C1 Examples:**
- `ProfileView` renders `.profile-fields` → no grid layout applied, fields stack without spacing
- `SettingsView` renders `.setting-item` → toggle rows have no flex layout, controls misalign
- `PortfolioView` renders `.item-content` → portfolio card body has no padding or structure
- `EarningsView` modal renders `.form-group` → withdrawal form inputs have no label/input layout
- `ActiveProjects` renders `.project-card.detailed` → detailed project cards unstyled
- `CompletedProjects` renders `.completed-grid` → completed projects have no grid layout

**C2 Examples:**
- Editor has submission `{ _id: 'abc', status: 'in_progress' }`, clicks "Submit for Review" → status changes to `review` but no file is uploaded; food partner sees no edited video
- Editor tries to deliver work → backend `editedVideo` field remains `null`; food partner cannot download

**C3 Examples:**
- `filter = 'all'` → `getEditorSubmissions({})` called → backend receives no `status` param → logs `Status filter: undefined` → returns all submissions (accidentally correct but logs error)
- `filter = 'in_progress'` → `getEditorSubmissions({ status: 'in_progress' })` → works correctly (not a bug)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All CSS classes already defined in `EditorDashboard.css` (`.stats-grid`, `.stat-card`, `.project-card`, `.progress-bar`, `.modal-overlay`, `.toggle-switch`, `.profile-view`, `.profile-header`, `.earnings-view`, `.portfolio-view`, `.editor-settings-view`, etc.) must continue to apply their styles without regression
- The "Start Editing" button for `assigned` submissions must continue to call `handleStatusUpdate` with `status: 'in_progress'` and `progress: 10`
- The "Assign to Me" button for `available` submissions must continue to call `handleAssignSubmission` correctly
- Food partner submission fetching (`userType === 'food-partner'`) must continue to call `getFoodPartnerSubmissions` with correct params
- The `SubmissionDetailsModal` must continue to display details, instructions, and messages tabs correctly
- Filter tabs for specific statuses (`'assigned'`, `'in_progress'`, `'review'`, `'completed'`) must continue to pass `{ status: filter }` to the API

**Scope:**
All inputs that do NOT match the three bug conditions should be completely unaffected by this fix. This includes:
- Any CSS class already defined in `EditorDashboard.css`
- Any submission action other than "Submit for Review" on an `in_progress` submission
- Any filter value other than `'all'`

## Hypothesized Root Cause

**C1 — Missing CSS Classes:**
1. **Incremental JSX development without CSS sync**: The JSX components were written or extended with new class names, but the corresponding CSS rules were never added to `EditorDashboard.css`. The existing CSS covers the dashboard home and shared layout but not the detail views.

**C2 — Missing Video Upload Flow:**
1. **Incomplete implementation**: The "Submit for Review" button was wired to `handleStatusUpdate` (a status-only call) rather than a dedicated upload handler. The `uploadEditedVideo` service method exists but was never called from the UI.
2. **No file input in the card**: The submission card for `in_progress` items has no `<input type="file">`, so there is no way for the editor to select a file before clicking the button.

**C3 — Filter Sends Empty Params:**
1. **Missing conditional**: The params object is built as `filter === 'all' ? {} : { status: filter }`. Passing `{}` to `URLSearchParams` produces an empty query string, which is functionally equivalent to no filter on the backend — but the backend still logs `Status filter: undefined` because it reads `req.query.status` which is `undefined`. The fix is to not pass a `status` key at all when `filter === 'all'`, which is what the current code does — however the backend should handle `undefined` gracefully. The real issue is that the current behavior is technically correct for the `'all'` case but the backend logs a warning, and the filter state resets to `'all'` on tab switch, which can cause stale filter state.

## Correctness Properties

Property 1: Bug Condition C1 — Missing CSS Classes Are Defined

_For any_ CSS class name used in `EditorDashboard.jsx` components (`ProfileView`, `SettingsView`, `PortfolioView`, `EarningsView` modal, `ActiveProjects`, `CompletedProjects`) where `isBugCondition_C1` returns true, the fixed `EditorDashboard.css` SHALL contain a rule for that class name, causing the element to receive the intended layout and visual styles.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Bug Condition C2 — Submit for Review Uploads Edited Video

_For any_ `in_progress` submission where the editor initiates the "Submit for Review" flow (`isBugCondition_C2` returns true), the fixed `VideoSubmissionsManager` SHALL present a file input, and upon confirmation SHALL call `videoSubmissionService.uploadEditedVideo(submissionId, formData)` with the selected file as `editedVideo` in a `FormData` object, uploading it to `POST /api/video-submissions/editor/:submissionId/upload-edited`.

**Validates: Requirements 2.7, 2.8**

Property 3: Bug Condition C3 — 'all' Filter Omits Status Param

_For any_ invocation of `fetchSubmissions` where `filter === 'all'` (`isBugCondition_C3` returns true), the fixed `VideoSubmissionsManager` SHALL call the API without a `status` query parameter (passing no status key in params), so the backend receives no `status` filter and returns all submissions without logging `Status filter: undefined`.

**Validates: Requirements 2.9**

Property 4: Preservation — Non-Buggy Inputs Unchanged

_For any_ input where none of the three bug conditions hold (existing CSS classes, non-`in_progress` submission actions, non-`'all'` filter values), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

**File 1**: `Frontend/src/styles/EditorDashboard.css`

**Specific Changes**:

1. **ProfileView missing classes** — Add rules for:
   - `.profile-fields`: grid layout (2 columns, gap)
   - `.field-group`: flex column, label + input stacking
   - `.skills-container`: flex wrap, gap
   - `.add-skill-btn`: styled button matching design system
   - `.remove-skill`: small inline remove button
   - `.account-info`: flex column list
   - `.info-item`: flex row, space-between
   - `.info-label`: muted text style
   - `.info-value`: primary text style

2. **SettingsView missing classes** — Add rules for:
   - `.settings-view`: flex column, gap (note: JSX uses `.settings-view` but CSS has `.editor-settings-view` — JSX must be checked; the CSS already has `.editor-settings-view` so the JSX class name `.settings-view` is the mismatch)
   - `.settings-section`: card container matching `.settings-group` pattern
   - `.setting-item`: flex row, space-between, align-center, padding, border-bottom
   - `.setting-info h4`: label text
   - `.setting-info p`: description muted text
   - `.number-input input`: styled number input
   - `.time-selector`: flex row, gap, align-center
   - `.account-actions`: flex row, gap

3. **PortfolioView missing classes** — Add rules for:
   - `.item-content`: padding for portfolio card body
   - `.item-description`: muted text, line-clamp
   - `.item-stats`: flex row, gap, small text
   - `.play-btn`: circular play button overlay
   - `.item-duration`: small badge overlay
   - `.tag`: pill badge (note: `.item-tag` already exists; `.tag` is the missing alias)

4. **EarningsView modal missing classes** — Add rules for:
   - `.withdrawal-info`: info block with muted text
   - `.form-group`: flex column, label + input layout

5. **ActiveProjects missing classes** — Add rules for:
   - `.project-card.detailed`: extended card variant
   - `.project-header`: flex row, space-between
   - `.project-description`: body text
   - `.project-details`: flex column, gap
   - `.requirements`: requirements list block
   - `.project-actions`: flex row, gap, flex-wrap
   - `.action-btn.edit`, `.action-btn.upload`, `.action-btn.complete`: colored action button variants

6. **CompletedProjects missing classes** — Add rules for:
   - `.completed-grid`: grid layout for completed cards
   - `.completed-card.detailed`: extended completed card
   - `.completed-overlay`: overlay on completed thumbnail

---

**File 2**: `Frontend/src/components/VideoSubmissionsManager.jsx`

**Function**: `VideoSubmissionsManager` component + `handleStatusUpdate` / new `handleSubmitForReview`

**Specific Changes**:

1. **Add upload state**: Add `useState` for `uploadFile` (the selected file) and `showUploadModal` (boolean to show file picker UI per submission)

2. **Add `handleSubmitForReview` function**: New handler that:
   - Opens a file picker (or inline file input) for the specific submission
   - On file selection + confirm, builds a `FormData` with `editedVideo` field
   - Calls `videoSubmissionService.uploadEditedVideo(submissionId, formData)`
   - On success, refreshes submissions and shows success message

3. **Replace button handler**: Change the `in_progress` "Submit for Review" button's `onClick` from `handleStatusUpdate(submission._id, 'review', 100)` to `handleSubmitForReview(submission._id)`

4. **Add inline file input UI**: Either an inline `<input type="file">` that appears on the card for `in_progress` submissions, or a small modal/popover that prompts for file selection before confirming submission

---

**File 3**: `Frontend/src/components/VideoSubmissionsManager.jsx`

**Function**: `fetchSubmissions`

**Specific Changes**:

1. **Fix filter params for `'all'`**: The current code already passes `{}` for `'all'`, which sends no `status` param. The backend issue is that it reads `req.query.status` and logs `undefined`. The frontend fix is to ensure the behavior is intentional and documented. However, since the backend logs a warning, the cleaner fix is to verify the params object never sends `status: undefined`. The current `filter === 'all' ? {} : { status: filter }` is correct — no change needed on the frontend params logic itself. The real fix is confirming the backend `getEditorSubmissions` handles missing `status` gracefully without logging a warning. If a frontend-only fix is preferred, passing `{}` is already correct behavior.

   **Actual fix**: The `console.log('Status filter:', status)` in the backend controller runs unconditionally. The fix is either: (a) make the backend log conditional (`if (status) console.log(...)`), or (b) confirm the frontend behavior is correct as-is. Since the requirements say the frontend should "send the request without a status query parameter", the frontend is already correct — the backend log is the noise. We will fix the backend log to be conditional.

## Testing Strategy

### Validation Approach

Two-phase approach: first surface counterexamples on unfixed code, then verify the fix and preservation.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples demonstrating each bug BEFORE implementing the fix.

**Test Plan**: Write tests that render the affected components and assert the expected behavior. Run on UNFIXED code to observe failures.

**Test Cases**:

1. **C1 — CSS Class Presence Test**: Render `ProfileView` and assert `.profile-fields` has non-zero computed width/layout styles → will fail on unfixed code (no CSS rule)
2. **C2 — Upload Called Test**: Render `VideoSubmissionsManager` with an `in_progress` submission, click "Submit for Review", assert `videoSubmissionService.uploadEditedVideo` was called → will fail on unfixed code (only `updateSubmissionStatus` is called)
3. **C2 — File Input Present Test**: Render card for `in_progress` submission, assert a `<input type="file">` is present in the DOM → will fail on unfixed code (no file input)
4. **C3 — Filter Params Test**: Spy on `getEditorSubmissions`, set `filter = 'all'`, trigger fetch, assert the call was made without a `status` key in params → passes on unfixed code (params is `{}`, no status key), but backend still logs warning

**Expected Counterexamples**:
- `uploadEditedVideo` is never called when "Submit for Review" is clicked
- No `<input type="file">` exists in the submission card for `in_progress` items
- Possible causes: button wired to wrong handler, no file input rendered

### Fix Checking

**Goal**: Verify that for all inputs where each bug condition holds, the fixed code produces the expected behavior.

**Pseudocode:**
```
FOR ALL className WHERE isBugCondition_C1(className) DO
  ASSERT classDefinedInCSS(className, 'EditorDashboard.css') = true
END FOR

FOR ALL submission WHERE isBugCondition_C2(submission, 'submit_for_review') DO
  result := triggerSubmitForReview(submission)
  ASSERT uploadEditedVideo_called = true
  ASSERT formData.has('editedVideo') = true
END FOR

FOR ALL filter WHERE isBugCondition_C3(filter) DO
  result := fetchSubmissions(filter)
  ASSERT status_query_param_in_request = undefined
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed code produces the same result as the original.

**Pseudocode:**
```
FOR ALL className WHERE NOT isBugCondition_C1(className) DO
  ASSERT cssRule(className) unchanged
END FOR

FOR ALL submission WHERE NOT isBugCondition_C2(submission, action) DO
  ASSERT original_handler(submission, action) = fixed_handler(submission, action)
END FOR

FOR ALL filter WHERE NOT isBugCondition_C3(filter) DO
  ASSERT params_sent_original(filter) = params_sent_fixed(filter)
END FOR
```

**Testing Approach**: Property-based testing is recommended for the filter and upload flow preservation because:
- It generates many filter values and submission states automatically
- It catches edge cases (e.g. `filter = 'submitted'`, `filter = 'completed'`) that manual tests might miss
- It provides strong guarantees that non-buggy paths are unchanged

**Test Cases**:
1. **Start Editing Preservation**: Click "Start Editing" on `assigned` submission → assert `updateSubmissionStatus` called with `'in_progress'`, `10`
2. **Assign to Me Preservation**: Click "Assign to Me" on `submitted` submission → assert `assignSubmission` called
3. **Specific Filter Preservation**: Set `filter = 'in_progress'` → assert `getEditorSubmissions({ status: 'in_progress' })` called
4. **Food Partner Flow Preservation**: Render with `userType = 'food-partner'` → assert `getFoodPartnerSubmissions` called

### Unit Tests

- Test that each missing CSS class is now defined in `EditorDashboard.css`
- Test that clicking "Submit for Review" on an `in_progress` submission calls `uploadEditedVideo` with correct `FormData`
- Test that a file input is rendered for `in_progress` submission cards
- Test that `filter = 'all'` results in no `status` param in the API call
- Test edge cases: no file selected before submit, upload error handling

### Property-Based Tests

- Generate random filter values from `['all', 'assigned', 'in_progress', 'review', 'completed']` and verify correct params are passed for each
- Generate random submission states and verify only `in_progress` submissions trigger the upload flow
- Generate random sets of CSS class names and verify all classes used in JSX have corresponding CSS rules

### Integration Tests

- Full flow: editor views `in_progress` submission → selects file → clicks "Submit for Review" → file uploads → status changes to `review` → food partner can download
- Filter flow: switch between all filter tabs and verify correct submissions are shown for each
- CSS regression: render each dashboard view and verify no unstyled elements
