const {
  DEFAULT_CURRENT_USER_ID,
  auditLogs,
  buildClientRecord,
  contacts,
  mapAuditLog,
  mapClient,
  mapContact,
  mapTask,
  clients,
  tasks,
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

    async getTasks(repId, clientId) {
      return tasks
        .filter((task) => task.repId === repId && (clientId ? task.clientId === clientId : true))
        .sort((left, right) => {
          if (left.completed !== right.completed) {
            return Number(left.completed) - Number(right.completed);
          }

          return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
        })
        .map((task) => mapTask(task, clients.find((entry) => entry.id === task.clientId) ?? null));
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

    async getAuditLogEntries(clientId, startDate, endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      return auditLogs
        .filter((entry) => {
          if (entry.clientId !== clientId) return false;

          const timestamp = new Date(entry.timestamp);
          if (start && timestamp < start) return false;
          if (end && timestamp > end) return false;
          return true;
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map(mapAuditLog);
    },

    async createAuditLogEntry(input) {
      const entry = {
        id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        clientId: input.clientId,
        action: input.action.trim(),
        author: input.author.trim(),
        repId: input.repId,
        timestamp: input.timestamp ?? new Date().toISOString(),
        type: input.type
      };

      auditLogs.unshift(entry);
      return mapAuditLog(entry);
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
      const isClosedProspect = input.prospectStatus === 'CLOSED';
      const record = buildClientRecord(input, {
        clientId: isClosedProspect ? undefined : null,
        clientStatus: isClosedProspect ? 'ONBOARDING' : 'PROSPECTING',
        prospectStatus: input.prospectStatus,
        createdClientDate: isClosedProspect ? new Date().toISOString().slice(0, 10) : null,
        activeClientDate: null
      });

      clients.unshift(record);
      return mapClient(record);
    },

    async updateClient(id, input) {
      const client = clients.find((entry) => entry.id === id);
      if (!client) {
        throw new Error(`Client ${id} was not found.`);
      }

      if (input.clientStatus !== undefined) {
        client.clientStatus = input.clientStatus;
      }

      if (input.prospectStatus !== undefined) {
        client.prospectStatus = input.prospectStatus;

        if (input.prospectStatus === 'CLOSED') {
          const suffix = Date.now().toString().slice(-6);
          client.clientId = client.clientId ?? `CLT-${suffix}`;
          client.createdClientDate = client.createdClientDate ?? new Date().toISOString().slice(0, 10);
          client.clientStatus = 'ONBOARDING';
        }
      }

      return mapClient(client);
    },

    async createTask(input) {
      const record = {
        id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        repId: input.repId,
        clientId: input.clientId ?? null,
        title: input.title.trim(),
        description: input.description.trim(),
        taskType: input.taskType,
        importance: input.importance,
        dueDate: input.dueDate,
        completed: input.completed ?? false,
        commType: input.commType ?? null
      };

      tasks.unshift(record);
      return mapTask(record, clients.find((entry) => entry.id === record.clientId) ?? null);
    },

    async updateTask(id, input) {
      const task = tasks.find((entry) => entry.id === id);
      if (!task) {
        throw new Error(`Task ${id} was not found.`);
      }

      if (input.clientId !== undefined) task.clientId = input.clientId;
      if (input.title !== undefined) task.title = input.title.trim();
      if (input.description !== undefined) task.description = input.description.trim();
      if (input.taskType !== undefined) task.taskType = input.taskType;
      if (input.importance !== undefined) task.importance = input.importance;
      if (input.dueDate !== undefined) task.dueDate = input.dueDate;
      if (input.completed !== undefined) task.completed = input.completed;
      if (input.commType !== undefined) task.commType = input.commType;

      return mapTask(task, clients.find((entry) => entry.id === task.clientId) ?? null);
    },

    async deleteTask(id) {
      const taskIndex = tasks.findIndex((entry) => entry.id === id);
      if (taskIndex === -1) {
        throw new Error(`Task ${id} was not found.`);
      }

      const [deletedTask] = tasks.splice(taskIndex, 1);
      return mapTask(deletedTask, clients.find((entry) => entry.id === deletedTask.clientId) ?? null);
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
