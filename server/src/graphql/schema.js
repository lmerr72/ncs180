const typeDefs = `
  type Query {
    health: HealthStatus!
    currentUser: UserProfile!
    users: [UserProfile!]!
    allClients: [Client!]!
    prospects: [Client!]!
    myClients: [Client!]!
    client(id: ID!): Client
    tasks(repId: ID!, clientId: ID): [Task!]!
    auditLogEntries(clientId: ID!, startDate: String, endDate: String): [AuditLogEntry!]!
    contacts(clientId: ID!): [Contact!]!
    contact(id: ID!): Contact
  }

  type Mutation {
    createClient(input: CreateClientInput!): Client!
    createProspect(input: CreateProspectInput!): Client!
    updateClient(id: ID!, input: UpdateClientInput!): Client!
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Task!
    createAuditLogEntry(input: CreateAuditLogEntryInput!): AuditLogEntry!
    createContact(clientId: ID!, input: CreateContactInput!): Contact!
    bulkCreateContacts(clientId: ID!, inputs: [CreateContactInput!]!): [Contact!]!
    updateContact(id: ID!, input: UpdateContactInput!): Contact!
    deleteContact(id: ID!): Contact!
  }

  type HealthStatus {
    status: String!
    service: String!
  }

  type UserProfile {
    id: ID!
    firstName: String!
    lastName: String!
    email: String
    title: String
    role: String!
    initials: String!
  }

  type Contact {
    id: ID!
    firstName: String!
    lastName: String!
    title: String
    email: String
    phone: String
    linkedIn: String
    isPrimary: Boolean
    clientIds: [String!]!
  }

  type AuditLogEntry {
    id: ID!
    clientId: ID!
    action: String!
    author: String!
    repId: String!
    timestamp: String!
    type: String!
  }

  enum TaskType {
    PROSPECTING
    FOLLOW_UP
    TRAINING
    OTHER
  }

  enum Importance {
    LOW
    MEDIUM
    HIGH
  }

  enum TaskCommType {
    EMAIL
    PHONE
  }

  type Task {
    id: ID!
    clientId: ID
    repId: ID!
    title: String!
    description: String!
    taskType: TaskType!
    importance: Importance!
    dueDate: String!
    completed: Boolean!
    commType: TaskCommType
    client: Client
  }

  enum ClientStatus {
    ACTIVE
    INACTIVE
    PROSPECTING
    ONBOARDING
  }

  enum ProspectStatus {
    VERBAL
    NOT_STARTED
    IN_COMMUNICATION
    AWAITING_REVIEW
    CLOSED
  }

  type Address {
    address1:String
    address2:String
    city:String!
    state:String!
    zipCode:String
  }

  input AddressInput {
    address1:String
    address2:String
    city:String!
    state:String!
    zipCode:String
  }

  input CreateClientInput {
    companyName: String!
    assignedRepId: ID
    dbas: [String!]
    isCorporate: Boolean
    website: String
    linkedIn: String
    address: AddressInput!
    contactIds: [String!]
    unitCount: Int
  }

  input CreateProspectInput {
    companyName: String!
    assignedRepId: ID
    dbas: [String!]
    isCorporate: Boolean
    website: String
    linkedIn: String
    address: AddressInput!
    contactIds: [String!]
    unitCount: Int
    prospectStatus: ProspectStatus!
  }

  input CreateContactInput {
    firstName: String!
    lastName: String!
    title: String
    email: String
    phone: String
    linkedIn: String
    isPrimary: Boolean
  }

  input CreateTaskInput {
    repId: ID!
    clientId: ID
    title: String!
    description: String!
    taskType: TaskType!
    importance: Importance!
    dueDate: String!
    completed: Boolean
    commType: TaskCommType
  }

  input UpdateClientInput {
    clientStatus: ClientStatus
    prospectStatus: ProspectStatus
    createdClientDate: String
    metadata: ClientMetadataInput
  }

  input ClientMetadataInput {
    prelegal: Boolean
    settled_in_full: Float
    integration: String
    tax_campaign: Boolean
  }

  input UpdateTaskInput {
    clientId: ID
    title: String
    description: String
    taskType: TaskType
    importance: Importance
    dueDate: String
    completed: Boolean
    commType: TaskCommType
  }

  input UpdateContactInput {
    firstName: String!
    lastName: String!
    title: String
    email: String
    phone: String
    linkedIn: String
    isPrimary: Boolean
  }

  input CreateAuditLogEntryInput {
    clientId: ID!
    action: String!
    author: String!
    repId: String!
    timestamp: String
    type: String!
  }

  type File {
    clientId: ID!
    uploadDate: String!
    workingDate: String
  }

  type OnboardingChecklist {
    agreement_signed: Boolean!
    property_list_created: Boolean!
    ach: Boolean!
    integration_setup: Boolean!
    first_file_placed: Boolean!
  }

  type ClientMetadata {
    prelegal: Boolean!
    settled_in_full: Float!
    integration: String
    tax_campaign: Boolean!
  }

  type Client {
    id: ID!
    clientId: ID
    companyName: String!
    assignedRepId: ID
    createdDate: String!
    createdClientDate: String
    activeClientDate: String
    archiveDate: String
    dbas: [String]
    isCorporate: Boolean
    corporateId: ID!
    firstFilePlacementDate: String
    mostRecentFilePlacementDate: String
    clientStatus: ClientStatus
    prospectStatus: ProspectStatus
    website:String
    linkedIn:String
    address: Address
    contactIds:[String]
    unitCount: Int!
    onboardingChecklist: OnboardingChecklist
    metadata: ClientMetadata!
  }
`;

const resolvers = {
  Query: {
    health: () => ({
      status: 'ok',
      service: 'server'
    }),
    currentUser: async (_parent, _args, { dataStore, currentUserId }) =>
      dataStore.getCurrentUser(currentUserId),
    users: async (_parent, _args, { dataStore }) => dataStore.getUsers(),
    allClients: async (_parent, _args, { dataStore }) => dataStore.getAllClients(),
    prospects: async (_parent, _args, { dataStore, currentUserId }) =>
      dataStore.getProspects(currentUserId),
    myClients: async (_parent, _args, { dataStore, currentUserId }) =>
      dataStore.getMyClients(currentUserId),
    client: async (_parent, { id }, { dataStore }) => dataStore.getClientById(id),
    tasks: async (_parent, { repId, clientId }, { dataStore }) =>
      dataStore.getTasks(repId, clientId),
    auditLogEntries: async (_parent, { clientId, startDate, endDate }, { dataStore }) =>
      dataStore.getAuditLogEntries(clientId, startDate, endDate),
    contacts: async (_parent, { clientId }, { dataStore }) =>
      dataStore.getContactsByClientId(clientId),
    contact: async (_parent, { id }, { dataStore }) => dataStore.getContactById(id)
  },
  Mutation: {
    createClient: async (_parent, { input }, { dataStore }) => dataStore.createClient(input),
    createProspect: async (_parent, { input }, { dataStore }) =>
      dataStore.createProspect(input),
    updateClient: async (_parent, { id, input }, { dataStore }) =>
      dataStore.updateClient(id, input),
    createTask: async (_parent, { input }, { dataStore }) => dataStore.createTask(input),
    updateTask: async (_parent, { id, input }, { dataStore }) => dataStore.updateTask(id, input),
    deleteTask: async (_parent, { id }, { dataStore }) => dataStore.deleteTask(id),
    createAuditLogEntry: async (_parent, { input }, { dataStore }) =>
      dataStore.createAuditLogEntry(input),
    createContact: async (_parent, { clientId, input }, { dataStore }) =>
      dataStore.createContact(clientId, input),
    bulkCreateContacts: async (_parent, { clientId, inputs }, { dataStore }) =>
      dataStore.bulkCreateContacts(clientId, inputs),
    updateContact: async (_parent, { id, input }, { dataStore }) =>
      dataStore.updateContact(id, input),
    deleteContact: async (_parent, { id }, { dataStore }) =>
      dataStore.deleteContact(id)
  }
};

module.exports = {
  typeDefs,
  resolvers
};
