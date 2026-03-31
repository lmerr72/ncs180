const {
  DEFAULT_CURRENT_USER_ID,
  buildClientRecord,
  contacts,
  mapContact,
  clients,
  mapClient,
  mapUser,
  users
} = require('./seedData');

function createMockDataStore() {
  return {
    async getCurrentUser(currentUserId = DEFAULT_CURRENT_USER_ID) {
      const user = users.find((entry) => entry.id === currentUserId) || users[0];
      return mapUser(user);
    },

    async getUsers() {
      return users.map(mapUser);
    },

    async getAllClients() {
      return clients.map(mapClient);
    },

    async getProspects(currentUserId = DEFAULT_CURRENT_USER_ID) {
      return clients
        .filter(
          (client) =>
            client.assignedRepId === currentUserId && client.clientStatus === 'PROSPECTING'
        )
        .map(mapClient);
    },

    async getMyClients(currentUserId = DEFAULT_CURRENT_USER_ID) {
      return clients
        .filter((client) => client.assignedRepId === currentUserId)
        .map(mapClient);
    },

    async getClientById(id) {
      const client = clients.find((entry) => entry.id === id);
      return client ? mapClient(client) : null;
    },

    async getContactsByClientId(clientId) {
      return contacts
        .filter((contact) => contact.clientIds.includes(clientId))
        .map(mapContact);
    },

    async getContactById(id) {
      const contact = contacts.find((entry) => entry.id === id);
      return contact ? mapContact(contact) : null;
    },

    async createClient(input) {
      const record = buildClientRecord(input, {
        clientStatus: 'ACTIVE',
        prospectStatus: 'CLOSED',
        activeClientDate: new Date().toISOString().slice(0, 10)
      });

      clients.unshift(record);
      return mapClient(record);
    },

    async createProspect(input) {
      const record = buildClientRecord(input, {
        clientStatus: 'PROSPECTING',
        prospectStatus: input.prospectStatus
      });

      clients.unshift(record);
      return mapClient(record);
    },

    async createContact(clientId, input) {
      const record = {
        id: `contact-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        title: input.title?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        linkedIn: input.linkedIn?.trim() || null,
        isPrimary: input.isPrimary ?? false,
        clientIds: [clientId]
      };

      contacts.unshift(record);
      const client = clients.find((entry) => entry.id === clientId);
      if (client) {
        client.contactIds = Array.from(new Set([...(client.contactIds ?? []), record.id]));
      }

      return mapContact(record);
    },

    async bulkCreateContacts(clientId, inputs) {
      const createdContacts = [];

      for (const input of inputs) {
        createdContacts.push(await this.createContact(clientId, input));
      }

      return createdContacts;
    },

    async updateContact(id, input) {
      const contact = contacts.find((entry) => entry.id === id);
      if (!contact) {
        throw new Error(`Contact ${id} was not found.`);
      }

      contact.firstName = input.firstName.trim();
      contact.lastName = input.lastName.trim();
      contact.title = input.title?.trim() || null;
      contact.email = input.email?.trim() || null;
      contact.phone = input.phone?.trim() || null;
      contact.linkedIn = input.linkedIn?.trim() || null;
      contact.isPrimary = input.isPrimary ?? false;

      return mapContact(contact);
    },

    async deleteContact(id) {
      const index = contacts.findIndex((entry) => entry.id === id);
      if (index === -1) {
        throw new Error(`Contact ${id} was not found.`);
      }

      const [deleted] = contacts.splice(index, 1);

      clients.forEach((client) => {
        client.contactIds = (client.contactIds ?? []).filter((contactId) => contactId !== id);
      });

      return mapContact(deleted);
    },

    async disconnect() {}
  };
}

module.exports = {
  createMockDataStore
};
