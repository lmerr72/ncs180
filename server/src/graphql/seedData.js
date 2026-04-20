const { clients } = require('./seedClients');

const DEFAULT_CURRENT_USER_ID = 'client-rep-002';

const users = [
  {
    id: 'client-rep-001',
    firstName: 'Tina',
    lastName: 'Mashburn',
    email: 'tina.m@ncs180.com',
    title: 'Sales Representative',
    role: 'sales_rep',
    initials: 'TM'
  },
  {
    id: DEFAULT_CURRENT_USER_ID,
    firstName: 'Gordon',
    lastName: 'Marshall',
    email: 'gmarshall@ncs180.com',
    title: 'Senior Sales Representative',
    role: 'sales_rep',
    initials: 'GM'
  },
  {
    id: 'client-rep-003',
    firstName: 'Gordon',
    lastName: 'Payn',
    email: 'gordon.p@ncs180.com',
    title: 'Account Executive',
    role: 'sales_rep',
    initials: 'GP'
  },
  {
    id: 'client-rep-004',
    firstName: 'Rod',
    lastName: 'Herper',
    email: 'rod.h@ncs180.com',
    title: 'Regional Sales Manager',
    role: 'sales_rep',
    initials: 'RH'
  },
  {
    id: 'client-rep-005',
    firstName: 'Heath',
    lastName: 'Lindsey',
    email: 'heath.l@ncs180.com',
    title: 'Client Success Manager',
    role: 'sales_rep',
    initials: 'HL'
  },
  {
    id: 'client-rep-006',
    firstName: 'Kim',
    lastName: 'Schott',
    email: 'kim.s@ncs180.com',
    title: 'Sales Representative',
    role: 'sales_rep',
    initials: 'KS'
  },
  {
    id: 'client-rep-007',
    firstName: 'Kristen',
    lastName: 'Muse',
    email: 'kristen.m@ncs180.com',
    title: 'Senior Sales Representative',
    role: 'sales_rep',
    initials: 'KM'
  },
  {
    id: 'client-rep-008',
    firstName: 'Pete',
    lastName: 'Mann',
    email: 'pete.m@ncs180.com',
    title: 'Account Executive',
    role: 'sales_rep',
    initials: 'PM'
  },
  {
    id: 'client-rep-009',
    firstName: 'Michael',
    lastName: 'Kucera',
    email: 'michael.k@ncs180.com',
    title: 'Regional Sales Manager',
    role: 'sales_rep',
    initials: 'MK'
  },
  {
    id: 'client-rep-010',
    firstName: 'Chris',
    lastName: 'Hilton',
    email: 'chris.h@ncs180.com',
    title: 'Client Success Manager',
    role: 'sales_rep',
    initials: 'CH'
  }
];

const contacts = [
  {
    id: 'contact-seed-my-1',
    firstName: 'Jennifer',
    lastName: 'Walsh',
    title: 'Director of Properties',
    email: 'j.walsh@synergyproperties.com',
    phone: '720-555-0142',
    linkedIn: 'https://www.linkedin.com/in/jenniferwalsh',
    isPrimary: true,
    clientIds: ['my-1']
  },
  {
    id: 'contact-seed-my-2',
    firstName: 'Marcus',
    lastName: 'Torres',
    title: 'VP of Operations',
    email: 'm.torres@apexmgmt.com',
    phone: '512-555-0287',
    linkedIn: 'https://www.linkedin.com/in/marcustorresatx',
    isPrimary: true,
    clientIds: ['my-2']
  },
  {
    id: 'contact-seed-my-3',
    firstName: 'Rachel',
    lastName: 'Kim',
    title: 'Director of Facilities',
    email: 'r.kim@summithousing.co',
    phone: '720-555-0391',
    linkedIn: 'https://www.linkedin.com/in/rachelkimco',
    isPrimary: true,
    clientIds: ['my-3']
  },
  {
    id: 'contact-seed-all-4',
    firstName: 'Kevin',
    lastName: 'Park',
    title: 'Account Manager',
    email: 'k.park@luminaryhousing.com',
    phone: '312-555-0755',
    linkedIn: 'https://www.linkedin.com/in/kevinparkil',
    isPrimary: true,
    clientIds: ['all-4']
  }
];

const tasks = [
  {
    id: 'task-seed-1',
    repId: 'client-rep-002',
    clientId: 'my-1',
    title: 'Follow up on Q2 renewal',
    description: 'Send updated renewal contract to the facilities director and confirm signature timeline.',
    taskType: 'FOLLOW_UP',
    importance: 'HIGH',
    dueDate: '2026-04-06',
    completed: false,
    commType: 'EMAIL'
  },
  {
    id: 'task-seed-2',
    repId: 'client-rep-002',
    clientId: 'my-2',
    title: 'Call Apex Management about training',
    description: 'Confirm attendees and agenda for the upcoming implementation training session.',
    taskType: 'TRAINING',
    importance: 'MEDIUM',
    dueDate: '2026-04-07',
    completed: false,
    commType: 'PHONE'
  },
  {
    id: 'task-seed-3',
    repId: 'client-rep-002',
    clientId: null,
    title: 'Prepare prospecting list for Denver',
    description: 'Build a new list of ownership groups to target this week.',
    taskType: 'PROSPECTING',
    importance: 'LOW',
    dueDate: '2026-04-09',
    completed: true,
    commType: null
  }
];

const auditLogs = [
  {
    id: 'audit-seed-my-1-1',
    clientId: 'my-1',
    action: 'Prospect created',
    author: 'Gordon Marshall',
    repId: '',
    timestamp: '2024-12-15T14:30:00.000Z',
    type: 'create'
  },
  {
    id: 'audit-seed-my-1-2',
    clientId: 'my-1',
    action: 'Primary contact updated to Jennifer Walsh',
    author: 'Gordon Marshall',
    repId: '',
    timestamp: '2025-12-02T09:05:00.000Z',
    type: 'edit'
  }
];

function createDefaultOnboardingChecklist() {
  return {
    agreement_signed: false,
    property_list_created: false,
    ach: false,
    integration_setup: false,
    first_file_placed: false
  };
}

function createDefaultClientMetadata() {
  return {
    prelegal: false,
    settled_in_full: 0,
    integration: '',
    tax_campaign: false
  };
}

function toDate(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function serializeDate(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function serializeDateTime(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

function mapUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    title: user.title,
    role: user.role,
    initials: user.initials
  };
}

function mapContact(contact) {
  return {
    id: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    title: contact.title,
    email: contact.email,
    phone: contact.phone,
    linkedIn: contact.linkedIn,
    isPrimary: contact.isPrimary,
    clientIds: contact.clientIds ?? []
  };
}

function mapClient(client) {
  const hasAddress = client.city && client.state;

  return {
    id: client.id,
    clientId: client.clientId,
    companyName: client.companyName,
    assignedRepId: client.assignedRepId,
    createdDate: serializeDate(client.createdDate),
    createdClientDate: serializeDate(client.createdClientDate),
    activeClientDate: serializeDate(client.activeClientDate),
    archiveDate: serializeDate(client.archiveDate),
    dbas: client.dbas ?? [],
    isCorporate: client.isCorporate,
    corporateId: client.corporateId,
    firstFilePlacementDate: serializeDate(client.firstFilePlacementDate),
    mostRecentFilePlacementDate: serializeDate(client.mostRecentFilePlacementDate),
    clientStatus: client.clientStatus,
    prospectStatus: client.prospectStatus,
    website: client.website,
    linkedIn: client.linkedIn,
    address: hasAddress
      ? {
          address1: client.address1,
          address2: client.address2,
          city: client.city,
          state: client.state,
          zipCode: client.zipCode
        }
      : null,
    contactIds: client.contactIds ?? [],
    unitCount: client.unitCount,
    onboardingChecklist: buildOnboardingChecklist(client.clientStatus),
    metadata: {
      ...createDefaultClientMetadata(),
      ...(client.metadata ?? {})
    }
  };
}

function mapAuditLog(entry) {
  return {
    id: entry.id,
    clientId: entry.clientId,
    action: entry.action,
    author: entry.author,
    repId: entry.repId,
    timestamp: serializeDateTime(entry.timestamp),
    type: entry.type
  };
}

function mapTask(task, client = null) {
  return {
    id: task.id,
    clientId: task.clientId,
    repId: task.repId,
    title: task.title,
    description: task.description,
    taskType: task.taskType,
    importance: task.importance,
    dueDate: serializeDate(task.dueDate),
    completed: Boolean(task.completed),
    commType: task.commType ?? null,
    client: client ? mapClient(client) : null
  };
}

function buildOnboardingChecklist(status) {
  if (status === 'active') {
    return    {    
      agreement_signed: true,
      property_list_created: true,
      ach: true,
      integration_setup: true,
      first_file_placed: true
    }
  } else {
    return {
      agreement_signed: false,
      property_list_created: false,
      ach: false,
      integration_setup: false,
      first_file_placed: false
    }
  }
}

function buildClientRecord(input, overrides = {}) {
  const timestamp = Date.now().toString();
  const suffix = timestamp.slice(-6);
  const today = new Date().toISOString().slice(0, 10);
  const hasOverride = (key) => Object.prototype.hasOwnProperty.call(overrides, key);

  return {
    id: hasOverride('id') ? overrides.id : `client-${timestamp}`,
    clientId: hasOverride('clientId') ? overrides.clientId : `CLT-${suffix}`,
    companyName: input.companyName.trim(),
    assignedRepId: input.assignedRepId || null,
    createdDate: hasOverride('createdDate') ? overrides.createdDate : today,
    createdClientDate: hasOverride('createdClientDate') ? overrides.createdClientDate : today,
    activeClientDate: hasOverride('activeClientDate') ? overrides.activeClientDate : null,
    archiveDate: hasOverride('archiveDate') ? overrides.archiveDate : null,
    dbas: input.dbas ?? [],
    isCorporate: input.isCorporate ?? false,
    corporateId: hasOverride('corporateId') ? overrides.corporateId : `CORP-${suffix}`,
    firstFilePlacementDate: hasOverride('firstFilePlacementDate') ? overrides.firstFilePlacementDate : null,
    mostRecentFilePlacementDate: hasOverride('mostRecentFilePlacementDate') ? overrides.mostRecentFilePlacementDate : null,
    clientStatus: hasOverride('clientStatus') ? overrides.clientStatus : 'PROSPECTING',
    prospectStatus: hasOverride('prospectStatus') ? overrides.prospectStatus : null,
    website: input.website || null,
    linkedIn: input.linkedIn || null,
    address1: input.address?.address1 || null,
    address2: input.address?.address2 || null,
    city: input.address?.city || null,
    state: input.address?.state || null,
    zipCode: input.address?.zipCode || null,
    contactIds: input.contactIds ?? [],
    unitCount: input.unitCount ?? 0,
    onboardingChecklist: hasOverride('onboardingChecklist')
      ? overrides.onboardingChecklist
      : createDefaultOnboardingChecklist(),
    metadata: hasOverride('metadata') ? overrides.metadata : createDefaultClientMetadata()
  };
}

function toPrismaUserCreateManyInput() {
  return users.map((user) => ({
    ...user
  }));
}

function buildPrismaOnboardingChecklist(client) {
  const hasPrimaryContact = (client.contactIds ?? []).length > 0;
  const hasFilePlaced = Boolean(client.firstFilePlacementDate);

  return {
    id: `onboarding-checklist-${client.id}`,
    agreement_signed: false,
    property_list_created: hasPrimaryContact,
    ach: false,
    integration_setup: false,
    first_file_placed: hasFilePlaced
  };
}

function toPrismaOnboardingChecklistCreateManyInput() {
  return clients.map((client) => buildPrismaOnboardingChecklist(client));
}

function toPrismaClientCreateManyInput() {
  return clients.map((client) => ({
    ...client,
    onboardingChecklistId: `onboarding-checklist-${client.id}`,
    createdDate: toDate(client.createdDate),
    createdClientDate: toDate(client.createdClientDate),
    activeClientDate: toDate(client.activeClientDate),
    archiveDate: toDate(client.archiveDate),
    firstFilePlacementDate: toDate(client.firstFilePlacementDate),
    mostRecentFilePlacementDate: toDate(client.mostRecentFilePlacementDate)
  }));
}

function toPrismaContactCreateManyInput() {
  return contacts.map((contact) => ({
    ...contact
  }));
}

function toPrismaTaskCreateManyInput() {
  return tasks.map((task) => ({
    ...task,
    dueDate: toDate(task.dueDate)
  }));
}

module.exports = {
  DEFAULT_CURRENT_USER_ID,
  auditLogs,
  buildClientRecord,
  clients,
  contacts,
  tasks,
  mapAuditLog,
  mapClient,
  mapContact,
  mapTask,
  mapUser,
  serializeDate,
  serializeDateTime,
  toPrismaClientCreateManyInput,
  toPrismaContactCreateManyInput,
  toPrismaOnboardingChecklistCreateManyInput,
  toPrismaTaskCreateManyInput,
  toPrismaUserCreateManyInput,
  users
};
