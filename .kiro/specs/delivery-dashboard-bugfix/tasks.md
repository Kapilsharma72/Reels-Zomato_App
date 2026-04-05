# Delivery Dashboard Bugfix Tasks

## Task List

- [x] 1. Fix Bug 1 — Logout modal calls wrong method
  - [x] 1.1 In `DeliveryDashboard.jsx`, change the modal confirm button's `onClick` from `() => authService.logout()` to `handleLogout`
  - [x] 1.2 Verify `handleLogout` is defined in scope and calls `authService.logoutUser()`, clears localStorage, and navigates to `/login`

- [x] 2. Fix Bug 2 — Duplicate new_order WebSocket listener
  - [x] 2.1 Locate the second `useEffect` block (or duplicate `socket.on('new_order', ...)` call) in `DeliveryDashboard.jsx`
  - [x] 2.2 Remove the duplicate `socket.on('new_order', handleNewOrder)` registration so only the first `useEffect` registers it
  - [x] 2.3 Confirm the first `useEffect` still registers `order_assigned`, `order_update`, and `order_ready` exactly once with proper cleanup

- [x] 3. Fix Bug 3 — EarningsView crashes on "This Week" (breakdown undefined)
  - [x] 3.1 Add a `breakdown` property to `currentData` in `EarningsView` with a default array of 7 day objects (`{ day, earnings, deliveries }`) using `stats.breakdown || [...]`

- [x] 4. Fix Bug 4 — Malformed JSX closing structure in EarningsView
  - [x] 4.1 Move `{showWithdrawalModal && (...)}` inside the `return (...)` block before the root closing `</div>`
  - [x] 4.2 Remove the stray `};` that appears after the return statement closes
  - [x] 4.3 Verify `EarningsView` renders without parse or runtime errors

- [x] 5. Fix Bug 5 — Missing CSS classes in DeliveryDashboard.css
  - [x] 5.1 Add layout classes: `.dashboard-home`, `.stats-grid`, `.content-section`, `.section-header`, `.view-all-btn`
  - [x] 5.2 Add order card classes: `.order-card`, `.order-header`, `.order-info`, `.order-status`, `.order-details`, `.order-location`, `.order-time`, `.order-total`, `.order-items`, `.order-item`, `.order-location-info`, `.location-item`, `.location-details`, `.location-label`, `.location-address`, `.order-meta`, `.meta-item`, `.special-instructions`, `.order-actions`, `.action-btn`, `.order-filters`, `.filter-btn`
  - [x] 5.3 Add list classes: `.orders-list`, `.deliveries-list`, `.delivery-card`, `.delivery-header`, `.delivery-info`, `.delivery-rating`, `.delivery-details`, `.delivery-time`, `.delivery-tip`
  - [x] 5.4 Add earnings classes: `.earnings-view`, `.earnings-summary`, `.summary-header`, `.period-selector`, `.period-btn`, `.earnings-cards`, `.card-icon`, `.card-content`, `.card-amount`, `.card-label`, `.daily-breakdown`, `.breakdown-chart`, `.day-bar`, `.bar-container`, `.earnings-bar`, `.day-info`, `.day-name`, `.day-amount`, `.day-deliveries`, `.payment-history`, `.payment-list`, `.payment-item`, `.payment-info`, `.payment-date`, `.payment-method`, `.payment-amount`, `.payment-status`, `.withdraw-btn`, `.withdrawal-info`
  - [x] 5.5 Add profile classes: `.profile-view`, `.profile-header`, `.profile-avatar-large`, `.avatar-circle`, `.avatar-status`, `.profile-info`, `.profile-stats`, `.edit-btn`, `.profile-sections`, `.profile-section`, `.profile-fields`, `.field-group`, `.account-info`, `.info-item`, `.info-label`, `.info-value`
  - [x] 5.6 Add settings classes: `.settings-view`, `.settings-section`, `.settings-group`, `.setting-item`, `.setting-info`, `.distance-selector`, `.distance-value`, `.time-selector`, `.account-actions`
  - [x] 5.7 Add utility/section classes: `.loading-state`, `.loading-spinner`, `.modal-content`, `.modal-footer`, `.close-btn`, `.star-filled`, `.star-empty`, `.orders-header`, `.history-header`, `.history-filters`, `.active-orders`, `.available-orders`, `.delivery-history`

- [x] 6. Fix Bug 6 — Hamburger button missing flex centering in mobile media query
  - [x] 6.1 In `DeliveryDashboard.css`, add `align-items: center` and `justify-content: center` to `.hamburger-btn` inside the `@media (max-width: 1024px)` block

- [x] 7. Run bug condition tests to verify all fixes
  - [x] 7.1 Run `DeliveryDashboard.bugcondition.test.jsx` — all tests should now pass (they were expected to fail on unfixed code)

- [x] 8. Run preservation tests to verify no regressions
  - [x] 8.1 Run `DeliveryDashboard.preservation.test.jsx` — all tests should continue to pass
