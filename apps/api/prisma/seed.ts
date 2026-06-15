import bcrypt from "bcrypt";
import { DayOfWeek, PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const levels = [
    {
      name: "Aquatots",
      description: "Parent/guardian in water with child",
      minAge: 12,
      maxAge: 36,
      sortOrder: 1
    },
    { name: "Three Plus", description: "Non-swimmers age 3-6", minAge: 36, maxAge: 72, sortOrder: 2 },
    {
      name: "Transitional",
      description: "Age 7+, basic water confidence",
      minAge: 84,
      maxAge: null,
      sortOrder: 3
    },
    {
      name: "Intermediate",
      description: "Age 7+, developing stroke technique",
      minAge: 84,
      maxAge: null,
      sortOrder: 4
    },
    {
      name: "Advanced",
      description: "Age 7+, strong swimmers developing speed and endurance",
      minAge: 84,
      maxAge: null,
      sortOrder: 5
    },
    {
      name: "Adult",
      description: "Adult beginners and stroke improvement",
      minAge: 216,
      maxAge: null,
      sortOrder: 6
    }
  ];

  for (const level of levels) {
    await prisma.programLevel.upsert({
      where: { name: level.name },
      update: level,
      create: level
    });
  }

  const warwick = await prisma.poolLocation.upsert({
    where: { name: "Warwick Academy Pool" },
    update: {
      address: "Warwick Camp, Warwick Parish, Bermuda"
    },
    create: {
      name: "Warwick Academy Pool",
      address: "Warwick Camp, Warwick Parish, Bermuda"
    }
  });

  await prisma.poolLocation.upsert({
    where: { name: "National Sports Centre Aquatics Centre" },
    update: {
      address: "40 Robin Hood Drive, Pembroke, Bermuda"
    },
    create: {
      name: "National Sports Centre Aquatics Centre",
      address: "40 Robin Hood Drive, Pembroke, Bermuda"
    }
  });

  const summer2026 = await prisma.term.upsert({
    where: { name: "Summer 2026" },
    update: {
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      endDate: new Date("2026-08-31T23:59:59.000Z"),
      isActive: true
    },
    create: {
      name: "Summer 2026",
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      endDate: new Date("2026-08-31T23:59:59.000Z"),
      isActive: true
    }
  });

  await prisma.term.updateMany({ where: { NOT: { id: summer2026.id } }, data: { isActive: false } });

  const adminPasswordHash = await bcrypt.hash("AquaAdmin2026!", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@aquamania.bm" },
    update: {
      firstName: "Lesley",
      lastName: "White",
      role: Role.ADMIN,
      passwordHash: adminPasswordHash
    },
    create: {
      email: "admin@aquamania.bm",
      firstName: "Lesley",
      lastName: "White",
      role: Role.ADMIN,
      passwordHash: adminPasswordHash
    }
  });

  const instructorPasswordHash = await bcrypt.hash("DemoInstructor2026!", 10);
  const instructorUser = await prisma.user.upsert({
    where: { email: "instructor@aquamania.bm" },
    update: {
      firstName: "Demo",
      lastName: "Instructor",
      role: Role.INSTRUCTOR,
      passwordHash: instructorPasswordHash
    },
    create: {
      email: "instructor@aquamania.bm",
      firstName: "Demo",
      lastName: "Instructor",
      role: Role.INSTRUCTOR,
      passwordHash: instructorPasswordHash
    }
  });

  const instructor = await prisma.instructor.upsert({
    where: { userId: instructorUser.id },
    update: {
      qualifications: "STA Level 2",
      certifications: "CPR Certified"
    },
    create: {
      userId: instructorUser.id,
      qualifications: "STA Level 2",
      certifications: "CPR Certified"
    }
  });

  const aquatots = await prisma.programLevel.findUniqueOrThrow({ where: { name: "Aquatots" } });

  await prisma.group.upsert({
    where: { name: "Saturday Aquatots 9:00am" },
    update: {
      programLevelId: aquatots.id,
      poolLocationId: warwick.id,
      instructorId: instructor.id,
      dayOfWeek: DayOfWeek.SATURDAY,
      startTime: "09:00",
      endTime: "09:45",
      capacity: 10,
      termId: summer2026.id,
      isActive: true
    },
    create: {
      name: "Saturday Aquatots 9:00am",
      programLevelId: aquatots.id,
      poolLocationId: warwick.id,
      instructorId: instructor.id,
      dayOfWeek: DayOfWeek.SATURDAY,
      startTime: "09:00",
      endTime: "09:45",
      capacity: 10,
      termId: summer2026.id,
      isActive: true
    }
  });

  console.log("Seed complete", { adminUserId: adminUser.id, instructorUserId: instructorUser.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
