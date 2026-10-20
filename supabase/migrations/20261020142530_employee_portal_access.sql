create or replace function public.get_my_employee_portal_access()
returns table (employee_id bigint, employee_name text)
language sql
stable
security definer
set search_path = ''
as $function$
  select matched.id, matched.employee_name
  from auth.users as auth_user
  cross join lateral (
    select employee.id, employee.employee_name, employee.status_id
    from public.employees as employee
    where nullif(lower(btrim(auth_user.email)), '') is not null
      and (
        lower(btrim(employee.employee_email)) = lower(btrim(auth_user.email))
        or lower(btrim(employee.company_email)) = lower(btrim(auth_user.email))
      )
  ) as matched
  join public.statuses as employee_status
    on employee_status.status_id = matched.status_id
  where auth_user.id = (select auth.uid())
    and auth_user.email_confirmed_at is not null
    and lower(btrim(employee_status.status_name)) in ('active', 'on leave', 'lateral')
    and (
      select count(distinct employee.id)
      from public.employees as employee
      where nullif(lower(btrim(auth_user.email)), '') is not null
        and (
          lower(btrim(employee.employee_email)) = lower(btrim(auth_user.email))
          or lower(btrim(employee.company_email)) = lower(btrim(auth_user.email))
        )
    ) = 1;
$function$;

revoke all on function public.get_my_employee_portal_access() from public, anon;
grant execute on function public.get_my_employee_portal_access() to authenticated;
