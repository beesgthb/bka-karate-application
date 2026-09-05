import { supabase, ADMIN_MANAGE_USER_URL } from "./supabaseClient";

/** Resolve a username / mobile / email into the actual login email. */
async function resolveEmail(identifier) {
  const { data, error } = await supabase.rpc("email_for_identifier", { identifier });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No account found for that ID / mobile / email.");
  return data;
}

/** Fetch the profile (role + ref_id) for the currently signed-in user. */
export async function getCurrentProfile() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userData.user.id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/* ============================== ADMIN LOGIN (password + email OTP) ============================== */

/**
 * Step 1: verify the Admin's password, then email them a one-time code.
 * No session is created yet — it only checks the password is correct
 * and triggers Supabase's built-in email OTP.
 */
export async function adminLoginStep1({ identifier, password }) {
  const email = await resolveEmail(identifier);

  const { error: pwErr } = await supabase.auth.signInWithPassword({ email, password });
  if (pwErr) throw new Error("Incorrect password.");

  // Password confirmed — drop this session, we only finalize login after OTP.
  await supabase.auth.signOut();

  const { error: otpErr } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (otpErr) throw new Error("Could not send OTP: " + otpErr.message);

  return { email };
}

/** Step 2: verify the 6-digit code emailed to the Admin, which creates the real session. */
export async function adminLoginStep2({ email, code }) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) throw new Error("Invalid or expired code.");

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "Admin") {
    await supabase.auth.signOut();
    throw new Error("This account is not an Admin account.");
  }
  return { session: data.session, profile };
}

/* ============================== COACH / SENIOR STUDENT / STUDENT LOGIN ============================== */

/** Single-step password login — used for Coach, Senior Student, and Student. No OTP. */
export async function staffOrStudentLogin({ identifier, password, expectedRole }) {
  const email = await resolveEmail(identifier);

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Incorrect password.");

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== expectedRole) {
    await supabase.auth.signOut();
    throw new Error(`This account is not a ${expectedRole} account.`);
  }
  return { profile };
}

export async function logout() {
  await supabase.auth.signOut();
}

/* ============================== ADMIN: CREATE / RESET LOGINS FOR OTHERS ============================== */

async function callAdminManageUser(body) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Not signed in.");

  const res = await fetch(ADMIN_MANAGE_USER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

/**
 * Admin-only: create a login for a Coach / Senior Student / Student that was
 * already added to the students/coaches/senior_students table. Generates a
 * random password and returns it ONCE so the Admin can show/share it —
 * it is never stored anywhere in plain text.
 *
 * @param {"Coach"|"SeniorStudent"|"Student"} role
 * @param {string} refId - the coaches.id / senior_students.id / students.id
 * @param {string} name
 * @param {string} [mobile]
 * @param {string} [username] - defaults to refId if omitted
 */
export async function adminCreateLogin({ role, refId, name, mobile, username }) {
  return callAdminManageUser({ action: "create_user", role, ref_id: refId, name, mobile, username });
}

/** Admin-only: reset an existing user's password. Returns the new password once. */
export async function adminResetPassword(authUserId) {
  return callAdminManageUser({ action: "reset_password", auth_user_id: authUserId });
}

/** Admin-only: deactivate (ban: true) or reactivate (ban: false) a login. */
export async function adminSetUserActive(authUserId, active) {
  return callAdminManageUser({ action: "deactivate_user", auth_user_id: authUserId, ban: !active });
}
