-- Learning Hub Connect: multi-tenant LMS foundation
-- Apply with: supabase db push (or paste into the Supabase SQL editor).
create extension if not exists pgcrypto;

create type public.app_role as enum (
  'platform_super_admin',
  'organization_admin',
  'hr_coordinator',
  'department_manager',
  'trainer',
  'learner'
);
create type public.course_status as enum ('draft', 'published', 'archived');
create type public.assignment_status as enum ('active', 'cancelled', 'completed');
create type public.enrollment_status as enum ('assigned', 'in_progress', 'completed', 'overdue', 'waived');
create type public.module_kind as enum ('video', 'scorm', 'pdf', 'text', 'quiz');
create type public.question_kind as enum ('single_choice', 'multiple_choice', 'true_false');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  role public.app_role not null default 'learner',
  full_name text not null default '',
  email text not null,
  department_id uuid,
  manager_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);
alter table public.profiles add constraint profiles_department_fk
  foreign key (department_id) references public.departments(id) on delete set null;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);
create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, profile_id)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  instructor_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null,
  description text not null default '',
  category text not null default 'General',
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  status public.course_status not null default 'draft',
  passing_score integer not null default 70 check (passing_score between 0 and 100),
  certificate_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);
create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  kind public.module_kind not null,
  content_url text,
  body text,
  position integer not null default 0,
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  unique (course_id, position)
);

create table public.course_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  created_by uuid not null references public.profiles(id),
  title text,
  is_mandatory boolean not null default true,
  allow_self_unenroll boolean not null default false,
  due_at timestamptz,
  published_at timestamptz,
  status public.assignment_status not null default 'active',
  created_at timestamptz not null default now()
);
create table public.assignment_targets (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.course_assignments(id) on delete cascade,
  target_type text not null check (target_type in ('department','team','individual')),
  target_id uuid not null,
  created_at timestamptz not null default now()
);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assignment_id uuid not null references public.course_assignments(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  status public.enrollment_status not null default 'assigned',
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  due_at timestamptz,
  unique (assignment_id, learner_id)
);
create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  completed_at timestamptz,
  last_position_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (enrollment_id, module_id)
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null unique references public.course_modules(id) on delete cascade,
  time_limit_minutes integer,
  max_attempts integer,
  shuffle_questions boolean not null default false
);
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  kind public.question_kind not null,
  options jsonb not null default '[]'::jsonb,
  correct_answers jsonb not null default '[]'::jsonb,
  explanation text not null default '',
  points integer not null default 1 check (points > 0),
  position integer not null default 0
);
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  attempt_number integer not null,
  answers jsonb not null default '{}'::jsonb,
  score_percent numeric(5,2),
  passed boolean,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique (enrollment_id, quiz_id, attempt_number)
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  enrollment_id uuid not null unique references public.enrollments(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  verification_code text not null unique default upper(encode(gen_random_bytes(6), 'hex')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_org_role_idx on public.profiles(organization_id, role);
create index courses_org_status_idx on public.courses(organization_id, status);
create index assignments_org_due_idx on public.course_assignments(organization_id, due_at);
create index enrollments_learner_status_idx on public.enrollments(learner_id, status);
create index notifications_recipient_created_idx on public.notifications(recipient_id, created_at desc);

-- New accounts always start as learners. Elevated roles are assigned by an authorized
-- organization administrator or by a trusted platform operator, never from signup metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''), 'learner');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.current_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active = true
$$;
create or replace function public.current_org()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid() and is_active = true
$$;
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() = 'platform_super_admin', false)
$$;
create or replace function public.can_manage_org()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() in ('platform_super_admin','organization_admin','hr_coordinator'), false)
$$;
create or replace function public.can_manage_course()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role() in ('platform_super_admin','organization_admin','hr_coordinator','trainer'), false)
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_assignments enable row level security;
alter table public.assignment_targets enable row level security;
alter table public.enrollments enable row level security;
alter table public.module_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.certificates enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "organization members can read their organization" on public.organizations
for select using (id = public.current_org() or public.is_platform_admin());
create policy "platform admins manage organizations" on public.organizations
for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "profiles visible within organization" on public.profiles
for select using (id = auth.uid() or organization_id = public.current_org() or public.is_platform_admin());
create policy "users update own basic profile" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());
create policy "org admins manage profiles" on public.profiles
for all using (organization_id = public.current_org() and public.can_manage_org())
with check (organization_id = public.current_org() and public.can_manage_org());

create policy "org departments read" on public.departments for select
using (organization_id = public.current_org() or public.is_platform_admin());
create policy "org departments manage" on public.departments for all
using (organization_id = public.current_org() and public.can_manage_org())
with check (organization_id = public.current_org() and public.can_manage_org());
create policy "org teams read" on public.teams for select
using (organization_id = public.current_org() or public.is_platform_admin());
create policy "org teams manage" on public.teams for all
using (organization_id = public.current_org() and public.can_manage_org())
with check (organization_id = public.current_org() and public.can_manage_org());
create policy "team membership org access" on public.team_members for all
using (exists(select 1 from public.teams t where t.id=team_id and (t.organization_id=public.current_org() and public.can_manage_org() or public.is_platform_admin())))
with check (exists(select 1 from public.teams t where t.id=team_id and (t.organization_id=public.current_org() and public.can_manage_org() or public.is_platform_admin())));

create policy "courses visible to org" on public.courses for select
using (organization_id=public.current_org() or public.is_platform_admin());
create policy "course managers create" on public.courses for insert
with check (organization_id=public.current_org() and public.can_manage_course() and created_by=auth.uid());
create policy "course managers update" on public.courses for update
using (organization_id=public.current_org() and public.can_manage_course())
with check (organization_id=public.current_org() and public.can_manage_course());
create policy "course managers delete" on public.courses for delete
using (organization_id=public.current_org() and public.can_manage_org());

create policy "modules visible with course" on public.course_modules for select
using (exists(select 1 from public.courses c where c.id=course_id and c.organization_id=public.current_org()));
create policy "course managers manage modules" on public.course_modules for all
using (exists(select 1 from public.courses c where c.id=course_id and c.organization_id=public.current_org() and public.can_manage_course()))
with check (exists(select 1 from public.courses c where c.id=course_id and c.organization_id=public.current_org() and public.can_manage_course()));

create policy "assignments org managers read" on public.course_assignments for select
using (organization_id=public.current_org() or public.is_platform_admin());
create policy "assignments managers create" on public.course_assignments for insert
with check (organization_id=public.current_org() and public.can_manage_org() and created_by=auth.uid());
create policy "assignments managers update" on public.course_assignments for update
using (organization_id=public.current_org() and public.can_manage_org())
with check (organization_id=public.current_org() and public.can_manage_org());
create policy "assignment targets org managers" on public.assignment_targets for all
using (exists(select 1 from public.course_assignments a where a.id=assignment_id and a.organization_id=public.current_org() and public.can_manage_org()))
with check (exists(select 1 from public.course_assignments a where a.id=assignment_id and a.organization_id=public.current_org() and public.can_manage_org()));

create policy "learners read own enrollments managers read org" on public.enrollments for select
using (learner_id=auth.uid() or (organization_id=public.current_org() and public.can_manage_org()) or public.is_platform_admin());
create policy "managers create enrollments" on public.enrollments for insert
with check (organization_id=public.current_org() and public.can_manage_org());
create policy "learners update own progress" on public.enrollments for update
using (learner_id=auth.uid()) with check (learner_id=auth.uid());
create policy "managers update enrollments" on public.enrollments for update
using (organization_id=public.current_org() and public.can_manage_org())
with check (organization_id=public.current_org() and public.can_manage_org());

create policy "module progress own or manager" on public.module_progress for all
using (exists(select 1 from public.enrollments e where e.id=enrollment_id and (e.learner_id=auth.uid() or (e.organization_id=public.current_org() and public.can_manage_org()))))
with check (exists(select 1 from public.enrollments e where e.id=enrollment_id and (e.learner_id=auth.uid() or (e.organization_id=public.current_org() and public.can_manage_org()))));

create policy "quiz metadata visible to enrolled org" on public.quizzes for select
using (exists(select 1 from public.course_modules m join public.courses c on c.id=m.course_id where m.id=module_id and c.organization_id=public.current_org()));
create policy "quiz managers manage" on public.quizzes for all
using (exists(select 1 from public.course_modules m join public.courses c on c.id=m.course_id where m.id=module_id and c.organization_id=public.current_org() and public.can_manage_course()))
with check (exists(select 1 from public.course_modules m join public.courses c on c.id=m.course_id where m.id=module_id and c.organization_id=public.current_org() and public.can_manage_course()));
create policy "questions visible to enrolled org" on public.quiz_questions for select
using (exists(select 1 from public.quizzes q join public.course_modules m on m.id=q.module_id join public.courses c on c.id=m.course_id where q.id=quiz_id and c.organization_id=public.current_org()));
create policy "quiz managers manage questions" on public.quiz_questions for all
using (exists(select 1 from public.quizzes q join public.course_modules m on m.id=q.module_id join public.courses c on c.id=m.course_id where q.id=quiz_id and c.organization_id=public.current_org() and public.can_manage_course()))
with check (exists(select 1 from public.quizzes q join public.course_modules m on m.id=q.module_id join public.courses c on c.id=m.course_id where q.id=quiz_id and c.organization_id=public.current_org() and public.can_manage_course()));
create policy "learners manage own quiz attempts" on public.quiz_attempts for all
using (exists(select 1 from public.enrollments e where e.id=enrollment_id and e.learner_id=auth.uid()))
with check (exists(select 1 from public.enrollments e where e.id=enrollment_id and e.learner_id=auth.uid()));

create policy "certificates learner and org manager read" on public.certificates for select
using (learner_id=auth.uid() or (organization_id=public.current_org() and public.can_manage_org()) or public.is_platform_admin());
create policy "notifications recipient read and update" on public.notifications for all
using (recipient_id=auth.uid()) with check (recipient_id=auth.uid());
create policy "audit logs managers read" on public.audit_logs for select
using (organization_id=public.current_org() and public.can_manage_org() or public.is_platform_admin());
create policy "audit logs authenticated insert" on public.audit_logs for insert
with check (actor_id=auth.uid() and organization_id=public.current_org());

-- Do not expose quiz answer keys to learners. This view is intended for learner-facing
-- quiz rendering; privileged grading must run in a trusted server function.
create or replace view public.learner_quiz_questions
with (security_invoker = true) as
select id, quiz_id, prompt, kind, options, points, position
from public.quiz_questions;

grant select on public.learner_quiz_questions to authenticated;
