const { DEFAULT_CURRENT_USER_ID, mapClient, mapContact, mapUser } = require('./seedData');

function createPostgresDataStore({ prisma } = {}) {
  const getDatabaseUrl = () => process.env.DATABASE_URL;

  const wrapPrismaError = (operation, error) => {
    if (!error) {
      return error;
    }

    if (error.code !== 'EPERM') {
      return error;
    }

    const databaseUrl = getDatabaseUrl();
    const isPrismaPostgresUrl = databaseUrl?.startsWith('prisma+postgres://');
    const hint = isPrismaPostgresUrl
      ? 'Ensure the local Prisma Postgres instance is running, or switch DATABASE_URL to a direct `postgresql://` connection string.'
      : 'Ensure the Postgres server is reachable from the API process and that DATABASE_URL points at the right host and port.';
    const wrapped = new Error(
      `Postgres query failed during ${operation}. Prisma reached the query runtime, but the database connection was blocked or unavailable (code: ${error.code}). ${hint} After that, run \`npm run db:push --workspace server\` and \`npm run db:seed --workspace server\` if the schema or seed data has not been applied yet.`
    );

    wrapped.cause = error;
    return wrapped;
  };

  const runPrismaOperation = async (operation, callback) => {
    try {
      return await callback();
    } catch (error) {
      throw wrapPrismaError(operation, error);
    }
  };

  const getPrismaClient = () => {
    if (prisma) {
      return prisma;
    }

    const databaseUrl = getDatabaseUrl();

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not set. Add it to `server/.env` before starting the GraphQL server.'
      );
    }

    const { PrismaClient } = require('@prisma/client');
    const { PrismaPg } = require('@prisma/adapter-pg');

    prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: databaseUrl
      })
    });

    return prisma;
  };

  return {
    async getCurrentUser(currentUserId = DEFAULT_CURRENT_USER_ID) {
      const prismaClient = getPrismaClient();
      const user = await runPrismaOperation('getCurrentUser', async () =>
        (await prismaClient.user.findUnique({
          where: {
            id: currentUserId
          }
        })) ||
        (await prismaClient.user.findFirst({
          orderBy: {
            firstName: 'asc'
          }
        }))
      );

      if (!user) {
        throw new Error(
          'No users found in Postgres. Run `npm run db:seed --workspace server` after applying the Prisma schema.'
        );
      }

      return mapUser(user);
    },

    async getUsers() {
      const prismaClient = getPrismaClient();
      const users = await runPrismaOperation('getUsers', () =>
        prismaClient.user.findMany({
          orderBy: [
            { firstName: 'asc' },
            { lastName: 'asc' }
          ]
        })
      );

      return users.map(mapUser);
    },

    async getAllClients() {
      const prismaClient = getPrismaClient();
      const clients = await runPrismaOperation('getAllClients', () =>
        prismaClient.client.findMany({
          orderBy: {
            companyName: 'asc'
          }
        })
      );

      return clients.map(mapClient);
    },

    async getProspects(currentUserId = DEFAULT_CURRENT_USER_ID) {
      const prismaClient = getPrismaClient();
      const prospects = await runPrismaOperation('getProspects', () =>
        prismaClient.client.findMany({
          where: {
            assignedRepId: currentUserId,
            clientStatus: 'PROSPECTING'
          },
          orderBy: {
            companyName: 'asc'
          }
        })
      );

      return prospects.map(mapClient);
    },

    async getMyClients(currentUserId = DEFAULT_CURRENT_USER_ID) {
      const prismaClient = getPrismaClient();
      const clients = await runPrismaOperation('getMyClients', () =>
        prismaClient.client.findMany({
          where: {
            assignedRepId: currentUserId
          },
          orderBy: {
            companyName: 'asc'
          }
        })
      );

      return clients.map(mapClient);
    },

    async getClientById(id) {
      const dbClient = getPrismaClient();
      const client = await runPrismaOperation('getClientById', () =>
        dbClient.client.findUnique({
          where: {
            id
          }
        })
      );

      return client ? mapClient(client) : null;
    },

    async getContactsByClientId(clientId) {
      const prismaClient = getPrismaClient();
      const contacts = await runPrismaOperation('getContactsByClientId', () =>
        prismaClient.contact.findMany({
          where: {
            clientIds: {
              has: clientId
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { lastName: 'asc' }
          ]
        })
      );

      return contacts.map(mapContact);
    },

    async getContactById(id) {
      const prismaClient = getPrismaClient();
      const contact = await runPrismaOperation('getContactById', () =>
        prismaClient.contact.findUnique({
          where: {
            id
          }
        })
      );

      return contact ? mapContact(contact) : null;
    },

    async createClient(input) {
      const prismaClient = getPrismaClient();
      const suffix = Date.now().toString().slice(-6);
      const created = await runPrismaOperation('createClient', () =>
        prismaClient.client.create({
          data: {
            id: Math.floor(10000000 + Math.random() * 90000000).toString(),
            clientId: `CLT-${suffix}`,
            companyName: input.companyName.trim(),
            assignedRepId: input.assignedRepId || null,
            createdDate: new Date(),
            createdClientDate: new Date(),
            activeClientDate: new Date(),
            dbas: input.dbas ?? [],
            isCorporate: input.isCorporate ?? false,
            corporateId: `CORP-${suffix}`,
            clientStatus: 'ACTIVE',
            prospectStatus: 'CLOSED',
            website: input.website || null,
            linkedIn: input.linkedIn || null,
            address1: input.address?.address1 || null,
            address2: input.address?.address2 || null,
            city: input.address?.city || null,
            state: input.address?.state || null,
            zipCode: input.address?.zipCode || null,
            contactIds: input.contactIds ?? [],
            unitCount: input.unitCount ?? 0
          }
        })
      );

      return mapClient(created);
    },

    async createProspect(input) {
      const prismaClient = getPrismaClient();
      const suffix = Date.now().toString().slice(-6);
      const created = await runPrismaOperation('createProspect', () =>
        prismaClient.client.create({
          data: {
            clientId: `CLT-${suffix}`,
            companyName: input.companyName.trim(),
            assignedRepId: input.assignedRepId || null,
            createdDate: new Date(),
            createdClientDate: new Date(),
            dbas: input.dbas ?? [],
            isCorporate: input.isCorporate ?? false,
            corporateId: `CORP-${suffix}`,
            clientStatus: 'PROSPECTING',
            prospectStatus: input.prospectStatus,
            website: input.website || null,
            linkedIn: input.linkedIn || null,
            address1: input.address?.address1 || null,
            address2: input.address?.address2 || null,
            city: input.address?.city || null,
            state: input.address?.state || null,
            zipCode: input.address?.zipCode || null,
            contactIds: input.contactIds ?? [],
            unitCount: input.unitCount ?? 0
          }
        })
      );

      return mapClient(created);
    },

    async createContact(clientId, input) {
      const prismaClient = getPrismaClient();
      const suffix = Date.now().toString().slice(-8);
      const contactId = `contact-${suffix}`;
      const created = await runPrismaOperation('createContact', async () => {
        const record = await prismaClient.contact.create({
          data: {
            id: contactId,
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            title: input.title?.trim() || null,
            email: input.email?.trim() || null,
            phone: input.phone?.trim() || null,
            linkedIn: input.linkedIn?.trim() || null,
            isPrimary: input.isPrimary ?? false,
            clientIds: [clientId]
          }
        });

        const client = await prismaClient.client.findUnique({
          where: {
            id: clientId
          }
        });

        if (!client) {
          throw new Error(`Client ${clientId} was not found.`);
        }

        const nextContactIds = Array.from(new Set([...(client.contactIds ?? []), record.id]));
        await prismaClient.client.update({
          where: {
            id: clientId
          },
          data: {
            contactIds: nextContactIds
          }
        });

        return record;
      });

      return mapContact(created);
    },

    async bulkCreateContacts(clientId, inputs) {
      const createdContacts = [];

      for (const input of inputs) {
        createdContacts.push(await this.createContact(clientId, input));
      }

      return createdContacts;
    },

    async updateContact(id, input) {
      const prismaClient = getPrismaClient();
      const updated = await runPrismaOperation('updateContact', async () => {
        const existing = await prismaClient.contact.findUnique({
          where: { id }
        });

        if (!existing) {
          throw new Error(`Contact ${id} was not found.`);
        }

        return prismaClient.contact.update({
          where: { id },
          data: {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            title: input.title?.trim() || null,
            email: input.email?.trim() || null,
            phone: input.phone?.trim() || null,
            linkedIn: input.linkedIn?.trim() || null,
            isPrimary: input.isPrimary ?? false
          }
        });
      });

      return mapContact(updated);
    },

    async deleteContact(id) {
      const prismaClient = getPrismaClient();
      const deleted = await runPrismaOperation('deleteContact', async () => {
        const existing = await prismaClient.contact.findUnique({
          where: { id }
        });

        if (!existing) {
          throw new Error(`Contact ${id} was not found.`);
        }

        await Promise.all(
          (existing.clientIds ?? []).map(async (clientId) => {
            const client = await prismaClient.client.findUnique({
              where: { id: clientId }
            });

            if (!client) {
              return;
            }

            const nextContactIds = (client.contactIds ?? []).filter((contactId) => contactId !== id);
            await prismaClient.client.update({
              where: { id: clientId },
              data: {
                contactIds: nextContactIds
              }
            });
          })
        );

        return prismaClient.contact.delete({
          where: { id }
        });
      });

      return mapContact(deleted);
    },

    async disconnect() {
      const prismaClient = getPrismaClient();
      await prismaClient.$disconnect();
    }
  };
}

module.exports = {
  createPostgresDataStore
};
