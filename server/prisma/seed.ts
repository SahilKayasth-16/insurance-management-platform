import bcrypt from "bcrypt";
import prisma from "../src/lib/prisma.js";

async function main() {
    console.log("Connected DB:", process.env.DATABASE_URL);

    console.log("Users before:");
    console.table(await prisma.user.findMany());

    const hashedAdminPassword = await bcrypt.hash("Adminsk@16", 10);
    const hashedAgentPassword = await bcrypt.hash("Adminds@10", 10);

    const admin = await prisma.user.upsert({
        where: {
            email: "adminsk@test.com"
        },
        update: {},
        create: {
            name: "Sahil Kayasth",
            email: "adminsk@test.com",
            password: hashedAdminPassword,
            role: "ADMIN"
        },
    });

    console.log("Admin inserted:");
    console.log(admin);

    const agent = await prisma.user.upsert({
        where: {
            email: "agent@test.com",
        },
        update: {},
        create: {
            name: "Insurance Agent",
            email: "agent@test.com",
            password: hashedAgentPassword,
            role: "AGENT",
        },
    });

    console.log("Agent inserted:");
    console.log(agent);

    console.log("Users after:");
    console.table(await prisma.user.findMany());

    console.log("✅ Seed completed.");
}
main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });