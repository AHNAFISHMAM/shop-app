# Buildfast Shop

A modern e-commerce web application built with React, Tailwind CSS, and Supabase.

## Tech Stack

- **React** - UI library for building the interface
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Supabase** - Backend as a service for database, auth, and storage
- **React Router** - Client-side routing for navigation

## Project Structure

```
src/
├── components/     # Reusable UI components (buttons, cards, modals, etc.)
├── pages/         # Page components (Home, Products, Cart, etc.)
├── utils/         # Helper functions and utilities
├── lib/           # Third-party configurations (Supabase client)
├── App.jsx        # Main app with routing setup
├── main.jsx       # Application entry point
└── index.css      # Global styles with Tailwind directives
```

## Getting Started

### 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is ready, go to Project Settings > API
3. Copy your project URL and anon key

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Install Dependencies (if not already installed)

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Next Steps

Now that your project is set up, you can:

1. Create your database tables in Supabase
2. Build out your page components in `src/pages/`
3. Create reusable UI components in `src/components/`
4. Add helper functions in `src/utils/`
5. Connect your components to Supabase using the client in `src/lib/supabase.js`

## Using Supabase

Import the Supabase client in any component:

```javascript
import { supabase } from '../lib/supabase'

// Example: Fetch data
const { data, error } = await supabase
  .from('products')
  .select('*')
```

## License

MIT
