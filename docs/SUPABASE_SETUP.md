# Learning Hub Connect — Supabase setup

The application now uses Supabase Auth and a PostgreSQL-backed, multi-tenant LMS model. The old localStorage demo login is removed. Public users cannot choose privileged roles during signup; accounts are provisioned through administrator invitations.

## 1. Create a Supabase project

Create a project at https://supabase.com/dashboard. Choose a strong database password and a region appropriate for your users.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and set:

- `VITE_SUPABASE_URL`: Project URL from Project Settings → API.
- `VITE_SUPABASE_ANON_KEY`: publishable/anon key from Project Settings → API.

Never put the `service_role` key in a browser environment or commit it to Git.

## 3. Apply database migrations

Install the Supabase CLI and link this project:

```bash
npm install
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Migrations create organization-scoped profiles, departments, teams, courses, modules, assignments, enrollments, module progress, quizzes, attempts, certificates, notifications, audit logs, role-aware RLS policies, and trusted database functions for publishing assignments, completing lessons and grading quizzes.

## 4. Provision the first platform administrator

1. Create your own user in Supabase Authentication → Users (or invite the initial operator).
2. Run this SQL in the Supabase SQL editor, replacing the email and name:

```sql
update public.profiles
set role = 'platform_super_admin',
    full_name = 'Platform Administrator'
where email = 'admin@yourdomain.com';
```

3. Sign in to Learning Hub Connect. The platform administrator can create organizations at `/platform/organizations`.
4. Invite an organization administrator for each organization. That administrator can then create departments, teams, invite HR coordinators, managers, trainers and learners.

New accounts are always created with the learner role by the database trigger. Elevated roles are assigned only through the trusted invitation function or a privileged SQL operation.

## 5. Deploy Edge Functions

```bash
npx supabase functions deploy invite-user
npx supabase functions deploy verify-certificate
```

The Supabase Edge Function runtime provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Keep the service role key server-side only.

Configure a production SMTP provider in Supabase Authentication → SMTP Settings so invitation emails are delivered reliably. The application currently creates in-app assignment and completion notifications; scheduled reminder emails are a later integration.

## 6. Roles and access

- `platform_super_admin`: platform-level organization administration and tenant provisioning.
- `organization_admin`: organization configuration and organization-wide LMS administration.
- `hr_coordinator`: workforce, assignments, compliance and reports.
- `department_manager`: scoped visibility into their department's people, enrollments and certificates.
- `trainer`: course authoring and learner-facing course delivery.
- `learner`: assigned learning, own progress, assessment attempts, notifications and certificates.

RLS is enabled on tenant-owned tables. Profile role and organization membership fields are not writable from the browser. Quiz answer keys, quiz grading and completion updates are handled by restricted database functions.

## 7. Run locally

```bash
npm install
npm run dev
```

## Current implementation notes

- Course creation supports text modules and a single-choice final quiz using the question format documented in the course form.
- Publishing an assignment expands department/team/individual targets into unique learner enrollments and creates in-app notifications.
- Learners can complete lessons and submit quizzes. Passing all required modules completes the enrollment and creates a certificate record.
- Certificate cards support browser print / Save as PDF. Public verification uses the `verify-certificate` Edge Function.
- Course media storage, SCORM runtime, scheduled reminders/email notifications, richer question types, department-manager delegated administration and full audit/event monitoring remain follow-up production work.

## Release checklist

- Configure environment variables and deploy migrations/functions.
- Configure SMTP and test invitation delivery.
- Test with two separate organizations and all six roles.
- Verify that users cannot read another tenant's records or change their own role.
- Test quiz grading, retakes, course completion, certificate issuance and public verification.
- Run `npm run lint` and `npm run build`.
