# Autumn — E-learning (React + Vite + JS)

Dark-mode e-learning landing page built with:

- **React 19 + Vite** (JavaScript, no TypeScript)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **shadcn/ui** (`components.json` configured for JSX, `@/` alias)
- **Lucide Icons** (`lucide-react`) for UI icons
- **React Icons** (`react-icons`) for brand/tech logos and social icons

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## Dark mode

The site starts in dark mode (`<html class="dark">`). The sun/moon button in the
navbar toggles light/dark and remembers the choice in `localStorage`.
Theme colors live as CSS variables in `src/index.css` (`:root` = light, `.dark` = dark) —
change `--primary` there to re-brand the whole site.

## Adding more shadcn components

```bash
npx shadcn@latest add dialog dropdown-menu sheet
```

Already included in `src/components/ui/`: button, card, badge, input, progress, avatar, tabs.

## Project structure

```
src/
  components/
    ui/          # shadcn components
    sections/    # Navbar, Hero, Categories, Courses, CourseCard,
                 # ContinueLearning, Testimonials, CTA, Footer
  data/courses.js  # sample courses, categories, testimonials
  lib/utils.js     # cn() helper
  App.jsx
  index.css        # Tailwind + theme tokens
```
