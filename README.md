# HolaThrift

Curated vintage and streetwear storefront for `holathrift.in`.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB
- Redis
- Cashfree account for payments
- Shiprocket account for shipping

## Install

Works the same on Windows, Linux, and macOS.

```bash
git clone <repo-url>
cd HolaThrift
npm install
```

## Configure

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in `.env` with your MongoDB, Redis, JWT, admin email, Cashfree, and Shiprocket values.

## Run Development

Terminal 1:

```bash
npm run server
```

Terminal 2:

```bash
npm run dev
```

Open the Vite URL shown in the terminal.

## Build

```bash
npm run build
```

## Check

```bash
npm run lint
```

## Useful Files

- `documentation.md` explains how the app works.
- `.env.example` shows required environment variables.
- `public/llms.txt` gives AI tools a plain summary.
- `public/humans.txt` gives human-facing project credits.
