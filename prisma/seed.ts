import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash("Admin!123");
  await prisma.user.upsert({
    where: { email: "admin@kainos.local" },
    update: {},
    create: {
      email: "admin@kainos.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });
  const applicantPasswordHash = await argon2.hash("Applicant!123");
  const [applicantOne, applicantTwo] = await Promise.all([
    prisma.user.upsert({
      where: { email: "applicant.one@kainos.local" },
      update: {},
      create: {
        email: "applicant.one@kainos.local",
        passwordHash: applicantPasswordHash,
        role: Role.USER,
      },
    }),
    prisma.user.upsert({
      where: { email: "applicant.two@kainos.local" },
      update: {},
      create: {
        email: "applicant.two@kainos.local",
        passwordHash: applicantPasswordHash,
        role: Role.USER,
      },
    }),
  ]);

  await prisma.band.createMany({
    data: [
      { name: "Apprentice" },
      { name: "Trainee" },
      { name: "Associate" },
      { name: "Senior Associate" },
      { name: "Consultant" },
      { name: "Manager" },
      { name: "Principal" },
      { name: "Leadership Community" },
    ],
    skipDuplicates: true,
  });

  await prisma.capability.createMany({
    data: [
      { name: "Innovation" },
      { name: "Engineering" },
      { name: "Architecture" },
      { name: "Testing" },
      { name: "Product" },
      { name: "Low Code" },
    ],
    skipDuplicates: true,
  });

  const bands = await prisma.band.findMany();
  const capabilities = await prisma.capability.findMany();
  // Status rows are owned by migration 20260812120000_job_role_status_table, not by this seed.
  const statuses = await prisma.status.findMany();

  const bandId = (name: string) => {
    const band = bands.find((b) => b.name === name);
    if (!band) throw new Error(`Band not found: ${name}`);
    return band.id;
  };

  const capabilityId = (name: string) => {
    const capability = capabilities.find((c) => c.name === name);
    if (!capability) throw new Error(`Capability not found: ${name}`);
    return capability.id;
  };

  const statusId = (name: string) => {
    const status = statuses.find((s) => s.statusName === name);
    if (!status) throw new Error(`Status not found: ${name}`);
    return status.statusId;
  };

  await prisma.jobRole.createMany({
    data: [
      {
        roleName: "Technology Leader",
        location: "Belfast",
        closingDate: new Date("2026-10-31"),
        statusId: statusId("OPEN"),
        description:
          "Set the technical direction across Kainos, championing innovation and engineering excellence at the highest level.",
        numberOfOpenPositions: 1,
        sharepointUrl:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20Profile%20-%20Technology%20Leader.pdf",
        bandId: bandId("Leadership Community"),
        capabilityId: capabilityId("Innovation"),
      },
      {
        roleName: "Principal Architect",
        location: "London",
        closingDate: new Date("2026-09-30"),
        statusId: statusId("OPEN"),
        description:
          "Own architecture for the most complex client engagements and shape architectural standards across accounts.",
        numberOfOpenPositions: 1,
        sharepointUrl:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20Profile%20-%20Principal%20Architect%20(Principal).pdf",
        bandId: bandId("Principal"),
        capabilityId: capabilityId("Architecture"),
      },
      {
        roleName: "Dynamics 365 / Power Platform Solution Architect",
        location: "Birmingham",
        closingDate: new Date("2026-09-15"),
        statusId: statusId("OPEN"),
        description:
          "Lead the design and delivery of Dynamics 365 and Power Platform solutions for enterprise clients.",
        numberOfOpenPositions: 2,
        sharepointUrl:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20Profile%20-%20Dynamics%20365%20PP%20Solution%20Architect%20(M).pdf",
        bandId: bandId("Manager"),
        capabilityId: capabilityId("Architecture"),
      },
      {
        roleName: "Technical Architect",
        location: "Gdansk",
        closingDate: new Date("2026-10-15"),
        statusId: statusId("OPEN"),
        description:
          "Define technical solutions end to end and guide delivery teams through implementation.",
        numberOfOpenPositions: 2,
        sharepointUrl:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20Profile%20-%20Technical%20Architect%20(Consultant).pdf",
        bandId: bandId("Consultant"),
        capabilityId: capabilityId("Architecture"),
      },
      {
        roleName: "Lead Test Engineer",
        location: "Belfast",
        closingDate: new Date("2026-09-01"),
        statusId: statusId("OPEN"),
        description:
          "Lead test strategy and quality engineering practice across one or more delivery teams.",
        numberOfOpenPositions: 1,
        sharepointUrl:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Lead%20Test%20Engineer%20(Consultant).pdf",
        bandId: bandId("Consultant"),
        capabilityId: capabilityId("Testing"),
      },
      {
        roleName: "Senior NFT Engineer",
        location: "Remote",
        closingDate: new Date("2026-11-20"),
        statusId: statusId("OPEN"),
        description:
          "Design and run non-functional testing covering performance, resilience and scalability.",
        numberOfOpenPositions: 2,
        sharepointUrl:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Senior%20NFT%20Engineer%20(Senior%20Associate).pdf",
        bandId: bandId("Senior Associate"),
        capabilityId: capabilityId("Testing"),
      },
      {
        roleName: "Front-End Engineer",
        location: "Gdansk",
        closingDate: new Date("2026-08-31"),
        statusId: statusId("OPEN"),
        description:
          "Build accessible, responsive user interfaces and collaborate closely with designers and back-end engineers.",
        numberOfOpenPositions: 4,
        sharepointUrl:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20Profile%20-%20Front-End%20Engineer%20(A).pdf",
        bandId: bandId("Associate"),
        capabilityId: capabilityId("Engineering"),
      },
      {
        roleName: "Low Code Engineer",
        location: "Derry/Londonderry",
        closingDate: new Date("2026-09-30"),
        statusId: statusId("OPEN"),
        description:
          "Deliver business applications on low code platforms, from configuration through to integration.",
        numberOfOpenPositions: 3,
        sharepointUrl:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20specification%20-%20Low%20Code%20Engineer%20(A)%20-%20Low%20Code.pdf",
        bandId: bandId("Associate"),
        capabilityId: capabilityId("Low Code"),
      },
      {
        roleName: "Software Engineer",
        location: "Belfast",
        closingDate: new Date("2026-07-01"),
        statusId: statusId("CLOSED"),
        description:
          "Join a delivery team and grow core software engineering skills through structured training and mentoring.",
        numberOfOpenPositions: 0,
        sharepointUrl:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Software%20Engineer%20(Trainee).pdf",
        bandId: bandId("Trainee"),
        capabilityId: capabilityId("Engineering"),
      },
      {
        roleName: "Apprentice Software Engineer",
        location: "Belfast",
        closingDate: null,
        statusId: statusId("OPEN"),
        description:
          "Combine paid work on client projects with a degree apprenticeship in software engineering.",
        numberOfOpenPositions: 10,
        sharepointUrl:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Apprentice%20Software%20Engineer%20(Apprentice).pdf",
        bandId: bandId("Apprentice"),
        capabilityId: capabilityId("Engineering"),
      },
    ],
    skipDuplicates: true,
  });

  const applicationRole = await prisma.jobRole.findFirst({
    where: { roleName: "Technology Leader", location: "Belfast" },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  if (!applicationRole) throw new Error("Application seed role not found");

  await prisma.jobRole.update({
    where: { id: applicationRole.id },
    data: { numberOfOpenPositions: 1, statusId: statusId("OPEN") },
  });
  const inProgressStatusId = statusId("IN_PROGRESS");
  await Promise.all([
    prisma.application.upsert({
      where: {
        applicantId_jobRoleId: {
          applicantId: applicantOne.id,
          jobRoleId: applicationRole.id,
        },
      },
      update: {
        statusId: inProgressStatusId,
        experience: "Five years leading engineering teams and delivery programmes.",
        salaryExpectation: "70000",
        skills: "TypeScript, Node.js, AWS",
      },
      create: {
        applicantId: applicantOne.id,
        jobRoleId: applicationRole.id,
        statusId: inProgressStatusId,
        experience: "Five years leading engineering teams and delivery programmes.",
        salaryExpectation: "70000",
        skills: "TypeScript, Node.js, AWS",
      },
    }),
    prisma.application.upsert({
      where: {
        applicantId_jobRoleId: {
          applicantId: applicantTwo.id,
          jobRoleId: applicationRole.id,
        },
      },
      update: {
        statusId: inProgressStatusId,
        experience: "Three years building accessible frontend applications.",
        salaryExpectation: "55000",
        skills: "React, TypeScript, CSS",
      },
      create: {
        applicantId: applicantTwo.id,
        jobRoleId: applicationRole.id,
        statusId: inProgressStatusId,
        experience: "Three years building accessible frontend applications.",
        salaryExpectation: "55000",
        skills: "React, TypeScript, CSS",
      },
    }),
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
