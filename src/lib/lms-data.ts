export type Course = {
  id: string;
  title: string;
  category: string;
  description: string;
  instructor: string;
  duration: string;
  progress: number;
  dueDate?: string;
  mandatory: boolean;
  thumbnail: string;
  modules: { id: string; title: string; type: "video" | "scorm" | "pdf" | "quiz"; duration: string; completed: boolean }[];
};

const cover = (hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 220'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='hsl(${hue},70%,55%)'/><stop offset='1' stop-color='hsl(${(hue + 40) % 360},70%,35%)'/></linearGradient></defs><rect width='400' height='220' fill='url(#g)'/><circle cx='320' cy='40' r='80' fill='white' opacity='0.08'/><circle cx='60' cy='200' r='60' fill='white' opacity='0.08'/></svg>`
  )}`;

export const courses: Course[] = [
  {
    id: "compliance-101",
    title: "Workplace Compliance Essentials",
    category: "Compliance",
    description: "Core regulatory training every employee must complete annually.",
    instructor: "Sarah Linwood",
    duration: "2h 30m",
    progress: 65,
    dueDate: "2026-06-30",
    mandatory: true,
    thumbnail: cover(220),
    modules: [
      { id: "m1", title: "Introduction to Compliance", type: "video", duration: "12m", completed: true },
      { id: "m2", title: "Anti-Harassment Policies", type: "video", duration: "24m", completed: true },
      { id: "m3", title: "Data Privacy & GDPR", type: "scorm", duration: "45m", completed: false },
      { id: "m4", title: "Code of Conduct Handbook", type: "pdf", duration: "30m", completed: false },
      { id: "m5", title: "Final Assessment", type: "quiz", duration: "20m", completed: false },
    ],
  },
  {
    id: "leadership-foundations",
    title: "Leadership Foundations",
    category: "Leadership",
    description: "Build the core skills of modern people management.",
    instructor: "David Chen",
    duration: "4h 15m",
    progress: 30,
    dueDate: "2026-07-15",
    mandatory: false,
    thumbnail: cover(190),
    modules: [
      { id: "m1", title: "What Great Leaders Do", type: "video", duration: "18m", completed: true },
      { id: "m2", title: "Coaching Conversations", type: "video", duration: "32m", completed: false },
      { id: "m3", title: "Performance Feedback", type: "scorm", duration: "40m", completed: false },
    ],
  },
  {
    id: "cybersecurity-awareness",
    title: "Cybersecurity Awareness",
    category: "Security",
    description: "Recognize phishing, secure your devices, and protect company data.",
    instructor: "Priya Natarajan",
    duration: "1h 45m",
    progress: 100,
    mandatory: true,
    thumbnail: cover(260),
    modules: [
      { id: "m1", title: "Phishing 101", type: "video", duration: "15m", completed: true },
      { id: "m2", title: "Password Hygiene", type: "video", duration: "12m", completed: true },
      { id: "m3", title: "Device Security", type: "scorm", duration: "35m", completed: true },
    ],
  },
  {
    id: "product-onboarding",
    title: "Product Onboarding 2026",
    category: "Onboarding",
    description: "Everything new hires need to know about our product suite.",
    instructor: "Marco Riva",
    duration: "3h",
    progress: 0,
    dueDate: "2026-06-25",
    mandatory: true,
    thumbnail: cover(160),
    modules: [
      { id: "m1", title: "Company Mission", type: "video", duration: "10m", completed: false },
      { id: "m2", title: "Product Portfolio", type: "video", duration: "40m", completed: false },
      { id: "m3", title: "Customer Personas", type: "pdf", duration: "25m", completed: false },
    ],
  },
  {
    id: "design-thinking",
    title: "Design Thinking Workshop",
    category: "Innovation",
    description: "A hands-on intro to human-centered problem solving.",
    instructor: "Aiko Tanaka",
    duration: "2h",
    progress: 45,
    mandatory: false,
    thumbnail: cover(20),
    modules: [
      { id: "m1", title: "Empathize", type: "video", duration: "20m", completed: true },
      { id: "m2", title: "Define & Ideate", type: "video", duration: "25m", completed: false },
    ],
  },
  {
    id: "excel-advanced",
    title: "Advanced Excel for Analysts",
    category: "Technical",
    description: "Pivot tables, Power Query, and dashboarding patterns.",
    instructor: "Henrik Olsen",
    duration: "5h",
    progress: 100,
    mandatory: false,
    thumbnail: cover(60),
    modules: [
      { id: "m1", title: "Power Query Basics", type: "video", duration: "45m", completed: true },
      { id: "m2", title: "Pivot Mastery", type: "video", duration: "55m", completed: true },
    ],
  },
];

export const certificates = courses
  .filter((c) => c.progress === 100)
  .map((c) => ({
    id: `cert-${c.id}`,
    courseId: c.id,
    title: c.title,
    issuedOn: "2026-05-12",
    expiresOn: "2027-05-12",
    verificationCode: c.id.toUpperCase().slice(0, 8) + "-2026",
  }));

export const recentActivity = [
  { id: 1, text: "Completed Cybersecurity Awareness", time: "2 hours ago" },
  { id: 2, text: "Started Leadership Foundations", time: "Yesterday" },
  { id: 3, text: "Downloaded certificate: Advanced Excel", time: "3 days ago" },
  { id: 4, text: "Joined cohort: Product Onboarding 2026", time: "1 week ago" },
];

export const departments = [
  { id: "eng", name: "Engineering", learners: 142, completion: 87, overdue: 4 },
  { id: "sales", name: "Sales", learners: 96, completion: 72, overdue: 11 },
  { id: "mkt", name: "Marketing", learners: 48, completion: 91, overdue: 1 },
  { id: "ops", name: "Operations", learners: 64, completion: 64, overdue: 9 },
  { id: "hr", name: "People & HR", learners: 22, completion: 95, overdue: 0 },
  { id: "fin", name: "Finance", learners: 31, completion: 78, overdue: 3 },
];

export const overdueLearners = [
  { name: "Jordan Alvarez", department: "Sales", course: "Workplace Compliance Essentials", daysOverdue: 5 },
  { name: "Mei Watanabe", department: "Operations", course: "Cybersecurity Awareness", daysOverdue: 3 },
  { name: "Lucas Beck", department: "Engineering", course: "Product Onboarding 2026", daysOverdue: 7 },
  { name: "Fatima Noor", department: "Sales", course: "Workplace Compliance Essentials", daysOverdue: 2 },
];

export const recentAssignments = [
  { course: "Q3 Sales Methodology", assignedTo: "Sales · 96 learners", date: "Jun 9, 2026" },
  { course: "GDPR Refresher", assignedTo: "All employees · 403", date: "Jun 6, 2026" },
  { course: "Manager 1:1 Toolkit", assignedTo: "People Managers · 38", date: "Jun 2, 2026" },
];
