require('../src/loadEnv');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const {
  toPrismaClientCreateManyInput,
  toPrismaContactCreateManyInput,
  toPrismaOnboardingChecklistCreateManyInput,
  toPrismaUserCreateManyInput
} = require('../src/graphql/seedData');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Add it to `server/.env` before running `npm run db:seed --workspace server`.'
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl
  })
});

function wrapSeedError(error) {
  if (!error || error.code !== 'EPERM') {
    return error;
  }

  const isPrismaPostgresUrl = databaseUrl.startsWith('prisma+postgres://');
  const hint = isPrismaPostgresUrl
    ? 'Your DATABASE_URL points at a local Prisma Postgres endpoint. Make sure that local Prisma Postgres instance is running, or switch DATABASE_URL to a direct `postgresql://` connection string.'
    : 'Make sure the Postgres server is running and reachable from this process, and that DATABASE_URL points at the correct host and port.';
  const wrapped = new Error(
    `Failed to seed Postgres because the first database operation could not reach the database runtime (code: ${error.code}). ${hint} If the database is empty or new, run \`npm run db:push --workspace server\` before seeding.`
  );

  wrapped.cause = error;
  return wrapped;
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.client.deleteMany();
  await prisma.onboardingChecklist.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: toPrismaUserCreateManyInput()
  });

  await prisma.onboardingChecklist.createMany({
    data: toPrismaOnboardingChecklistCreateManyInput()
  });

  await prisma.client.createMany({
    data: toPrismaClientCreateManyInput()
  });

  await prisma.contact.createMany({
    data: toPrismaContactCreateManyInput()
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Failed to seed Postgres', wrapSeedError(error));
    await prisma.$disconnect();
    process.exit(1);
  });
