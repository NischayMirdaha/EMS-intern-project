export const sanitizeStudentProfile = (payload) => {
  if (!payload) return null;

  const user = payload.user ?? {};
  const profile = payload.profile ?? {};

  return {
    id: profile.id ?? null,
    userId: user.id ?? null,
    username: user.username ?? null,
    email: user.email ?? null,
    role: user.role ?? null,
    admissionNumber: profile.admission_number ?? null,
    enrollmentYear: profile.enrollment_year ?? null,
    major: profile.major ?? null,
    dateOfBirth: profile.date_of_birth ? profile.date_of_birth.toISOString().split("T")[0] : null,
    gender: profile.gender ?? null,
    address: profile.address ?? null,
    guardianName: profile.guardian_name ?? null,
    guardianPhone: profile.guardian_phone ?? null,
    status: profile.status ?? null,
    isAlumni: profile.is_alumni ?? false,
    createdAt: profile.created_at ?? null,
    updatedAt: profile.updated_at ?? null,
  };
};

export const sanitizeStudentDocument = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    studentId: row.student_id,
    documentType: row.document_type,
    title: row.title,
    description: row.description,
    fileUrl: row.file_url,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  };
};

export const sanitizeAcademicRecord = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    studentId: row.student_id,
    year: row.year,
    term: row.term,
    courseCode: row.course_code,
    courseName: row.course_name,
    grade: row.grade,
    remarks: row.remarks,
    recordedAt: row.recorded_at,
  };
};

export const sanitizeHealthRecord = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    studentId: row.student_id,
    recordDate: row.record_date ? row.record_date.toISOString().split("T")[0] : null,
    healthCondition: row.health_condition,
    treatment: row.treatment,
    notes: row.notes,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  };
};

export const sanitizeDisciplinaryRecord = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    studentId: row.student_id,
    incidentDate: row.incident_date ? row.incident_date.toISOString().split("T")[0] : null,
    offense: row.offense,
    actionTaken: row.action_taken,
    notes: row.notes,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  };
};

export const sanitizeScholarship = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    studentId: row.student_id,
    scholarshipName: row.scholarship_name,
    amount: row.amount,
    awardDate: row.award_date ? row.award_date.toISOString().split("T")[0] : null,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  };
};

export const sanitizeAlumniProfile = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    studentId: row.student_id,
    graduationYear: row.graduation_year,
    currentEmployer: row.current_employer,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};
