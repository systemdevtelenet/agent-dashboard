create or replace function public.get_my_portal_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from auth.users as auth_user
    where auth_user.id = (select auth.uid())
      and auth_user.email_confirmed_at is not null
      and (
        (
          (
            select count(*)
            from public.employees as employee
            where nullif(lower(btrim(auth_user.email)), '') is not null
              and (
                lower(btrim(employee.employee_email)) = lower(btrim(auth_user.email))
                or lower(btrim(employee.company_email)) = lower(btrim(auth_user.email))
              )
          ) = 1
          and exists (
            select 1
            from public.employees as employee
            join public.statuses as employee_status on employee_status.status_id = employee.status_id
            where (
                lower(btrim(employee.employee_email)) = lower(btrim(auth_user.email))
                or lower(btrim(employee.company_email)) = lower(btrim(auth_user.email))
              )
              and lower(btrim(employee_status.status_name)) in ('active', 'on leave', 'lateral')
          )
        )
        or (
          (
            select count(distinct trainer.trainer_id)
            from public.trainers as trainer
            join public.trainer_accounts as trainer_account on trainer_account.trainer_id = trainer.trainer_id
            where lower(btrim(trainer_account.gmail_account)) = lower(btrim(auth_user.email))
              or lower(btrim(trainer_account.thunderbird_account)) = lower(btrim(auth_user.email))
          ) = 1
          and exists (
            select 1
            from public.trainers as trainer
            join public.trainer_accounts as trainer_account on trainer_account.trainer_id = trainer.trainer_id
            where lower(btrim(trainer_account.gmail_account)) = lower(btrim(auth_user.email))
              or lower(btrim(trainer_account.thunderbird_account)) = lower(btrim(auth_user.email))
              and lower(btrim(trainer.status)) = 'active'
          )
        )
      )
  );
$function$;

revoke all on function public.get_my_portal_access() from public, anon;
grant execute on function public.get_my_portal_access() to authenticated;
