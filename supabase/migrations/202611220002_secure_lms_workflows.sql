-- Tighten privileged writes and add atomic assignment + learner progress workflows.
-- Apply after 202611220001_initial_lms.sql.

-- Profile role/org membership must never be writable by the browser client.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Assignment creation is performed atomically by a trusted database function.
revoke insert, update, delete on public.course_assignments from authenticated;
grant select on public.course_assignments to authenticated;
revoke insert, update, delete on public.assignment_targets from authenticated;
grant select on public.assignment_targets to authenticated;

-- Enrollment state, progress, answer keys and grading results are server-controlled.
revoke insert, update, delete on public.enrollments from authenticated;
grant select on public.enrollments to authenticated;
revoke all on public.module_progress from anon, authenticated;
grant select on public.module_progress to authenticated;
revoke all on public.quiz_attempts from anon, authenticated;
grant select on public.quiz_attempts to authenticated;
revoke all on public.quiz_questions from anon, authenticated;
grant select (id, quiz_id, prompt, kind, options, points, position) on public.quiz_questions to authenticated;
grant insert (quiz_id, prompt, kind, options, correct_answers, explanation, points, position) on public.quiz_questions to authenticated;
grant update (prompt, kind, options, correct_answers, explanation, points, position) on public.quiz_questions to authenticated;

drop policy if exists "learners update own progress" on public.enrollments;
drop policy if exists "module progress own or manager" on public.module_progress;
drop policy if exists "learners manage own quiz attempts" on public.quiz_attempts;

drop policy if exists "profiles visible within organization" on public.profiles;
create or replace function public.current_department()
returns uuid language sql stable security definer set search_path = public
as 'select department_id from public.profiles where id = auth.uid() and is_active = true';

create or replace function public.trainer_can_view_profile(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = public
as 'select exists (
  select 1 from public.enrollments e
  join public.courses c on c.id = e.course_id
  where e.learner_id = p_profile_id and c.instructor_id = auth.uid()
)';

create or replace function public.can_manage_specific_course(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public
as 'select exists (
  select 1 from public.courses c
  where c.id = p_course_id and c.organization_id = public.current_org()
    and (public.can_manage_org() or (public.current_role() = ''trainer'' and c.instructor_id = auth.uid()))
)';

create policy "profiles visible by role scope" on public.profiles
for select using (
  id = auth.uid()
  or public.is_platform_admin()
  or (organization_id = public.current_org() and public.can_manage_org())
  or (organization_id = public.current_org() and public.current_role() = 'department_manager' and department_id = public.current_department())
  or (organization_id = public.current_org() and public.current_role() = 'trainer' and public.trainer_can_view_profile(profiles.id))
);

drop policy if exists "learners read own enrollments managers read org" on public.enrollments;
create policy "enrollments visible by role scope" on public.enrollments for select
using (
  learner_id = auth.uid()
  or (organization_id = public.current_org() and public.can_manage_org())
  or (public.current_role() = 'department_manager' and exists (
    select 1 from public.profiles p where p.id = learner_id and p.department_id = public.current_department()
  ))
  or (public.current_role() = 'trainer' and exists (
    select 1 from public.courses c where c.id=enrollments.course_id and c.instructor_id=auth.uid()
  ))
  or public.is_platform_admin()
);

drop policy if exists "certificates learner and org manager read" on public.certificates;
create policy "certificates visible by role scope" on public.certificates for select
using (
  learner_id = auth.uid()
  or (organization_id = public.current_org() and public.can_manage_org())
  or (public.current_role() = 'department_manager' and exists (
    select 1 from public.profiles p where p.id = learner_id and p.department_id = public.current_department()
  ))
  or public.is_platform_admin()
);

drop policy if exists "org teams manage" on public.teams;
create policy "org teams manage" on public.teams for all
using (organization_id = public.current_org() and public.can_manage_org())
with check (
  organization_id = public.current_org() and public.can_manage_org()
  and (department_id is null or exists(
    select 1 from public.departments d where d.id=department_id and d.organization_id=public.current_org()
  ))
);

drop policy if exists "team membership org access" on public.team_members;
create policy "team membership org access" on public.team_members for all
using (exists(
  select 1 from public.teams t
  where t.id=team_id and t.organization_id=public.current_org() and public.can_manage_org()
))
with check (exists(
  select 1 from public.teams t
  join public.profiles p on p.id=profile_id
  where t.id=team_id and t.organization_id=public.current_org()
    and p.organization_id=t.organization_id and public.can_manage_org()
));

drop policy if exists "course managers create" on public.courses;
create policy "course managers create" on public.courses for insert
with check (
  organization_id=public.current_org() and created_by=auth.uid()
  and (public.can_manage_org() or (public.current_role()='trainer' and instructor_id=auth.uid()))
  and (instructor_id is null or exists(select 1 from public.profiles p where p.id=instructor_id and p.organization_id=public.current_org()))
);
drop policy if exists "course managers update" on public.courses;
create policy "course managers update" on public.courses for update
using (organization_id=public.current_org() and (public.can_manage_org() or (public.current_role()='trainer' and instructor_id=auth.uid())))
with check (
  organization_id=public.current_org()
  and (public.can_manage_org() or (public.current_role()='trainer' and instructor_id=auth.uid()))
  and (instructor_id is null or exists(select 1 from public.profiles p where p.id=instructor_id and p.organization_id=public.current_org()))
);

drop policy if exists "course managers manage modules" on public.course_modules;
create policy "course managers manage modules" on public.course_modules for all
using (public.can_manage_specific_course(course_id))
with check (public.can_manage_specific_course(course_id));

drop policy if exists "quiz managers manage" on public.quizzes;
create policy "quiz managers manage" on public.quizzes for all
using (exists(select 1 from public.course_modules m where m.id=module_id and public.can_manage_specific_course(m.course_id)))
with check (exists(select 1 from public.course_modules m where m.id=module_id and public.can_manage_specific_course(m.course_id)));

drop policy if exists "quiz managers manage questions" on public.quiz_questions;
create policy "quiz managers manage questions" on public.quiz_questions for all
using (exists(select 1 from public.quizzes z join public.course_modules m on m.id=z.module_id where z.id=quiz_id and public.can_manage_specific_course(m.course_id)))
with check (exists(select 1 from public.quizzes z join public.course_modules m on m.id=z.module_id where z.id=quiz_id and public.can_manage_specific_course(m.course_id)));

create policy "learners read own module progress" on public.module_progress for select
using (exists(select 1 from public.enrollments e where e.id=enrollment_id and (e.learner_id=auth.uid() or (e.organization_id=public.current_org() and public.can_manage_org()) or (public.current_role()='department_manager' and exists(select 1 from public.profiles p where p.id=e.learner_id and p.department_id=public.current_department())))));

drop policy if exists "questions visible to enrolled org" on public.quiz_questions;
create policy "questions visible to enrolled learners and course managers" on public.quiz_questions for select
using (exists(
  select 1 from public.quizzes z
  join public.course_modules m on m.id=z.module_id
  join public.courses c on c.id=m.course_id
  where z.id=quiz_id and c.organization_id=public.current_org()
    and (public.can_manage_org() or (public.current_role()='trainer' and c.instructor_id=auth.uid()) or exists(
      select 1 from public.enrollments e where e.course_id=c.id and e.learner_id=auth.uid()
    ))
));

create policy "learners and managers read own quiz attempts" on public.quiz_attempts for select
using (exists(select 1 from public.enrollments e where e.id=enrollment_id and (
  e.learner_id=auth.uid()
  or (e.organization_id=public.current_org() and public.can_manage_org())
  or (public.current_role()='department_manager' and exists(select 1 from public.profiles p where p.id=e.learner_id and p.department_id=public.current_department()))
  or (public.current_role()='trainer' and exists(select 1 from public.courses c where c.id=e.course_id and c.instructor_id=auth.uid()))
)));

create or replace view public.learner_quiz_questions as
select q.id, q.quiz_id, q.prompt, q.kind, q.options, q.points, q.position
from public.quiz_questions q
join public.quizzes z on z.id = q.quiz_id
join public.course_modules m on m.id = z.module_id
join public.courses c on c.id = m.course_id
where c.organization_id = public.current_org()
  and (
    public.can_manage_specific_course(c.id)
    or exists (
      select 1 from public.enrollments e
      where e.course_id = c.id and e.learner_id = auth.uid()
    )
  );
grant select on public.learner_quiz_questions to authenticated;

create or replace function public.publish_course_assignment(
  p_course_id uuid,
  p_title text,
  p_is_mandatory boolean,
  p_allow_self_unenroll boolean,
  p_due_at timestamptz,
  p_targets jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  actor public.profiles%rowtype;
  course_row public.courses%rowtype;
  assignment_id uuid;
  target jsonb;
  target_uuid uuid;
  learner_ids uuid[] := '{}';
  learner_id uuid;
  inserted_count integer := 0;
begin
  select * into actor from public.profiles where id = auth.uid() and is_active = true;
  if actor.id is null or not public.can_manage_org() then
    raise exception 'Not authorized to publish course assignments';
  end if;
  if actor.organization_id is null then
    raise exception 'Your account is not attached to an organization';
  end if;
  select * into course_row from public.courses
  where id = p_course_id and organization_id = actor.organization_id and status = 'published';
  if course_row.id is null then
    raise exception 'Select a published course from your organization';
  end if;
  if p_targets is null or jsonb_typeof(p_targets) <> 'array' or jsonb_array_length(p_targets) = 0 then
    raise exception 'Select at least one audience target';
  end if;
  if p_due_at is not null and p_due_at <= now() then
    raise exception 'The deadline must be in the future';
  end if;

  insert into public.course_assignments (
    organization_id, course_id, created_by, title, is_mandatory,
    allow_self_unenroll, due_at, published_at, status
  ) values (
    actor.organization_id, p_course_id, actor.id, nullif(trim(p_title), ''),
    coalesce(p_is_mandatory, true), coalesce(p_allow_self_unenroll, false),
    p_due_at, now(), 'active'
  ) returning id into assignment_id;

  for target in select value from jsonb_array_elements(p_targets)
  loop
    target_uuid := (target->>'id')::uuid;
    if target->>'type' = 'department' then
      if not exists(select 1 from public.departments d where d.id=target_uuid and d.organization_id=actor.organization_id) then
        raise exception 'Invalid department audience';
      end if;
      insert into public.assignment_targets(assignment_id,target_type,target_id)
      values(assignment_id,'department',target_uuid);
      select coalesce(array_agg(p.id), '{}') into learner_ids
      from public.profiles p
      where p.organization_id=actor.organization_id and p.department_id=target_uuid
        and p.is_active and p.role='learner';
    elsif target->>'type' = 'team' then
      if not exists(select 1 from public.teams t where t.id=target_uuid and t.organization_id=actor.organization_id) then
        raise exception 'Invalid team audience';
      end if;
      insert into public.assignment_targets(assignment_id,target_type,target_id)
      values(assignment_id,'team',target_uuid);
      select coalesce(array_agg(p.id), '{}') into learner_ids
      from public.team_members tm join public.profiles p on p.id=tm.profile_id
      where tm.team_id=target_uuid and p.organization_id=actor.organization_id
        and p.is_active and p.role='learner';
    elsif target->>'type' = 'individual' then
      if not exists(select 1 from public.profiles p where p.id=target_uuid and p.organization_id=actor.organization_id and p.is_active and p.role='learner') then
        raise exception 'Invalid individual learner audience';
      end if;
      insert into public.assignment_targets(assignment_id,target_type,target_id)
      values(assignment_id,'individual',target_uuid);
      learner_ids := array[target_uuid];
    else
      raise exception 'Unsupported audience target type';
    end if;

    foreach learner_id in array learner_ids loop
      insert into public.enrollments(
        organization_id, assignment_id, course_id, learner_id, due_at
      ) values (
        actor.organization_id, assignment_id, p_course_id, learner_id, p_due_at
      ) on conflict (assignment_id, learner_id) do nothing;
      if found then
        inserted_count := inserted_count + 1;
        insert into public.notifications(organization_id,recipient_id,title,body,action_url)
        values(actor.organization_id,learner_id,'New course assigned',
          'You have been assigned ' || course_row.title ||
          case when p_due_at is not null then '. Complete it by ' || to_char(p_due_at at time zone 'UTC','YYYY-MM-DD') else '.' end,
          '/courses');
      end if;
    end loop;
  end loop;

  if inserted_count = 0 then
    raise exception 'The selected audience contains no eligible learners';
  end if;

  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(actor.organization_id,actor.id,'course_assignment_published','course_assignment',assignment_id,
    jsonb_build_object('course_id',p_course_id,'enrollments_created',inserted_count,'mandatory',p_is_mandatory));

  return jsonb_build_object('assignment_id',assignment_id,'enrollments_created',inserted_count);
end;
$$;
grant execute on function public.publish_course_assignment(uuid,text,boolean,boolean,timestamptz,jsonb) to authenticated;

create or replace function public.complete_learning_module(
  p_enrollment_id uuid,
  p_module_id uuid,
  p_position_seconds integer default 0
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e public.enrollments%rowtype;
  m public.course_modules%rowtype;
  required_count integer;
  completed_count integer;
  pct integer;
  cert_code text;
begin
  select * into e from public.enrollments
  where id=p_enrollment_id and learner_id=auth.uid() and status <> 'waived';
  if e.id is null then raise exception 'Enrollment not found'; end if;
  select * into m from public.course_modules
  where id=p_module_id and course_id=e.course_id;
  if m.id is null then raise exception 'Module does not belong to this course'; end if;
  if m.kind='quiz' then raise exception 'Quiz modules must be completed by submitting the assessment'; end if;

  insert into public.module_progress(enrollment_id,module_id,completed_at,last_position_seconds,updated_at)
  values(e.id,m.id,now(),greatest(coalesce(p_position_seconds,0),0),now())
  on conflict(enrollment_id,module_id) do update
    set completed_at=coalesce(public.module_progress.completed_at,now()),
        last_position_seconds=greatest(excluded.last_position_seconds,public.module_progress.last_position_seconds),
        updated_at=now();

  select count(*) into required_count from public.course_modules where course_id=e.course_id and is_required;
  select count(*) into completed_count from public.module_progress mp
    join public.course_modules cm on cm.id=mp.module_id
    where mp.enrollment_id=e.id and cm.is_required and mp.completed_at is not null;
  pct := case when required_count=0 then 100 else floor(completed_count*100.0/required_count)::integer end;

  update public.enrollments set progress_percent=pct,
    status=case when pct=100 then 'completed'::public.enrollment_status else 'in_progress'::public.enrollment_status end,
    started_at=coalesce(started_at,now()),
    completed_at=case when pct=100 then coalesce(completed_at,now()) else null end
  where id=e.id;

  if pct=100 then
    insert into public.certificates(organization_id,enrollment_id,learner_id,course_id)
    select e.organization_id,e.id,e.learner_id,e.course_id
    where exists(select 1 from public.courses c where c.id=e.course_id and c.certificate_enabled)
    on conflict(enrollment_id) do nothing
    returning verification_code into cert_code;
    insert into public.notifications(organization_id,recipient_id,title,body,action_url)
    values(e.organization_id,e.learner_id,'Course completed','You have completed your course. Your certificate is ready.','/certificates');
  end if;
  return jsonb_build_object('progress_percent',pct,'completed',pct=100,'certificate_code',cert_code);
end;
$$;
grant execute on function public.complete_learning_module(uuid,uuid,integer) to authenticated;

create or replace function public.submit_quiz_attempt(
  p_enrollment_id uuid,
  p_quiz_id uuid,
  p_answers jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e public.enrollments%rowtype;
  q public.quizzes%rowtype;
  question_count integer;
  total_points integer;
  earned_points integer;
  attempt_no integer;
  score numeric(5,2);
  did_pass boolean;
  v_module_id uuid;
  required_count integer;
  completed_count integer;
  pct integer;
  cert_code text;
begin
  select * into e from public.enrollments
  where id=p_enrollment_id and learner_id=auth.uid() and status <> 'waived';
  if e.id is null then raise exception 'Enrollment not found'; end if;
  select z.* into q from public.quizzes z
    join public.course_modules m on m.id=z.module_id
  where z.id=p_quiz_id and m.course_id=e.course_id;
  if q.id is null then raise exception 'Assessment not found in this course'; end if;
  select count(*),coalesce(sum(points),0) into question_count,total_points
  from public.quiz_questions where quiz_id=p_quiz_id;
  if question_count=0 or total_points=0 then raise exception 'This assessment has no questions'; end if;
  select coalesce(max(attempt_number),0)+1 into attempt_no
  from public.quiz_attempts where enrollment_id=e.id and quiz_id=p_quiz_id;
  if q.max_attempts is not null and attempt_no>q.max_attempts then raise exception 'No attempts remaining'; end if;

  select coalesce(sum(points),0) into earned_points
  from public.quiz_questions
  where quiz_id=p_quiz_id
    and (p_answers->id::text) = correct_answers;
  score := round(earned_points*100.0/total_points,2);
  did_pass := score >= (select c.passing_score from public.courses c where c.id=e.course_id);

  insert into public.quiz_attempts(enrollment_id,quiz_id,attempt_number,answers,score_percent,passed,submitted_at)
  values(e.id,p_quiz_id,attempt_no,coalesce(p_answers,'{}'::jsonb),score,did_pass,now());
  select z.module_id into v_module_id from public.quizzes z where z.id=p_quiz_id;

  if did_pass then
    insert into public.module_progress(enrollment_id,module_id,completed_at,updated_at)
    values(e.id,v_module_id,now(),now())
    on conflict(enrollment_id,module_id) do update
      set completed_at=coalesce(public.module_progress.completed_at,now()),updated_at=now();
  end if;

  select count(*) into required_count from public.course_modules where course_id=e.course_id and is_required;
  select count(*) into completed_count from public.module_progress mp
    join public.course_modules cm on cm.id=mp.module_id
    where mp.enrollment_id=e.id and cm.is_required and mp.completed_at is not null;
  pct := case when required_count=0 then 100 else floor(completed_count*100.0/required_count)::integer end;
  update public.enrollments set progress_percent=pct,
    status=case when pct=100 then 'completed'::public.enrollment_status else 'in_progress'::public.enrollment_status end,
    started_at=coalesce(started_at,now()),
    completed_at=case when pct=100 then coalesce(completed_at,now()) else null end
  where id=e.id;

  if pct=100 then
    insert into public.certificates(organization_id,enrollment_id,learner_id,course_id)
    select e.organization_id,e.id,e.learner_id,e.course_id
    where exists(select 1 from public.courses c where c.id=e.course_id and c.certificate_enabled)
    on conflict(enrollment_id) do nothing
    returning verification_code into cert_code;
  end if;

  insert into public.notifications(organization_id,recipient_id,title,body,action_url)
  values(e.organization_id,e.learner_id,
    case when did_pass then 'Assessment passed' else 'Assessment results are ready' end,
    'You scored ' || score::text || '%. ' || case when did_pass then 'Well done.' else 'Review the material and try again if attempts remain.' end,
    '/courses');
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,metadata)
  values(e.organization_id,e.learner_id,'quiz_attempt_submitted','quiz_attempt',null,
    jsonb_build_object('quiz_id',p_quiz_id,'score',score,'passed',did_pass,'attempt',attempt_no));

  return jsonb_build_object('attempt_number',attempt_no,'score_percent',score,'passed',did_pass,
    'progress_percent',pct,'course_completed',pct=100,'certificate_code',cert_code);
end;
$$;
grant execute on function public.submit_quiz_attempt(uuid,uuid,jsonb) to authenticated;
