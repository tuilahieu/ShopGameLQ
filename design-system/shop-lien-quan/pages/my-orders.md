# Purchased accounts — page override

Inherits `../MASTER.md`. This file only records page-specific decisions.

- Cards use one column by default and two columns from `48rem` upward.
- Each card keeps order identity and account metadata above a price/action footer; no hover-only action.
- The credential modal uses the shared `LoginCredentials` component also used after checkout.
- On narrow screens, modal footer actions and credential rows stack without horizontal overflow.
- Loading shell renders one card on mobile and two cards from `48rem`, preserving the final card border, radius, shadow, padding, and tracks.
