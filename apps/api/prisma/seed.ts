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

  const saturdayAquatots = await prisma.group.upsert({
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

  const demoParentPasswordHash = await bcrypt.hash("swimming", 10);
  const demoParentUser = await prisma.user.upsert({
    where: { email: "testparent989888245@example.com" },
    update: {
      firstName: "Test",
      lastName: "Parent",
      role: Role.PARENT,
      phone: "4411234567",
      passwordHash: demoParentPasswordHash
    },
    create: {
      email: "testparent989888245@example.com",
      firstName: "Test",
      lastName: "Parent",
      role: Role.PARENT,
      phone: "4411234567",
      passwordHash: demoParentPasswordHash
    }
  });

  const demoParent = await prisma.parent.upsert({
    where: { userId: demoParentUser.id },
    update: {
      address: "Warwick Parish, Bermuda",
      emergencyName: "Jane",
      emergencyPhone: "4417654321"
    },
    create: {
      userId: demoParentUser.id,
      address: "Warwick Parish, Bermuda",
      emergencyName: "Jane",
      emergencyPhone: "4417654321"
    }
  });

  const demoSwimmer = await prisma.swimmer.upsert({
    where: {
      id: "demo-parent-swimmer"
    },
    update: {
      parentId: demoParent.id,
      firstName: "Kid",
      lastName: "Parent",
      dateOfBirth: new Date("2018-04-30T00:00:00.000Z"),
      medicalNotes: "None provided",
      registrationStatus: "APPROVED",
      groupId: saturdayAquatots.id
    },
    create: {
      id: "demo-parent-swimmer",
      parentId: demoParent.id,
      firstName: "Kid",
      lastName: "Parent",
      dateOfBirth: new Date("2018-04-30T00:00:00.000Z"),
      medicalNotes: "None provided",
      registrationStatus: "APPROVED",
      groupId: saturdayAquatots.id
    }
  });

  const duplicateSwimmers = await prisma.swimmer.findMany({
    where: {
      parentId: demoParent.id,
      firstName: "Kid",
      lastName: "Parent",
      NOT: { id: demoSwimmer.id }
    },
    select: { id: true }
  });

  if (duplicateSwimmers.length > 0) {
    const duplicateIds = duplicateSwimmers.map((item) => item.id);
    await prisma.photoTag.deleteMany({ where: { swimmerId: { in: duplicateIds } } });
    await prisma.attendance.deleteMany({ where: { swimmerId: { in: duplicateIds } } });
    await prisma.consentForm.deleteMany({ where: { swimmerId: { in: duplicateIds } } });
    await prisma.swimmer.deleteMany({ where: { id: { in: duplicateIds } } });
  }

  await prisma.payment.upsert({
    where: { id: "demo-payment-term-fee" },
    update: {
      parentId: demoParent.id,
      termId: summer2026.id,
      description: "Summer 2026 Term Fee",
      amountDue: 600,
      amountPaid: 300,
      status: "PARTIAL",
      dueDate: new Date("2026-07-10T00:00:00.000Z"),
      notes: "Balance due before term midpoint"
    },
    create: {
      id: "demo-payment-term-fee",
      parentId: demoParent.id,
      termId: summer2026.id,
      description: "Summer 2026 Term Fee",
      amountDue: 600,
      amountPaid: 300,
      status: "PARTIAL",
      dueDate: new Date("2026-07-10T00:00:00.000Z"),
      notes: "Balance due before term midpoint"
    }
  });

  await prisma.payment.upsert({
    where: { id: "demo-payment-kit" },
    update: {
      parentId: demoParent.id,
      termId: summer2026.id,
      description: "Swim Kit and Cap",
      amountDue: 85,
      amountPaid: 0,
      status: "OUTSTANDING",
      dueDate: new Date("2026-07-20T00:00:00.000Z")
    },
    create: {
      id: "demo-payment-kit",
      parentId: demoParent.id,
      termId: summer2026.id,
      description: "Swim Kit and Cap",
      amountDue: 85,
      amountPaid: 0,
      status: "OUTSTANDING",
      dueDate: new Date("2026-07-20T00:00:00.000Z")
    }
  });

  const demoPhotos = [
    {
      id: "demo-photo-1",
      url: "/demo-photos/kids-pool-1.jpg",
      caption: "Children kick drills in the pool"
    },
    {
      id: "demo-photo-2",
      url: "/demo-photos/kids-pool-2.jpg",
      caption: "Children freestyle lane practice"
    },
    {
      id: "demo-photo-3",
      url: "/demo-photos/kids-pool-3.jpg",
      caption: "Children pool confidence session"
    }
  ];

  for (const item of demoPhotos) {
    const photo = await prisma.photo.upsert({
      where: { id: item.id },
      update: {
        groupId: saturdayAquatots.id,
        url: item.url,
        caption: item.caption,
        uploadedById: adminUser.id
      },
      create: {
        id: item.id,
        groupId: saturdayAquatots.id,
        url: item.url,
        caption: item.caption,
        uploadedById: adminUser.id
      }
    });

    await prisma.photoTag.upsert({
      where: {
        photoId_swimmerId: {
          photoId: photo.id,
          swimmerId: demoSwimmer.id
        }
      },
      update: {},
      create: {
        photoId: photo.id,
        swimmerId: demoSwimmer.id
      }
    });
  }

  console.log("Seed complete", {
    adminUserId: adminUser.id,
    instructorUserId: instructorUser.id,
    demoParentUserId: demoParentUser.id,
    demoSwimmerId: demoSwimmer.id
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
