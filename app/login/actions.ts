'use server';

import { createAdminClient } from '@/lib/supabase/admin';

type RosterAccount = {
  accountType: 'employee' | 'trainer';
  code: string;
  id: number;
  roleId: number | null;
  roleName: string | null;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const exactIlikePattern = (email: string) => email.replace(/[\\%_]/g, '\\$&');

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function matchesEmployeeCode(password: string, code: string) {
  const cleanCode = code.trim();
  return cleanCode.length > 0 && (password === cleanCode || password.toLowerCase() === `ctnp-${cleanCode}`.toLowerCase());
}

async function findEmployee(admin: NonNullable<ReturnType<typeof createAdminClient>>, email: string) {
  const emailPattern = exactIlikePattern(email);
  const [employeeEmailRows, companyEmailRows] = await Promise.all([
    admin.from('employees').select('id, employee_code, status_id, role_id').ilike('employee_email', emailPattern),
    admin.from('employees').select('id, employee_code, status_id, role_id').ilike('company_email', emailPattern),
  ]);
  if (employeeEmailRows.error || companyEmailRows.error) return { error: true as const };

  const employees = new Map<number, { id: number; employee_code: string; status_id: number; role_id: number | null }>();
  for (const employee of [...(employeeEmailRows.data ?? []), ...(companyEmailRows.data ?? [])]) {
    employees.set(employee.id, employee);
  }
  if (employees.size !== 1) return { account: null, error: false as const };

  const employee = Array.from(employees.values())[0];
  const { data: status, error: statusError } = await admin.from('statuses').select('status_name').eq('status_id', employee.status_id).maybeSingle();
  if (statusError) return { error: true as const };
  if (!['active', 'on leave', 'lateral'].includes((status?.status_name ?? '').trim().toLowerCase())) {
    return { account: null, error: false as const };
  }

  let roleName: string | null = null;
  if (employee.role_id !== null) {
    const { data: role, error: roleError } = await admin.from('roles').select('role_name').eq('role_id', employee.role_id).maybeSingle();
    if (roleError) return { error: true as const };
    roleName = role?.role_name ?? null;
  }

  if (!roleName) return { account: null, error: false as const };
  return {
    account: {
      accountType: 'employee' as const,
      code: employee.employee_code,
      id: employee.id,
      roleId: employee.role_id,
      roleName,
    },
    error: false as const,
  };
}

async function findTrainer(admin: NonNullable<ReturnType<typeof createAdminClient>>, email: string) {
  const emailPattern = exactIlikePattern(email);
  const [gmailRows, thunderbirdRows] = await Promise.all([
    admin.from('trainer_accounts').select('trainer_id').ilike('gmail_account', emailPattern),
    admin.from('trainer_accounts').select('trainer_id').ilike('thunderbird_account', emailPattern),
  ]);
  if (gmailRows.error || thunderbirdRows.error) return { error: true as const };

  const trainerIds = Array.from(new Set([...(gmailRows.data ?? []), ...(thunderbirdRows.data ?? [])].map(row => row.trainer_id)));
  if (!trainerIds.length) return { account: null, error: false as const };

  const { data: trainers, error } = await admin.from('trainers').select('trainer_id, employee_num, status').in('trainer_id', trainerIds);
  if (error) return { error: true as const };
  const activeTrainers = (trainers ?? []).filter(trainer => trainer.status?.trim().toLowerCase() === 'active');
  if (activeTrainers.length !== 1 || !activeTrainers[0].employee_num) return { account: null, error: false as const };

  return {
    account: {
      accountType: 'trainer' as const,
      code: activeTrainers[0].employee_num,
      id: activeTrainers[0].trainer_id,
      roleId: null,
      roleName: 'Trainer',
    },
    error: false as const,
  };
}

async function findAuthUser(admin: NonNullable<ReturnType<typeof createAdminClient>>, email: string) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return { error: true as const, user: null };
    const user = data.users.find(candidate => normalizeEmail(candidate.email ?? '') === email) ?? null;
    if (user) return { error: false as const, user };
    if (data.users.length < 1000) return { error: false as const, user: null };
  }
  return { error: true as const, user: null };
}

export async function provisionEmployeeLogin(emailInput: string, enteredPassword: string) {
  const email = normalizeEmail(emailInput);
  if (!isEmail(email) || typeof enteredPassword !== 'string' || enteredPassword.length > 128) {
    return { ok: false as const, reason: 'not_eligible' as const };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false as const, reason: 'unavailable' as const };

  const employeeResult = await findEmployee(admin, email);
  if (employeeResult.error) return { ok: false as const, reason: 'unavailable' as const };

  let account: RosterAccount | null = employeeResult.account;
  if (!account) {
    const trainerResult = await findTrainer(admin, email);
    if (trainerResult.error) return { ok: false as const, reason: 'unavailable' as const };
    account = trainerResult.account;
  }

  if (!account || !matchesEmployeeCode(enteredPassword, account.code)) {
    return { ok: false as const, reason: 'not_eligible' as const };
  }

  const canonicalPassword = `CTNP-${account.code.trim()}`;
  const authUserResult = await findAuthUser(admin, email);
  if (authUserResult.error) return { ok: false as const, reason: 'unavailable' as const };

  const appMetadata = {
    ...(authUserResult.user?.app_metadata ?? {}),
    portal_account_type: account.accountType,
    portal_record_id: account.id,
    portal_role_id: account.roleId,
    portal_role_name: account.roleName,
  };

  if (authUserResult.user) {
    const { error } = await admin.auth.admin.updateUserById(authUserResult.user.id, {
      password: canonicalPassword,
      email_confirm: true,
      app_metadata: appMetadata,
    });
    if (error) return { ok: false as const, reason: 'unavailable' as const };
  } else {
    const { error } = await admin.auth.admin.createUser({
      email,
      password: canonicalPassword,
      email_confirm: true,
      app_metadata: appMetadata,
    });
    if (error) return { ok: false as const, reason: 'unavailable' as const };
  }

  return { ok: true as const, password: canonicalPassword };
}
