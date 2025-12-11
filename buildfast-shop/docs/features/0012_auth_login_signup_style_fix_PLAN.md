# Feature #0012: Auth Screen Theme Alignment

## Description
The login and signup pages still render with the legacy light background (`bg-gray-50`), blue accent links, and low-contrast headings. This clashes with the new dark café aesthetic delivered through `MainLayout`, producing the white block seen in the screenshot where the primary heading text becomes unreadable. We need to realign the auth experience with the glassy dark theme used elsewhere in the app while keeping existing business logic untouched.

## Root Causes Identified
- `src/pages/Login.jsx` and `src/pages/Signup.jsx` keep the old container classes (`bg-gray-50`, light text colors, blue link accents) instead of inheriting the dark palette (`bg-[#050509]`, amber accents) defined in `MainLayout`.
- The forms are missing the updated surface treatments (glassmorphism card, subtle border) used across marketing pages, leaving a stark white canvas around the inputs.
- The signup success state reuses the same light wrapper, so even after submission the success card appears detached from the rest of the experience.

## Implementation Outline
1. **Create a shared auth shell**
   - Add a lightweight wrapper component under `src/components/auth-shell/auth-shell.jsx` that centers auth content, provides a gradient overlay over the dark background, and renders a reusable card container (`bg-white/5`, `border-white/10`, `backdrop-blur`).
   - Export helper subcomponents (`AuthShell.Root`, `AuthShell.Card`, `AuthShell.TitleBlock`) to keep `Login` and `Signup` declarative and avoid duplicating layout markup.

2. **Refactor `Login.jsx`**
   - Replace the legacy `bg-gray-50` wrapper with the shared auth shell.
   - Align typography: use the brand accent (`text-[#C59D5F]`) for link states, ensure headings contrast against the dark card.
   - Update button + focus rings to match existing call-to-action styling, preserving form validation and password toggle logic.

3. **Refactor `Signup.jsx`**
   - Apply the shared shell to both the default form view and the success confirmation view so visuals stay consistent across states.
   - Mirror the login typography/button treatment and adjust secondary actions to use neutral borders instead of blue/gray backgrounds.

4. **Polish**
   - Confirm responsiveness at `sm`/`md` breakpoints (card width, padding).
   - Verify focus styles remain accessible on inputs and links.

## Validation
- Manual smoke test: load `/login` and `/signup`, including signup success state, verifying the card sits on the dark gradient background with legible text.
- Regression check: ensure existing auth flows (sign-in, sign-up, redirect) still function by triggering form submissions with valid/invalid data.



