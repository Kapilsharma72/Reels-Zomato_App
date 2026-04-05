# Bugfix Requirements Document

## Introduction

After a food partner completes registration via `UnifiedRegister.jsx`, they are not redirected to the food partner dashboard (`/food-partner/dashboard`). Instead, they end up on the user page (`/user/home`) or are bounced to `/login`. This happens because the registration flow stores session data under the wrong localStorage key (`tempUserData`), while `ProtectedRoute` reads from `userData`. The login flow stores under `userData` correctly, which is why login works but registration does not.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a food partner submits the registration form successfully THEN the system stores their role data under `localStorage.tempUserData` instead of `localStorage.userData`

1.2 WHEN the app navigates to `/food-partner/dashboard` after food partner registration THEN the system redirects the user away from the food partner dashboard because `ProtectedRoute` finds no `userData` entry with `role: 'food-partner'`

1.3 WHEN a stale `userData` entry exists in localStorage with `role: 'user'` from a previous session THEN the system redirects the newly registered food partner to `/user/home` instead of `/food-partner/dashboard`

### Expected Behavior (Correct)

2.1 WHEN a food partner submits the registration form successfully THEN the system SHALL store their session data under `localStorage.userData` with `role: 'food-partner'`, matching the structure set during food partner login

2.2 WHEN the app navigates to `/food-partner/dashboard` after food partner registration THEN the system SHALL allow access and render the food partner dashboard, because `ProtectedRoute` finds a valid `userData` entry with `role: 'food-partner'`

2.3 WHEN a food partner registers successfully THEN the system SHALL redirect them to `/food-partner/dashboard`, consistent with the behavior after food partner login

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user (role: user) registers successfully THEN the system SHALL CONTINUE TO store their data under `localStorage.userData` and redirect them to `/user/home`

3.2 WHEN a food partner logs in successfully THEN the system SHALL CONTINUE TO store their data under `localStorage.userData` with `role: 'food-partner'` and redirect them to `/food-partner/dashboard`

3.3 WHEN a delivery partner registers successfully THEN the system SHALL CONTINUE TO redirect them to `/delivery/dashboard`

3.4 WHEN an editor registers successfully THEN the system SHALL CONTINUE TO redirect them to `/editor/dashboard`

3.5 WHEN an unauthenticated user attempts to access `/food-partner/dashboard` THEN the system SHALL CONTINUE TO redirect them to `/login`
