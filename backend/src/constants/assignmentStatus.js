export const ASSIGNMENT_STATUS = Object.freeze({
  DRAFT: "draft", 
  PUBLISHED: "published", 
  CLOSED: "closed", 
});

export const VALID_ASSIGNMENT_STATUSES = Object.values(ASSIGNMENT_STATUS);

export const SUBMISSION_STATUS = Object.freeze({
  SUBMITTED: "submitted", 
  GRADED: "graded", 
});