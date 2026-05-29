# VoltC ⚡ Landing Page & IDE Simulator

This repository contains the official showcase landing page and interactive IDE simulator for **VoltC** — a lightweight, native C/C++ IDE for Ubuntu Linux.

**Live Site**: [volt-c.vercel.app](https://volt-c.vercel.app/)

---

## ✨ Features

- **Interactive IDE Simulator** — Write custom C code, run compilations, trigger missing semicolon error dots in the gutter, and inspect visual variables on the Stack and Heap.
- **5 Editor Themes** — Midnight Crimson (default), Void, Solar, Arctic, and Hacker.
- **v1 / v2 Version Toggle** — Switch between VoltC v1 and v2 interfaces inside the simulator.
- **User Auth (Mock)** — Sign Up, Login, Google OAuth, and GitHub OAuth modals with in-memory validation.
- **Feedback Form** — Community feedback form with inline Send/Sent state.
- **Newsletter Signup** — "Notify Me" subscription container with in-memory validation.
- **Responsive Design** — Fully responsive across desktop and mobile viewports.
- **Zero Local Storage** — All sessions, auth tokens, and form data are handled strictly in-memory. Nothing is written to `localStorage` or `sessionStorage`.

---

## 📂 Project Structure

```
Website/
├── index.html      # Main HTML page
├── style.css       # All styles and design tokens
├── app.js          # All JavaScript logic (simulator, auth, forms)
├── logo.png        # VoltC logo (512x512 PNG, transparent)
├── logo.svg        # VoltC logo (SVG vector, transparent)
├── vercel.json     # Vercel deployment config
├── .gitignore      # Git ignore rules
└── README.md       # This file
```

---

## 🛠️ Local Development & Preview

### Option A: Python (Built-in)
```bash
python -m http.server 8000
```
Then visit: `http://localhost:8000`

### Option B: Node.js / NPM
```bash
npx http-server -p 8000
```
Then visit: `http://localhost:8000`

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 |
| Styling | Vanilla CSS (custom design tokens) |
| Logic | Vanilla JavaScript (ES6+) |
| Fonts | Google Fonts (Inter, Outfit, Fira Code) |
| Icons | Font Awesome 6 |
| Hosting | Vercel (static) |

---

## 🔒 Future: Supabase Auth & Database

To add live user authentication and data storage:
1. Create a free project on [Supabase](https://supabase.com).
2. Go to **Settings** → **API** and copy your **Project URL** and **Anon Public Key**.
3. Add the Supabase JS SDK to `index.html`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```
4. Initialize the client in `app.js`:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-public-key';
   const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
   ```
5. Deploy the site, and authentication will run live connected to your database!

---

## 📜 License

© 2026 VoltC Team. All rights reserved.
