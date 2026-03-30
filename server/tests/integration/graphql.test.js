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
          { id: 'my-1', companyName: 'Synergy Properties' },
          { id: 'my-2', companyName: 'Apex Management' },
          { id: 'my-3', companyName: 'Summit Housing' }
        ]
      }
    });
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
});
