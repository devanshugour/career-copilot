export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  jobs: "/jobs",
  jobDetail: (id: string) => `/jobs/${id}`,
  savedJobs: "/jobs/saved",
  resume: "/resume",
  resumeAnalyze: "/resume/analyze",
  career: "/career",
  interview: "/interview",
  interviewSession: (id: string) => `/interview/${id}`,
  profile: "/profile",
  admin: "/admin",
  adminJobs: "/admin/jobs",
  adminUsers: "/admin/users",
  adminCompanies: "/admin/companies",
  adminSkills: "/admin/skills",
} as const;

export const PUBLIC_ROUTES = ["/", "/login", "/register"];
export const ADMIN_ROUTE_PREFIX = "/admin";
