
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });
    if (admin) {
        console.log(`Found admin: ${admin.email}`);
        // We can't see the password hash, but at least we know the email.
        // If we need to reset the password we can.
    } else {
        console.log('No admin found.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
