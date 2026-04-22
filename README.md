# Local Password Manager

A modern **local-first password manager** built with **Next.js** and the **Web Crypto API**.  
It encrypts the vault directly in the browser before saving it to `localStorage`, making it a strong **portfolio project** for showing UI work, state management, browser-side cryptography, and product thinking.

## Preview

**Highlights:**
- smooth glassmorphism-style UI
- local encrypted vault
- master password unlock flow
- password generator
- inactivity auto-lock
- encrypted export/import

## Features

- **Master password setup and unlock**
- **Local encryption with PBKDF2 + AES-GCM**
- **Vault stored in localStorage**
- **Auto-lock after inactivity**
- **Create, edit, delete, and search entries**
- **Password generator**
- **Password strength bar**
- **Copy buttons** for username, password, and website
- **Category dropdown** for organization
- **Encrypted backup export/import**
- **Responsive modern UI** with animations

## Why this project is good for a portfolio

This project demonstrates:
- building a polished product UI with **Next.js + React**
- handling **client-side state** cleanly
- using the **Web Crypto API** for real encryption logic
- managing **local persistence** securely enough for demo use
- structuring a project into reusable components and utility files
- thinking about user experience with auto-lock, copy actions, and feedback toasts

## Tech Stack

- **Next.js 15**
- **React 18**
- **Framer Motion**
- **Lucide React**
- **Web Crypto API**
- **CSS**

## Project Structure

```bash
local-password-manager/
├── app/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   ├── PasswordManagerApp.jsx
│   ├── StrengthBar.jsx
│   └── Toast.jsx
├── lib/
│   ├── crypto.js
│   └── storage.js
├── public/
├── .gitignore
├── jsconfig.json
├── next.config.mjs
├── package.json
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-link>
cd local-password-manager
```

If you are starting from a ZIP file instead, extract it first and open the folder in your terminal.

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

### 4. Open the app

Visit:

```bash
http://localhost:3000
```

## Production

Build and run the production version:

```bash
npm run build
npm run start
```

## How the encryption works

This app uses:
- **PBKDF2** to derive a key from the master password
- **AES-GCM 256-bit** to encrypt and decrypt the vault
- a random **salt** and **IV** for encryption operations

The encrypted vault is then stored locally in the browser.

## Security Note

This project is designed for **portfolio/demo purposes** and is **not intended to replace a production password manager** like Bitwarden or 1Password.

Reasons:
- data is stored in `localStorage`
- there is no external audit
- there is no secure multi-device sync
- clipboard copying can temporarily expose secrets
- browser-based apps have limitations compared to hardened native security products

## Possible Next Features

- clear clipboard automatically after a few seconds
- custom categories
- tags and favorites
- password history
- re-authentication before revealing passwords
- IndexedDB support instead of localStorage
- dark/light theme switcher
- PWA support
- desktop build with Tauri or Electron



## License

This project is for educational use.
