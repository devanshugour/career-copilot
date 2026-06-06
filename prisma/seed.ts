import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const SKILLS = [
  "javascript", "typescript", "react", "next.js", "node.js", "express", "tailwind",
  "redux", "graphql", "rest", "java", "spring boot", "python", "django", "fastapi",
  "tensorflow", "pytorch", "sql", "postgres", "mongodb", "docker", "kubernetes",
  "aws", "terraform", "git", "ci/cd", "system design", "microservices", "kafka",
  "go", "selenium", "playwright", "jest", "tdd", "data structures", "algorithms",
  "agile", "stakeholder management", "product strategy", "linux",
];

const COMPANIES = [
  { name: "Lumen Labs", industry: "AI Infra", hqLocation: "Bengaluru, IN", size: "120-250" },
  { name: "Hyperloop Cloud", industry: "Cloud", hqLocation: "Pune, IN", size: "500-1000" },
  { name: "Polaris Fintech", industry: "Fintech", hqLocation: "Mumbai, IN", size: "1000-5000" },
  { name: "Northwind Health", industry: "Health Tech", hqLocation: "Bengaluru, IN", size: "250-500" },
  { name: "Zephyr Analytics", industry: "Data", hqLocation: "Hyderabad, IN", size: "120-250" },
  { name: "Atlas Robotics", industry: "Robotics", hqLocation: "Chennai, IN", size: "50-120" },
];

type Jb = {
  title: string;
  company: string;
  location: string;
  workMode: "REMOTE" | "HYBRID" | "ONSITE";
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  experienceLevel: "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD";
  experienceMin: number;
  experienceMax: number;
  salaryMin: number;
  salaryMax: number;
  description: string;
  responsibilities: string[];
  benefits: string[];
  skills: string[];
};

const JOBS: Jb[] = [
  {
    title: "Software Engineer",
    company: "Lumen Labs",
    location: "Bengaluru, IN",
    workMode: "HYBRID", jobType: "FULL_TIME", experienceLevel: "JUNIOR",
    experienceMin: 1, experienceMax: 3, salaryMin: 1200000, salaryMax: 1800000,
    description: "Join the platform team building developer tooling for our AI inference pipeline. You'll ship features across TypeScript, Node and Python services.",
    responsibilities: ["Build internal SDKs and CLIs", "Own service reliability", "Pair on RFCs"],
    benefits: ["Hybrid working", "Health insurance", "Annual learning budget"],
    skills: ["typescript", "node.js", "python", "postgres", "git"],
  },
  {
    title: "Full Stack Developer",
    company: "Hyperloop Cloud",
    location: "Pune, IN",
    workMode: "REMOTE", jobType: "FULL_TIME", experienceLevel: "MID",
    experienceMin: 3, experienceMax: 6, salaryMin: 2000000, salaryMax: 3000000,
    description: "Help us ship the next-gen cloud console. Stack: Next.js + Postgres + Go microservices. We move fast, ship daily, and own production.",
    responsibilities: ["Design and ship full-stack features", "Own one tier of the console", "Mentor juniors"],
    benefits: ["Fully remote", "Stock options", "Top-tier hardware"],
    skills: ["typescript", "next.js", "react", "node.js", "postgres", "docker", "aws"],
  },
  {
    title: "Java Developer",
    company: "Polaris Fintech",
    location: "Mumbai, IN",
    workMode: "ONSITE", jobType: "FULL_TIME", experienceLevel: "MID",
    experienceMin: 3, experienceMax: 7, salaryMin: 1800000, salaryMax: 2600000,
    description: "Build low-latency trading APIs and risk engines using Java 21, Spring Boot and Kafka.",
    responsibilities: ["Develop trading services", "Tune latency hotspots", "Participate in oncall"],
    benefits: ["Onsite cafeteria", "Bonus pool", "Insurance for family"],
    skills: ["java", "spring boot", "kafka", "postgres", "system design"],
  },
  {
    title: "React Developer",
    company: "Northwind Health",
    location: "Bengaluru, IN",
    workMode: "HYBRID", jobType: "FULL_TIME", experienceLevel: "JUNIOR",
    experienceMin: 1, experienceMax: 3, salaryMin: 1100000, salaryMax: 1600000,
    description: "Build clinician-facing UIs that simplify daily workflows. Stack: React 19, TypeScript, Tailwind.",
    responsibilities: ["Implement product designs pixel-perfectly", "Write reusable components", "Own a11y of your screens"],
    benefits: ["Hybrid working", "Wellness allowance", "Quarterly hack days"],
    skills: ["react", "typescript", "tailwind", "redux", "jest"],
  },
  {
    title: "DevOps Engineer",
    company: "Hyperloop Cloud",
    location: "Pune, IN",
    workMode: "REMOTE", jobType: "FULL_TIME", experienceLevel: "SENIOR",
    experienceMin: 5, experienceMax: 9, salaryMin: 2800000, salaryMax: 4200000,
    description: "Own our multi-region Kubernetes platform; drive cost, reliability, and developer experience.",
    responsibilities: ["Run K8s control plane", "Build IaC modules in Terraform", "Lead incident response"],
    benefits: ["Fully remote", "Stock options", "On-call comp"],
    skills: ["kubernetes", "docker", "terraform", "aws", "ci/cd", "linux"],
  },
  {
    title: "Data Analyst",
    company: "Zephyr Analytics",
    location: "Hyderabad, IN",
    workMode: "HYBRID", jobType: "FULL_TIME", experienceLevel: "JUNIOR",
    experienceMin: 1, experienceMax: 3, salaryMin: 900000, salaryMax: 1400000,
    description: "Partner with product to ship insights that drive growth.",
    responsibilities: ["Define KPIs", "Build dashboards", "A/B test rollouts"],
    benefits: ["Hybrid working", "Learning budget", "Cab reimbursement"],
    skills: ["sql", "python", "postgres", "agile"],
  },
  {
    title: "Product Manager",
    company: "Northwind Health",
    location: "Bengaluru, IN",
    workMode: "HYBRID", jobType: "FULL_TIME", experienceLevel: "SENIOR",
    experienceMin: 5, experienceMax: 9, salaryMin: 3000000, salaryMax: 4500000,
    description: "Own a clinical workflow product area end-to-end.",
    responsibilities: ["Set quarterly roadmap", "Run discovery", "Drive launch readiness"],
    benefits: ["Hybrid working", "Annual offsite", "ESOPs"],
    skills: ["product strategy", "stakeholder management", "agile"],
  },
  {
    title: "AI Engineer",
    company: "Lumen Labs",
    location: "Bengaluru, IN",
    workMode: "REMOTE", jobType: "FULL_TIME", experienceLevel: "SENIOR",
    experienceMin: 4, experienceMax: 8, salaryMin: 3000000, salaryMax: 5000000,
    description: "Productionize LLM features end-to-end: retrieval, evals, guardrails, fine-tuning.",
    responsibilities: ["Own eval framework", "Ship LLM features", "Mentor the AI guild"],
    benefits: ["Remote", "Conference travel", "GPU credits"],
    skills: ["python", "pytorch", "tensorflow", "system design", "aws", "docker"],
  },
  {
    title: "QA Engineer",
    company: "Atlas Robotics",
    location: "Chennai, IN",
    workMode: "ONSITE", jobType: "FULL_TIME", experienceLevel: "MID",
    experienceMin: 2, experienceMax: 5, salaryMin: 1200000, salaryMax: 1800000,
    description: "Build automated tests for robot fleet management software.",
    responsibilities: ["Author Playwright/Selenium tests", "Triage flaky tests", "Own release sign-off"],
    benefits: ["Onsite lab", "Insurance", "Quarterly hardware refresh"],
    skills: ["playwright", "selenium", "tdd", "typescript", "ci/cd"],
  },
  {
    title: "SDE-1",
    company: "Polaris Fintech",
    location: "Mumbai, IN",
    workMode: "HYBRID", jobType: "FULL_TIME", experienceLevel: "ENTRY",
    experienceMin: 0, experienceMax: 2, salaryMin: 1500000, salaryMax: 2200000,
    description: "Entry-level role on the payments platform team.",
    responsibilities: ["Ship features under mentorship", "Write tests", "Own bug fixes"],
    benefits: ["Hybrid working", "Joining bonus", "ESOP"],
    skills: ["java", "spring boot", "data structures", "algorithms", "git"],
  },
  {
    title: "SDE-2",
    company: "Hyperloop Cloud",
    location: "Pune, IN",
    workMode: "REMOTE", jobType: "FULL_TIME", experienceLevel: "MID",
    experienceMin: 3, experienceMax: 6, salaryMin: 2500000, salaryMax: 3800000,
    description: "Mid-level engineer on the cloud SDK team.",
    responsibilities: ["Own a service surface end-to-end", "Drive RFCs", "Mentor SDE-1s"],
    benefits: ["Fully remote", "Stock options", "Top-tier hardware"],
    skills: ["typescript", "node.js", "postgres", "system design", "aws"],
  },
  {
    title: "Backend Engineer (Go)",
    company: "Atlas Robotics",
    location: "Chennai, IN",
    workMode: "HYBRID", jobType: "FULL_TIME", experienceLevel: "MID",
    experienceMin: 3, experienceMax: 6, salaryMin: 2000000, salaryMax: 3200000,
    description: "Write the fleet orchestrator in Go. High-performance, low-latency systems.",
    responsibilities: ["Own a critical service", "Optimize hot paths", "Design APIs"],
    benefits: ["Hybrid", "Wellness program", "ESOP"],
    skills: ["go", "postgres", "docker", "linux", "system design"],
  },
];

async function main() {
  console.log("→ Seeding skills");
  for (const name of SKILLS) {
    await prisma.skill.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }

  console.log("→ Seeding companies");
  for (const c of COMPANIES) {
    await prisma.company.upsert({
      where: { slug: slugify(c.name) },
      update: {},
      create: { ...c, slug: slugify(c.name) },
    });
  }

  console.log("→ Seeding jobs");
  const skillsMap = new Map((await prisma.skill.findMany()).map((s) => [s.slug, s.id]));
  const companiesMap = new Map((await prisma.company.findMany()).map((c) => [c.slug, c.id]));

  for (const job of JOBS) {
    const slug = `${slugify(job.title)}-${slugify(job.company)}`;
    const companyId = companiesMap.get(slugify(job.company))!;
    const created = await prisma.job.upsert({
      where: { slug },
      update: {},
      create: {
        title: job.title,
        slug,
        companyId,
        location: job.location,
        workMode: job.workMode,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        experienceMin: job.experienceMin,
        experienceMax: job.experienceMax,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: "INR",
        description: job.description,
        responsibilities: job.responsibilities,
        benefits: job.benefits,
      },
    });
    for (const s of job.skills) {
      const skillId = skillsMap.get(slugify(s));
      if (!skillId) continue;
      await prisma.jobSkill.upsert({
        where: { jobId_skillId: { jobId: created.id, skillId } },
        update: {},
        create: { jobId: created.id, skillId, required: true },
      });
    }
  }

  console.log("→ Seeding admin user (admin@career.local / Admin@123)");
  await prisma.user.upsert({
    where: { email: "admin@career.local" },
    update: {},
    create: {
      email: "admin@career.local",
      name: "Career Admin",
      passwordHash: await bcrypt.hash("Admin@123", 10),
      role: "ADMIN",
    },
  });

  console.log("→ Seeding demo user (demo@career.local / Demo@123)");
  await prisma.user.upsert({
    where: { email: "demo@career.local" },
    update: {},
    create: {
      email: "demo@career.local",
      name: "Demo Candidate",
      passwordHash: await bcrypt.hash("Demo@123", 10),
      role: "USER",
    },
  });

  console.log("✔ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
