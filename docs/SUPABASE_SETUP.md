# Learning Hub Connect — Supabase setup

This repository is being migrated from demo-only localStorage authentication and hardcoded LMS data to a multi-tenant Supabase backend.

## 1. Create a Supabase project

Create a project at https://supabase.com/dashboard. Choose a strong database password and a region appropriate for your users.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and set:

- `VITE_SUPABASE_URL`: Project URL from Project Settings → API.
- `VITE_SUPABASE_ANON_KEY`: publishable/anon key from Project Settings → API.

Never put the `service_role` key in a browser environment or commit it to Git.

## 3. Apply the database migration

Install the Supabase CLI and link this project:

```bash
npm install
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The initial schema is in `supabase/migrations/202611220001_initial_lms.sql`. It creates organization-scoped profiles, departments, teams, courses, modules, assignments, enrollments, module progress, quizzes, attempts, certificates, notifications, audit logs, and baseline RLS policies.

## 4. Provision the first platform administrator

New users are always created with the `learner` role. Do not allow users to choose privileged roles during public signup. After creating your own account and the first organization, use the Supabase SQL editor as the project owner to attach the account to the organization and elevate it:

```sql
insert into public.organizations (name, slug)
values ('Your Organization', 'your-organization')
returning id;

-- Replace the UUID values with the returned organization ID and your auth.users ID.
update public.profiles
set organization_id = 'ORGANIZATION_UUID',
    role = 'platform_super_admin',
    full_name = 'Platform Administrator'
where id = 'AUTH_USER_UUID';
```

Create other privileged users only through a trusted administrative workflow. Do not expose direct role changes to learners.

## 5. Roles and intended permissions

- `platform_super_admin`: platform-level organization and tenant administration.
- `organization_admin`: organization configuration and all organization LMS administration.
- `hr_coordinator`: workforce, assignments, compliance and reports.
- `department_manager`: scoped visibility into their department and its learners.
- `trainer`: course authoring and learner/course delivery.
- `learner`: assigned learning, own progress, attempts, notifications and certificates.

The initial migration includes the role enum and baseline organization RLS. Department-manager row scoping, trusted quiz grading, assignment expansion, certificate issuance, email delivery and audit automation must be completed in subsequent server-side migrations/functions before production use.

## 6. Run locally

```bash
npm run dev
```

## Security and release checklist

- Keep RLS enabled on every tenant-owned table.
- Add server-side Edge Functions for assignment fan-out, role provisioning, quiz grading, reminders and certificate issuance.
- Never send answer keys to the browser or trust client-submitted scores.
- Add storage buckets and policies for course assets and certificate PDFs.
- Configure email templates and an email provider for invitations and reminders.
- Test cross-organization isolation with at least two test tenants and all six roles.
- Run `npm run lint` and `npm run build` after integration.
