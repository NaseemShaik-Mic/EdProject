Learning App Prototype

This is a small responsive prototype built with plain HTML/CSS/JS that mirrors the mobile UI in the provided image. It includes:

 - Dashboard: progress calculation and resource list
 - Courses: course catalog and course detail pages with lessons and quizzes
 - Profile: enrolled courses and per-course progress

Persistence: tasks and resources are saved to localStorage (browser).

How to run
1. Open `index.html` in your browser.
2. Use the navigation at the bottom or header to switch screens.
 
 New pages
- `courses.html` — browse the course catalog and enroll.
- `course.html?courseId=<id>` — view course lessons and take the course quiz.
- `profile.html` — view your enrolled courses and quiz progress.

Additional client features
- Dark mode toggle (header) — persists across sessions.
- Course search on `courses.html`.
- Toast notifications for feedback (bottom-right).
- Client-side image compression for uploaded resource images (keeps localStorage usage smaller).
- Lazy-loading for remote images (improves performance).
- Export/import localStorage data (header Data → Export/Import) for backup and restore.
- Simple analytics stored in localStorage (page view counts).

Notes & next steps
- Login/signup are demo-only stubs. Integrate a backend or authentication library for production.
- Uploaded files are not uploaded to a server; they are just recorded in localStorage. For file uploads you'll need a server endpoint.
- Improve accessibility and add unit tests as next steps.
