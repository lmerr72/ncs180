const request = require('supertest');
const { createApp } = require('../../src/app');
const { createMockDataStore } = require('../../src/graphql/mockDataStore');

describe('POST /graphql', () => {
  it('returns the initial graphql payload', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          query InitialSetup {
            health {
              status
              service
            }
            currentUser {
              id
              firstName
            }
            prospects {
              id
            }
            myClients {
              id
              companyName
            }
          }
        `
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      data: {
        health: {
          status: 'ok',
          service: 'server'
        },
        currentUser: {
          id: 'client-rep-002',
          firstName: 'Gordon'
        },
        prospects: [],
        myClients: [
          { id: 'my-1', companyName: 'Apex Properties' },
          { id: 'my-2', companyName: 'Bell Management' },
          { id: 'my-3', companyName: 'Cascade Housing' }
        ]
      }
    });
  });

  it('returns one seeded task for each company', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          query SeedTasks {
            gordonTasks: tasks(repId: "client-rep-002") {
              clientId
            }
            heathTasks: tasks(repId: "client-rep-005") {
              clientId
            }
          }
        `
      });

    const taskClientIds = [
      ...response.body.data.gordonTasks,
      ...response.body.data.heathTasks
    ].map((task) => task.clientId);

    expect(response.statusCode).toBe(200);
    expect(taskClientIds).toHaveLength(5);
    expect(taskClientIds.sort()).toEqual(['all-4', 'all-5', 'my-1', 'my-2', 'my-3']);
  });

  it('returns seeded contact fields for a client', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          query ContactsForClient($clientId: ID!) {
            contacts(clientId: $clientId) {
              id
              firstName
              lastName
              email
              linkedIn
              isPrimary
              clientIds
            }
          }
        `,
        variables: {
          clientId: 'my-1'
        }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      data: {
        contacts: [
          {
            id: 'contact-seed-my-1',
            firstName: 'Jennifer',
            lastName: 'Walsh',
            email: 'j.walsh@synergyproperties.com',
            linkedIn: 'https://www.linkedin.com/in/jenniferwalsh',
            isPrimary: true,
            clientIds: ['my-1']
          }
        ]
      }
    });
  });

  it('returns audit log entries for a client and respects the date range filters', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });

    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          query AuditLogEntries($clientId: ID!, $startDate: String, $endDate: String) {
            auditLogEntries(clientId: $clientId, startDate: $startDate, endDate: $endDate) {
              id
              clientId
              action
              author
              repId
              timestamp
              type
            }
          }
        `,
        variables: {
          clientId: 'my-1',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-12-31T23:59:59.999Z'
        }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.auditLogEntries).toEqual([
      {
        id: 'audit-seed-my-1-2',
        clientId: 'my-1',
        action: 'Primary contact updated to Jennifer Walsh',
        author: 'Gordon Marshall',
        repId: '',
        timestamp: '2025-12-02T09:05:00.000Z',
        type: 'edit'
      }
    ]);
  });

  it('creates an audit log entry', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });

    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation CreateAuditLogEntry($input: CreateAuditLogEntryInput!) {
            createAuditLogEntry(input: $input) {
              id
              clientId
              action
              author
              repId
              timestamp
              type
            }
          }
        `,
        variables: {
          input: {
            clientId: 'my-1',
            action: 'Prospect status changed',
            author: 'Gordon Marshall',
            repId: '',
            type: 'edit'
          }
        }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.createAuditLogEntry).toMatchObject({
      id: expect.stringMatching(/^audit-/),
      clientId: 'my-1',
      action: 'Prospect status changed',
      author: 'Gordon Marshall',
      repId: '',
      type: 'edit'
    });
    expect(response.body.data.createAuditLogEntry.timestamp).toEqual(expect.any(String));
  });

  it('creates a contact with first and last names and associates it to the client', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });

    const createResponse = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation CreateContact($clientId: ID!, $input: CreateContactInput!) {
            createContact(clientId: $clientId, input: $input) {
              id
              firstName
              lastName
              title
              email
              phone
              linkedIn
              isPrimary
              clientIds
            }
          }
        `,
        variables: {
          clientId: 'my-1',
          input: {
            firstName: 'Avery',
            lastName: 'Stone',
            title: 'Operations Lead',
            email: 'avery.stone@example.com',
            phone: '303-555-0101',
            linkedIn: 'https://www.linkedin.com/in/averystone',
            isPrimary: false
          }
        }
      });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.body.data.createContact).toMatchObject({
      id: expect.stringMatching(/^contact-/),
      firstName: 'Avery',
      lastName: 'Stone',
      title: 'Operations Lead',
      email: 'avery.stone@example.com',
      phone: '303-555-0101',
      linkedIn: 'https://www.linkedin.com/in/averystone',
      isPrimary: false,
      clientIds: ['my-1']
    });

    const contactId = createResponse.body.data.createContact.id;

    const contactResponse = await request(app)
      .post('/graphql')
      .send({
        query: `
          query ContactAndClient($contactId: ID!, $clientId: ID!) {
            contact(id: $contactId) {
              id
              firstName
              lastName
              clientIds
            }
            client(id: $clientId) {
              id
              contactIds
            }
          }
        `,
        variables: {
          contactId,
          clientId: 'my-1'
        }
      });

    expect(contactResponse.statusCode).toBe(200);
    expect(contactResponse.body.data.contact).toEqual({
      id: contactId,
      firstName: 'Avery',
      lastName: 'Stone',
      clientIds: ['my-1']
    });
    expect(contactResponse.body.data.client).toEqual({
      id: 'my-1',
      contactIds: expect.arrayContaining(['contact-seed-my-1', contactId])
    });
  });

  it('bulk creates contacts and preserves a blank last name when provided', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });

    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation BulkCreateContacts($clientId: ID!, $inputs: [CreateContactInput!]!) {
            bulkCreateContacts(clientId: $clientId, inputs: $inputs) {
              id
              firstName
              lastName
              title
              email
              clientIds
            }
          }
        `,
        variables: {
          clientId: 'my-1',
          inputs: [
            {
              firstName: 'Yomesh',
              lastName: '',
              title: 'Senior Frontend Engineer II',
              email: 'yomesh@example.com',
              isPrimary: false
            },
            {
              firstName: 'Jordan',
              lastName: 'Smith',
              title: 'VP Sales',
              email: 'jordan@example.com',
              isPrimary: false
            }
          ]
        }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.bulkCreateContacts).toHaveLength(2);
    expect(response.body.data.bulkCreateContacts[0]).toMatchObject({
      firstName: 'Yomesh',
      lastName: '',
      title: 'Senior Frontend Engineer II',
      email: 'yomesh@example.com',
      clientIds: ['my-1']
    });
    expect(response.body.data.bulkCreateContacts[1]).toMatchObject({
      firstName: 'Jordan',
      lastName: 'Smith',
      title: 'VP Sales',
      email: 'jordan@example.com',
      clientIds: ['my-1']
    });
  });

  it('creates a client id and onboarding checklist when a prospect moves to onboarding', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });

    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation MoveProspectToOnboarding($id: ID!, $input: UpdateClientInput!) {
            updateClient(id: $id, input: $input) {
              id
              clientId
              clientStatus
              prospectStatus
              onboardingChecklist {
                agreement_signed
                property_list_created
                ach
                integration_setup
                first_file_placed
              }
            }
          }
        `,
        variables: {
          id: 'all-4',
          input: {
            prospectStatus: 'ONBOARDING'
          }
        }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.updateClient).toMatchObject({
      id: 'all-4',
      clientId: expect.stringMatching(/^CLT-/),
      clientStatus: 'ACTIVE',
      prospectStatus: 'ONBOARDING',
    });
    expect(response.body.data.updateClient.onboardingChecklist).toEqual({
      agreement_signed: false,
      property_list_created: false,
      ach: false,
      integration_setup: false,
      first_file_placed: false
    });
  });

  it('updates client metadata and allows clearing integration', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });

    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation UpdateClientMetadata($id: ID!, $input: UpdateClientInput!) {
            updateClient(id: $id, input: $input) {
              id
              metadata {
                prelegal
                settled_in_full
                integration
                tax_campaign
              }
            }
          }
        `,
        variables: {
          id: 'my-1',
          input: {
            metadata: {
              prelegal: false,
              settled_in_full: 42,
              integration: null,
              tax_campaign: false
            }
          }
        }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.updateClient).toEqual({
      id: 'my-1',
      metadata: {
        prelegal: false,
        settled_in_full: 42,
        integration: null,
        tax_campaign: false
      }
    });
  });

  it('updates client information fields through graphql', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });

    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation UpdateClientInformation($id: ID!, $input: UpdateClientInput!) {
            updateClient(id: $id, input: $input) {
              id
              unitCount
              address {
                address1
                address2
                city
                state
                zipCode
              }
            }
          }
        `,
        variables: {
          id: 'my-1',
          input: {
            unitCount: 4321,
            address: {
              address1: '123 Main St',
              address2: 'Suite 400',
              city: 'Denver',
              state: 'CO',
              zipCode: '80205'
            }
          }
        }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.updateClient).toEqual({
      id: 'my-1',
      unitCount: 4321,
      address: {
        address1: '123 Main St',
        address2: 'Suite 400',
        city: 'Denver',
        state: 'CO',
        zipCode: '80205'
      }
    });
  });

  it('updates an existing contact', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });

    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation UpdateContact($id: ID!, $input: UpdateContactInput!) {
            updateContact(id: $id, input: $input) {
              id
              firstName
              lastName
              title
              email
              phone
              linkedIn
              isPrimary
              clientIds
            }
          }
        `,
        variables: {
          id: 'contact-seed-my-1',
          input: {
            firstName: 'Jennifer',
            lastName: 'Walsh',
            title: 'Regional Director',
            email: 'jennifer.walsh@synergyproperties.com',
            phone: '303-555-1111',
            linkedIn: 'https://www.linkedin.com/in/jenniferwalsh',
            isPrimary: true
          }
        }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.updateContact).toMatchObject({
      id: 'contact-seed-my-1',
      firstName: 'Jennifer',
      lastName: 'Walsh',
      title: 'Regional Director',
      email: 'jennifer.walsh@synergyproperties.com',
      phone: '303-555-1111',
      linkedIn: 'https://www.linkedin.com/in/jenniferwalsh',
      isPrimary: true,
      clientIds: ['my-1']
    });
  });

  it('deletes a contact and removes it from linked client contact ids', async () => {
    const app = await createApp({
      dataStore: createMockDataStore()
    });

    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation DeleteContact($id: ID!) {
            deleteContact(id: $id) {
              id
              firstName
              lastName
              clientIds
            }
          }
        `,
        variables: {
          id: 'contact-seed-my-1'
        }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.deleteContact).toEqual({
      id: 'contact-seed-my-1',
      firstName: 'Jennifer',
      lastName: 'Walsh',
      clientIds: ['my-1']
    });

    const verifyResponse = await request(app)
      .post('/graphql')
      .send({
        query: `
          query VerifyDeletedContact($id: ID!, $clientId: ID!) {
            contact(id: $id) {
              id
            }
            client(id: $clientId) {
              id
              contactIds
            }
          }
        `,
        variables: {
          id: 'contact-seed-my-1',
          clientId: 'my-1'
        }
      });

    expect(verifyResponse.statusCode).toBe(200);
    expect(verifyResponse.body.data.contact).toBeNull();
    expect(verifyResponse.body.data.client.id).toBe('my-1');
    expect(verifyResponse.body.data.client.contactIds).not.toContain('contact-seed-my-1');
  });
});
