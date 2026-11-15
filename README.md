# Daymark — Task Manager

A lightweight task manager built with Next.js, TypeScript and Tailwind CSS. Designed for deployment on Vercel.

## Features

- Create, edit and delete tasks
- Start date, due date, priority and status
- Progress percentage with quick progress controls
- Activity history / progress notes for each task
- Dashboard counts for total, in-progress, completed and overdue tasks
- Upcoming deadline and overdue indicators
- Search, status filters and sorting
- Browser localStorage persistence

## Requirements

- Node.js 20.9 or later
- npm
- GitHub account
- Vercel account

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy with GitHub + Vercel

1. Unzip this project.
2. Create a new GitHub repository.
3. From this project folder, run:

   ```bash
   git init
   git add .
   git commit -m "Initial Daymark task manager"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

4. Sign in to Vercel and choose **Add New → Project**.
5. Import the GitHub repository.
6. Keep the detected framework as **Next.js** and click **Deploy**.

No environment variables are required for this starter version.

## Important data-storage note

This starter stores tasks in the browser's localStorage. This means:
- Tasks remain available in the same browser on the same device.
- Data is not automatically shared across devices or users.
- Clearing browser site data can remove saved tasks.
- There is no server-side backup or account login yet.

For a production multi-device app, the next step is to connect Supabase (database + authentication), then move task storage from localStorage to Supabase. Email/push reminders would also need a notification service and scheduled backend function.

## Project structure

```text
task-manager-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```
