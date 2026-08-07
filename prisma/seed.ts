import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  await prisma.jobRole.createMany({
    data: [
      {
        roleName: "Technology Leader",
        location: "Belfast",
        closingDate: new Date("2026-10-31"),
        status: "OPEN",
        description:
          "Set the technical direction across Kainos, championing innovation and engineering excellence at the highest level.",
        openPositions: 1,
        sharePointLink:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20Profile%20-%20Technology%20Leader.pdf",
        bandId: bandId("Leadership Community"),
        capabilityId: capabilityId("Innovation"),
      },
      {
        roleName: "Principal Architect",
        location: "London",
        closingDate: new Date("2026-09-30"),
        status: "OPEN",
        description:
          "Own architecture for the most complex client engagements and shape architectural standards across accounts.",
        openPositions: 1,
        sharePointLink:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20Profile%20-%20Principal%20Architect%20(Principal).pdf",
        bandId: bandId("Principal"),
        capabilityId: capabilityId("Architecture"),
      },
      {
        roleName: "Dynamics 365 / Power Platform Solution Architect",
        location: "Birmingham",
        closingDate: new Date("2026-09-15"),
        status: "OPEN",
        description:
          "Lead the design and delivery of Dynamics 365 and Power Platform solutions for enterprise clients.",
        openPositions: 2,
        sharePointLink:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20Profile%20-%20Dynamics%20365%20PP%20Solution%20Architect%20(M).pdf",
        bandId: bandId("Manager"),
        capabilityId: capabilityId("Architecture"),
      },
      {
        roleName: "Technical Architect",
        location: "Gdansk",
        closingDate: new Date("2026-10-15"),
        status: "OPEN",
        description:
          "Define technical solutions end to end and guide delivery teams through implementation.",
        openPositions: 2,
        sharePointLink:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20Profile%20-%20Technical%20Architect%20(Consultant).pdf",
        bandId: bandId("Consultant"),
        capabilityId: capabilityId("Architecture"),
      },
      {
        roleName: "Lead Test Engineer",
        location: "Belfast",
        closingDate: new Date("2026-09-01"),
        status: "OPEN",
        description:
          "Lead test strategy and quality engineering practice across one or more delivery teams.",
        openPositions: 1,
        sharePointLink:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Lead%20Test%20Engineer%20(Consultant).pdf",
        bandId: bandId("Consultant"),
        capabilityId: capabilityId("Testing"),
      },
      {
        roleName: "Senior NFT Engineer",
        location: "Remote",
        closingDate: new Date("2026-11-20"),
        status: "OPEN",
        description:
          "Design and run non-functional testing covering performance, resilience and scalability.",
        openPositions: 2,
        sharePointLink:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Senior%20NFT%20Engineer%20(Senior%20Associate).pdf",
        bandId: bandId("Senior Associate"),
        capabilityId: capabilityId("Testing"),
      },
      {
        roleName: "Front-End Engineer",
        location: "Gdansk",
        closingDate: new Date("2026-08-31"),
        status: "OPEN",
        description:
          "Build accessible, responsive user interfaces and collaborate closely with designers and back-end engineers.",
        openPositions: 4,
        sharePointLink:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20Profile%20-%20Front-End%20Engineer%20(A).pdf",
        bandId: bandId("Associate"),
        capabilityId: capabilityId("Engineering"),
      },
      {
        roleName: "Low Code Engineer",
        location: "Derry/Londonderry",
        closingDate: new Date("2026-09-30"),
        status: "OPEN",
        description:
          "Deliver business applications on low code platforms, from configuration through to integration.",
        openPositions: 3,
        sharePointLink:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20specification%20-%20Low%20Code%20Engineer%20(A)%20-%20Low%20Code.pdf",
        bandId: bandId("Associate"),
        capabilityId: capabilityId("Low Code"),
      },
      {
        roleName: "Software Engineer",
        location: "Belfast",
        closingDate: new Date("2026-07-01"),
        status: "CLOSED",
        description:
          "Join a delivery team and grow core software engineering skills through structured training and mentoring.",
        openPositions: 0,
        sharePointLink:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Software%20Engineer%20(Trainee).pdf",
        bandId: bandId("Trainee"),
        capabilityId: capabilityId("Engineering"),
      },
      {
        roleName: "Apprentice Software Engineer",
        location: "Belfast",
        closingDate: null,
        status: "OPEN",
        description:
          "Combine paid work on client projects with a degree apprenticeship in software engineering.",
        openPositions: 10,
        sharePointLink:
          "https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Apprentice%20Software%20Engineer%20(Apprentice).pdf",
        bandId: bandId("Apprentice"),
        capabilityId: capabilityId("Engineering"),
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
