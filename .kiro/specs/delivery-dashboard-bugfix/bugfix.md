# Bugfix Requirements Document

## Introduction

The Delivery Dashboard (`Frontend/src/pages/DeliveryDashboard.jsx`) has multiple broken functionalities and missing CSS that cause crashes, incorrect behavior, and an unstyled/broken UI. The bugs fall into two categories: (1) functional defects — a wrong method call in the logout modal, duplicate WebSocket listener registration, a runtime crash in the Earnings view due to accessing an undefined property, and malformed JSX in the Earnings component — and (2) CSS defects — the component's stylesheet (`DeliveryDashboard.css`) is missing the vast majority of CSS classes that the JSX relies on, leaving all dashboard sections (home, active orders, available orders, delivery history, earnings, profile, settings) completely unstyled, and the hamburger/mobile layout broken.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user clicks the "Logout" button inside the logout confirmation modal THEN the system throws `TypeError: authService.logout is not a function` because the modal's `onClick` calls `authService.logout()` (which does not exist) instead of the `handleLogout` function, and navigation to `/login` never occurs

1.2 WHEN the Delivery Dashboard mounts with an active WebSocket socket THEN the system registers the `new_order` event listener twice (two separate `useEffect` blocks both call `socket.on('new_order', handleNewOrder)`), causing every incoming `new_order` event to fire two handlers and produce duplicate notifications and duplicate state updates

1.3 WHEN the user navigates to the Earnings tab and selects the "This Week" period THEN the system throws `TypeError: Cannot read properties of undefined (reading 'map')` because `currentData.breakdown` is accessed in the weekly chart render but `breakdown` is never defined on `currentData`

1.4 WHEN the Earnings view component is parsed THEN the system fails to render due to malformed JSX: the `return (` block's closing `)` and the component's closing `}` are placed after the `{showWithdrawalModal && ...}` block in a way that leaves the JSX structure invalid (extra `</div>` before `);` followed by a stray `};`)

1.5 WHEN any section of the Delivery Dashboard renders (home stats, order cards, active orders, available orders, delivery history, earnings, profile, settings) THEN the system renders unstyled elements because the CSS file (`DeliveryDashboard.css`) does not define the classes used by those sections (e.g. `.dashboard-home`, `.stats-grid`, `.content-section`, `.order-card`, `.order-status`, `.action-btn`, `.earnings-view`, `.earnings-cards`, `.earnings-card`, `.profile-view`, `.settings-view`, `.settings-section`, `.setting-item`, `.loading-state`, `.loading-spinner`, `.modal-content`, `.modal-footer`, `.close-btn`, and many others)

1.6 WHEN the viewport is narrower than 1024px THEN the system does not show the hamburger menu button because `.hamburger-btn` is set to `display: none` in the base styles and the responsive media query sets `display: flex` but the button lacks the `align-items: center` and `justify-content: center` declarations in the flex context, causing it to render incorrectly or remain invisible on some browsers

### Expected Behavior (Correct)

2.1 WHEN the user clicks the "Logout" button inside the logout confirmation modal THEN the system SHALL call `handleLogout()`, which calls `authService.logoutUser()`, clears local storage, and navigates to `/login` without throwing any error

2.2 WHEN the Delivery Dashboard mounts with an active WebSocket socket THEN the system SHALL register the `new_order` event listener exactly once, so that each incoming `new_order` event fires exactly one handler and produces exactly one notification and one state update

2.3 WHEN the user navigates to the Earnings tab and selects the "This Week" period THEN the system SHALL render the weekly breakdown chart without crashing, either by providing a defined `breakdown` array on `currentData` or by guarding the render so it only maps over defined data

2.4 WHEN the Earnings view component is parsed THEN the system SHALL have valid, well-formed JSX with correct closing tags and braces so the component renders without parse or runtime errors

2.5 WHEN any section of the Delivery Dashboard renders THEN the system SHALL apply correct styles to all elements by defining all missing CSS classes in `DeliveryDashboard.css`, including layout classes (`.dashboard-home`, `.stats-grid`, `.content-section`, `.section-header`, `.view-all-btn`), order card classes (`.order-card`, `.order-header`, `.order-info`, `.order-status`, `.order-details`, `.order-location`, `.order-time`, `.order-total`, `.order-items`, `.order-item`, `.order-location-info`, `.location-item`, `.location-details`, `.location-label`, `.location-address`, `.order-meta`, `.meta-item`, `.special-instructions`, `.order-actions`, `.action-btn`, `.order-filters`, `.filter-btn`), list classes (`.orders-list`, `.deliveries-list`, `.delivery-card`, `.delivery-header`, `.delivery-info`, `.delivery-rating`, `.delivery-details`, `.delivery-time`, `.delivery-tip`), earnings classes (`.earnings-view`, `.earnings-summary`, `.summary-header`, `.period-selector`, `.period-btn`, `.earnings-cards`, `.earnings-card`, `.card-icon`, `.card-content`, `.card-amount`, `.card-label`, `.daily-breakdown`, `.breakdown-chart`, `.day-bar`, `.bar-container`, `.earnings-bar`, `.day-info`, `.day-name`, `.day-amount`, `.day-deliveries`, `.payment-history`, `.payment-list`, `.payment-item`, `.payment-info`, `.payment-date`, `.payment-method`, `.payment-amount`, `.payment-status`, `.withdraw-btn`, `.withdrawal-info`), profile classes (`.profile-view`, `.profile-header`, `.profile-avatar-large`, `.avatar-circle`, `.avatar-status`, `.profile-info`, `.profile-stats`, `.edit-btn`, `.profile-sections`, `.profile-section`, `.profile-fields`, `.field-group`, `.account-info`, `.info-item`, `.info-label`, `.info-value`), settings classes (`.settings-view`, `.settings-section`, `.settings-group`, `.setting-item`, `.setting-info`, `.distance-selector`, `.distance-value`, `.time-selector`, `.account-actions`), and utility classes (`.loading-state`, `.loading-spinner`, `.modal-content`, `.modal-footer`, `.close-btn`, `.star-filled`, `.star-empty`, `.orders-header`, `.history-header`, `.history-filters`, `.active-orders`, `.available-orders`, `.delivery-history`)

2.6 WHEN the viewport is narrower than 1024px THEN the system SHALL correctly display the hamburger menu button as a properly centered flex container so the user can open and close the sidebar on mobile

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user clicks the "Logout" button in the topbar (not the modal) THEN the system SHALL CONTINUE TO open the logout confirmation modal

3.2 WHEN the Delivery Dashboard mounts THEN the system SHALL CONTINUE TO register WebSocket listeners for `order_assigned`, `order_update`, and `order_ready` events exactly once and clean them up on unmount

3.3 WHEN the user navigates to the Earnings tab and selects the "This Month" period THEN the system SHALL CONTINUE TO render the earnings summary cards without crashing

3.4 WHEN the user navigates between dashboard tabs (home, orders, available, history, earnings, profile, settings) THEN the system SHALL CONTINUE TO render the correct section for each tab

3.5 WHEN the Delivery Dashboard mounts THEN the system SHALL CONTINUE TO fetch available orders, partner orders, and delivery stats from the backend services on load and refresh every 30 seconds

3.6 WHEN a new order arrives via WebSocket THEN the system SHALL CONTINUE TO add it to the available orders list and show a notification

3.7 WHEN the NotificationCenter component is rendered in the topbar THEN the system SHALL CONTINUE TO receive and display WebSocket-based notifications without being affected by the duplicate listener fix
