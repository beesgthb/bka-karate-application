import { supabase } from "./supabaseClient";

/* ==============================================================
   Loads everything and reshapes it into the SAME `data` object
   shape the original app already uses (data.students, data.dojos,
   data.attendance as `${date}__${batchId}` map, etc.) so most of
   the existing screen components need minimal changes.
================================================================== */
export async function fetchAllData() {
  const [
    assoc, dojos, coaches, batches, seniorStudents, students,
    payments, paymentRequests, attendanceRows, beltHistory,
    certificates, announcements, resources,
  ] = await Promise.all([
    supabase.from("association_settings").select("*").eq("id", 1).single(),
    supabase.from("dojos").select("*"),
    supabase.from("coaches").select("*"),
    supabase.from("batches").select("*"),
    supabase.from("senior_students").select("*"),
    supabase.from("students").select("*"),
    supabase.from("payments").select("*"),
    supabase.from("payment_requests").select("*"),
    supabase.from("attendance").select("*"),
    supabase.from("belt_history").select("*"),
    supabase.from("certificates").select("*"),
    supabase.from("announcements").select("*").order("date", { ascending: false }),
    supabase.from("resources").select("*"),
  ]);

  for (const r of [assoc, dojos, coaches, batches, seniorStudents, students, payments,
    paymentRequests, attendanceRows, beltHistory, certificates, announcements, resources]) {
    if (r.error) throw new Error(r.error.message);
  }

  // attendance: rows -> `${date}__${batchId}`: { studentId: status }
  const attendance = {};
  for (const row of attendanceRows.data) {
    const key = `${row.date}__${row.batch_id}`;
    if (!attendance[key]) attendance[key] = {};
    attendance[key][row.student_id] = row.status;
  }

  return {
    association: {
      name: assoc.data.name,
      feeAmount: assoc.data.fee_amount,
      officeMobile: assoc.data.office_mobile,
      email: assoc.data.email,
      upiId: assoc.data.upi_id,
    },
    dojos: dojos.data.map((d) => ({
      id: d.id, name: d.name, address: d.address, contact: d.contact, headCoach: d.head_coach_id,
    })),
    coaches: coaches.data.map((c) => ({
      id: c.id, authUserId: c.auth_user_id, name: c.name, mobile: c.mobile, email: c.email,
      dojo: c.dojo_id, status: c.status,
    })),
    seniorStudents: seniorStudents.data.map((s) => ({
      id: s.id, authUserId: s.auth_user_id, name: s.name, mobile: s.mobile, batch: s.batch_id,
      dojo: s.dojo_id, permissions: s.permissions, status: s.status,
    })),
    batches: batches.data.map((b) => ({
      id: b.id, name: b.name, dojo: b.dojo_id, coach: b.coach_id, days: b.days,
      start: b.start_time, end: b.end_time, ageGroup: b.age_group, level: b.level, maxStudents: b.max_students,
    })),
    students: students.data.map((s) => ({
      id: s.id, authUserId: s.auth_user_id, name: s.name, dob: s.dob, gender: s.gender, mobile: s.mobile,
      email: s.email, address: s.address, guardian: s.guardian, emergency: s.emergency_contact,
      dojo: s.dojo_id, batch: s.batch_id, coach: s.coach_id, joined: s.joined_date, belt: s.belt,
      status: s.status, addedBy: s.added_by,
    })),
    payments: payments.data.map((p) => ({
      id: p.id, studentId: p.student_id, month: p.month, amount: p.amount, date: p.payment_date,
      mode: p.mode, remarks: p.remarks,
    })),
    paymentRequests: paymentRequests.data.map((r) => ({
      id: r.id, studentId: r.student_id, month: r.month, amount: r.amount, status: r.status,
      requestedAt: r.requested_at,
    })),
    attendance,
    beltHistory: beltHistory.data.map((h) => ({
      studentId: h.student_id, from: h.from_belt, to: h.to_belt, date: h.exam_date,
      examiner: h.examiner, result: h.result, remarks: h.remarks,
    })),
    certificates: certificates.data.map((c) => ({
      id: c.id, certificateNo: c.certificate_no, studentId: c.student_id, belt: c.belt,
      session: c.session, issueDate: c.issue_date, examiner: c.examiner, remarks: c.remarks,
    })),
    announcements: announcements.data.map((a) => ({
      id: a.id, audience: a.audience, title: a.title, body: a.body, date: a.date,
    })),
    resources: resources.data.map((r) => ({
      id: r.id, title: r.title, type: r.type, url: r.url, addedBy: r.added_by,
    })),
  };
}

/* ============================== STUDENTS ============================== */
export async function addStudent(student) {
  const { data, error } = await supabase.from("students").insert({
    id: student.id, name: student.name, dob: student.dob, gender: student.gender,
    mobile: student.mobile, email: student.email, address: student.address,
    guardian: student.guardian, emergency_contact: student.emergency, dojo_id: student.dojo,
    batch_id: student.batch, coach_id: student.coach, joined_date: student.joined,
    belt: student.belt, added_by: student.addedBy,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateStudent(id, patch) {
  const dbPatch = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.mobile !== undefined) dbPatch.mobile = patch.mobile;
  if (patch.email !== undefined) dbPatch.email = patch.email;
  if (patch.address !== undefined) dbPatch.address = patch.address;
  if (patch.guardian !== undefined) dbPatch.guardian = patch.guardian;
  if (patch.emergency !== undefined) dbPatch.emergency_contact = patch.emergency;
  if (patch.dojo !== undefined) dbPatch.dojo_id = patch.dojo;
  if (patch.batch !== undefined) dbPatch.batch_id = patch.batch;
  if (patch.coach !== undefined) dbPatch.coach_id = patch.coach;
  if (patch.belt !== undefined) dbPatch.belt = patch.belt;
  if (patch.status !== undefined) dbPatch.status = patch.status;

  const { data, error } = await supabase.from("students").update(dbPatch).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

/** Change a student's unique ID. Every child table cascades automatically via FK. */
export async function changeStudentId(oldId, newId) {
  const { error } = await supabase.from("students").update({ id: newId }).eq("id", oldId);
  if (error) throw new Error(error.message);
}

export async function deactivateStudent(id) {
  return updateStudent(id, { status: "Inactive" });
}

/* ============================== FEES / PAYMENTS ============================== */
export async function markFeePaid({ studentId, month, amount, date, mode, remarks, recordedBy }) {
  const { data, error } = await supabase.from("payments").upsert({
    student_id: studentId, month, amount, payment_date: date, mode, remarks, recorded_by: recordedBy,
  }, { onConflict: "student_id,month" }).select().single();
  if (error) throw new Error(error.message);
  // clear any pending request for that month once paid
  await supabase.from("payment_requests").delete().eq("student_id", studentId).eq("month", month);
  return data;
}

export async function requestFeePayment({ studentId, month, amount }) {
  const { data, error } = await supabase.from("payment_requests")
    .insert({ student_id: studentId, month, amount }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

/* ============================== ATTENDANCE ============================== */
export async function markAttendance({ date, batchId, studentId, status, markedBy }) {
  const { data, error } = await supabase.from("attendance").upsert({
    date, batch_id: batchId, student_id: studentId, status, marked_by: markedBy,
  }, { onConflict: "student_id,date,batch_id" }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

/* ============================== BELTS ============================== */
export async function recordBeltPromotion({ studentId, from, to, examDate, examiner, result, remarks }) {
  const { error: histErr } = await supabase.from("belt_history").insert({
    student_id: studentId, from_belt: from, to_belt: to, exam_date: examDate,
    examiner, result, remarks,
  });
  if (histErr) throw new Error(histErr.message);

  if (result === "Pass") {
    const { error } = await supabase.from("students").update({ belt: to }).eq("id", studentId);
    if (error) throw new Error(error.message);
  }
}

/* ============================== CERTIFICATES ============================== */
export async function addCertificate({ certificateNo, studentId, belt, session, issueDate, examiner, remarks }) {
  const { data, error } = await supabase.from("certificates").insert({
    certificate_no: certificateNo, student_id: studentId, belt, session,
    issue_date: issueDate, examiner, remarks,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

/* ============================== ANNOUNCEMENTS ============================== */
export async function postAnnouncement({ audience, title, body, postedBy }) {
  const { data, error } = await supabase.from("announcements")
    .insert({ audience, title, body, posted_by: postedBy }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

/* ============================== COACHES / DOJOS / BATCHES / SENIORS ============================== */
export async function addCoach(coach) {
  const { data, error } = await supabase.from("coaches").insert({
    id: coach.id, name: coach.name, mobile: coach.mobile, email: coach.email, dojo_id: coach.dojo,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function addDojo(dojo) {
  const { data, error } = await supabase.from("dojos").insert({
    id: dojo.id, name: dojo.name, address: dojo.address, contact: dojo.contact,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function addBatch(batch) {
  const { data, error } = await supabase.from("batches").insert({
    id: batch.id, name: batch.name, dojo_id: batch.dojo, coach_id: batch.coach, days: batch.days,
    start_time: batch.start, end_time: batch.end, age_group: batch.ageGroup, level: batch.level,
    max_students: batch.maxStudents,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function addSeniorStudent(senior) {
  const { data, error } = await supabase.from("senior_students").insert({
    id: senior.id, name: senior.name, mobile: senior.mobile, dojo_id: senior.dojo,
    batch_id: senior.batch, permissions: senior.permissions,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

/* ============================== REAL-TIME SYNC (optional) ============================== */
/**
 * Subscribes to live changes on the given tables and calls onChange() so the
 * caller can re-run fetchAllData(). Returns an unsubscribe function.
 */
export function subscribeToChanges(tables, onChange) {
  const channel = supabase.channel("club-changes");
  tables.forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
  });
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
