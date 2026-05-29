# VoltC ⚡ Landing Page & IDE Simulator

This repository contains the official showcase landing page and interactive IDE simulator for **VoltC** — a lightweight, native C/C++ IDE for Ubuntu Linux.

## 🚀 Live Demo & Hosting
The project is built using standard HTML, CSS, and Vanilla JavaScript, making it ideal for hosting on static hosting providers like **Vercel**, **GitHub Pages**, or **Netlify**.

### Features
* **Interactive IDE Simulator**: Write custom C code, run compilations, trigger missing semicolon error dots in the gutter, and inspect visual variables on the Stack and Heap.
* **Supabase Auth**: Integrated Sign Up, Sign In, Google/GitHub OAuth, and log out handlers.
* **Zero Local Storage Writes**: All sessions, auth tokens, and forms are validated and run strictly in-memory (RAM) to keep data out of local storage.

---

## 🛠️ Local Development & Preview
To run the website locally on your computer:

### Option A: Python (Built-in)
Run the following in this folder:
```bash
python -m http.server 8000
```
Then visit: `http://localhost:8000`

### Option B: Node.js / NPM
Run the following in this folder:
```bash
npx http-server -p 8000
```
Then visit: `http://localhost:8000`

---

## 🔒 Supabase Database Configuration
The website is pre-configured with a live Supabase backend connection. To point it to your own Supabase project:
1. Create a free project on [Supabase](https://supabase.com).
2. Go to **Settings** -> **API** and copy your **Project URL** and **Anon Public Key**.
3. Open `app.js` and update the variables at the top of the file:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-public-key';
   ```
4. Deploy the site, and the authentication will run live connected to your database!
