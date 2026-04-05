# Bugfix Requirements Document

## Introduction

This document covers a batch of bugs and UI issues reported across the ReelZomato frontend — a food delivery app with social features (stories, reels, posts). The issues span three main areas: the Story page, the Reels page, and general UI/UX across the home page, header, profile page, and comments section. A backend "Internal server error" when opening the orders panel is also included. The fixes must restore correct ordering and cart behavior without breaking any existing functionality.

---

## Bug Analysis

### Current Behavior (Defect)

**Story Page**

1.1 WHEN a user clicks the "Order" button on the Story page THEN the system redirects to the home page instead of opening an order panel/modal

1.2 WHEN a user clicks Order → "Add to Cart" on the Story page THEN the system adds the product to the cart but does not show any visible cart indicator or access point to the user

1.3 WHEN a user clicks the "Order" button on the Story page THEN the page blinks/flickers continuously

**Home Page (Posts Feed)**

1.4 WHEN a food partner's post image is displayed on the home page THEN the system shows the image cropped or cut off rather than fully visible

1.5 WHEN post engagement metrics are displayed on the home page THEN the system shows hardcoded dummy values (e.g., comments: 23, shares: 24) instead of real data

1.6 WHEN the comments section is rendered THEN the system displays it with poor CSS styling that makes it difficult to read and use

**Reels Page**

1.7 WHEN a user clicks the "Order" button on the Reels page THEN the system does not respond or open any order panel

1.8 WHEN a user clicks "Add to Cart" on the Reels page and then opens the cart/orders panel THEN the system does not open the panel

1.9 WHEN the Reels page is rendered THEN the system displays a "+" (plus) button that serves no clear purpose and should not be present

1.10 WHEN the Reels page is rendered THEN the system displays an "Added" button whose purpose is unclear and whose behavior is broken or undefined

**Orders Panel**

1.11 WHEN a user opens the orders/cart panel THEN the system returns an "Internal server error" instead of displaying order data

**UI Issues**

1.12 WHEN the app header is rendered THEN the system displays a visually poor header that does not match the quality expected for the app

1.13 WHEN the home page is rendered THEN the system displays a visually unappealing layout that needs a major UI overhaul

1.14 WHEN the profile page is rendered THEN the system displays a plain, uninteresting layout that is not user-friendly

---

### Expected Behavior (Correct)

**Story Page**

2.1 WHEN a user clicks the "Order" button on the Story page THEN the system SHALL open an in-page order modal/panel without navigating away from the story

2.2 WHEN a user clicks Order → "Add to Cart" on the Story page THEN the system SHALL display a visible cart icon/badge with item count so the user can access their cart

2.3 WHEN a user clicks the "Order" button on the Story page THEN the system SHALL open the order modal smoothly without any page flickering or blinking

**Home Page (Posts Feed)**

2.4 WHEN a food partner's post image is displayed on the home page THEN the system SHALL render the image fully using `object-fit: cover` with a consistent aspect ratio so no content is cropped unexpectedly

2.5 WHEN post engagement metrics are displayed on the home page THEN the system SHALL show real comment and share counts fetched from the API, not hardcoded dummy values

2.6 WHEN the comments section is rendered THEN the system SHALL display it with a fully redesigned CSS that is clean, readable, and visually consistent with the app's design language

**Reels Page**

2.7 WHEN a user clicks the "Order" button on the Reels page THEN the system SHALL open an order modal for the selected reel item

2.8 WHEN a user clicks "Add to Cart" on the Reels page and then opens the cart/orders panel THEN the system SHALL open the cart panel correctly displaying all added items

2.9 WHEN the Reels page is rendered THEN the system SHALL NOT display the extraneous "+" (plus) button

2.10 WHEN the Reels page is rendered THEN the system SHALL either remove the "Added" button if it serves no purpose, or replace it with a clearly labeled and functional button

**Orders Panel**

2.11 WHEN a user opens the orders/cart panel THEN the system SHALL successfully fetch and display the user's orders without returning a server error

**UI Improvements**

2.12 WHEN the app header is rendered THEN the system SHALL display a redesigned header that is visually polished, well-structured, and consistent with the app's brand identity

2.13 WHEN the home page is rendered THEN the system SHALL display a redesigned layout that is visually appealing, well-organized, and provides a great user experience

2.14 WHEN the profile page is rendered THEN the system SHALL display a redesigned profile page that is visually interesting, user-friendly, and clearly presents user information and actions

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user navigates between pages (home, reels, stories, profile) THEN the system SHALL CONTINUE TO route correctly without unintended redirects

3.2 WHEN a user adds items to the cart from the Reels page THEN the system SHALL CONTINUE TO persist cart state in localStorage across page navigations

3.3 WHEN a user views stories THEN the system SHALL CONTINUE TO advance through story media, track viewed state, and allow play/pause controls

3.4 WHEN a user submits an order through the checkout flow THEN the system SHALL CONTINUE TO send order data to the correct food partner via the backend API

3.5 WHEN a user interacts with likes and comments on reels THEN the system SHALL CONTINUE TO send the correct API requests and update the UI optimistically

3.6 WHEN a user is not authenticated THEN the system SHALL CONTINUE TO redirect to the login page for protected routes

3.7 WHEN the orders panel is open and a WebSocket order update is received THEN the system SHALL CONTINUE TO update the order status in real time

3.8 WHEN a user searches for restaurants or dishes on the Reels page THEN the system SHALL CONTINUE TO display search results correctly

3.9 WHEN a food partner's post is displayed THEN the system SHALL CONTINUE TO show the correct business name, description, and associated media

3.10 WHEN a user manages their profile (update name, email, phone, password, addresses) THEN the system SHALL CONTINUE TO save changes and display success/error feedback correctly
