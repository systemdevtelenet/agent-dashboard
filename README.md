# CTNP Agent Workspace

Agent dashboard built with Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Supabase, and Lucide React.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and enter the Supabase project URL and publishable key.
3. Start the app with `npm run dev`.

The current dashboard uses example agent, attendance, shift, and notification data. Connect the relevant Supabase tables before using it with employee records. Keep secret or service role keys out of `NEXT_PUBLIC_` variables.

The `/login` page uses the public `Images` bucket assets `ctnp-bg-image-1.png` and `ctnp-logo-full.png`. Email/password and password reset use Supabase Auth. Google sign-in also requires the Google provider to be enabled in Supabase Auth and the local and production `/auth/callback` URLs to be listed in the Auth URL configuration.

Vercel can deploy this project from its Git repository using the included Next.js configuration. Add the same Supabase URL and publishable key to the Vercel project's environment variables.
