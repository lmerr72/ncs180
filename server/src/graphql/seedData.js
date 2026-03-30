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

const clients = [
  {
    id: 'my-1',
    clientId: 'CLT-1001',
    companyName: 'Synergy Properties',
    assignedRepId: 'client-rep-002',
    createdDate: '2021-03-15',
    createdClientDate: '2021-03-15',
    activeClientDate: '2021-04-01',
    archiveDate: null,
    dbas: ['Synergy Residential'],
    isCorporate: true,
    corporateId: 'CORP-1001',
    firstFilePlacementDate: '2021-06-01',
    mostRecentFilePlacementDate: '2025-11-15',
    clientStatus: 'ACTIVE',
    prospectStatus: null,
    website: 'https://synergy.example.com',
    linkedIn: 'https://linkedin.com/company/synergy-properties',
    address1: '1500 Blake St',
    address2: 'Suite 400',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    contactIds: ['contact-seed-my-1'],
    unitCount: 3200
  },
  {
    id: 'my-2',
    clientId: 'CLT-1002',
    companyName: 'Apex Management',
    assignedRepId: 'client-rep-002',
    createdDate: '2020-08-20',
    createdClientDate: '2020-08-20',
    activeClientDate: '2020-09-10',
    archiveDate: null,
    dbas: [],
    isCorporate: true,
    corporateId: 'CORP-1002',
    firstFilePlacementDate: '2020-10-15',
    mostRecentFilePlacementDate: '2026-01-20',
    clientStatus: 'ACTIVE',
    prospectStatus: null,
    website: 'https://apex.example.com',
    linkedIn: 'https://linkedin.com/company/apex-management',
    address1: '500 Congress Ave',
    address2: null,
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    contactIds: ['contact-seed-my-2'],
    unitCount: 8500
  },
  {
    id: 'my-3',
    clientId: 'CLT-1003',
    companyName: 'Summit Housing',
    assignedRepId: 'client-rep-002',
    createdDate: '2022-01-10',
    createdClientDate: '2022-01-10',
    activeClientDate: '2022-02-01',
    archiveDate: null,
    dbas: ['Summit Communities'],
    isCorporate: false,
    corporateId: 'CORP-1003',
    firstFilePlacementDate: '2022-03-05',
    mostRecentFilePlacementDate: '2025-08-12',
    clientStatus: 'ACTIVE',
    prospectStatus: null,
    website: 'https://summit.example.com',
    linkedIn: 'https://linkedin.com/company/summit-housing',
    address1: '1700 Lincoln St',
    address2: null,
    city: 'Denver',
    state: 'CO',
    zipCode: '80203',
    contactIds: ['contact-seed-my-3'],
    unitCount: 2150
  },
  {
    id: 'all-4',
    clientId: 'CLT-1014',
    companyName: 'Luminary Housing',
    assignedRepId: 'client-rep-005',
    createdDate: '2022-09-12',
    createdClientDate: '2022-09-12',
    activeClientDate: null,
    archiveDate: null,
    dbas: [],
    isCorporate: true,
    corporateId: 'CORP-1014',
    firstFilePlacementDate: null,
    mostRecentFilePlacementDate: '2026-02-25',
    clientStatus: 'PROSPECTING',
    prospectStatus: 'IN_COMMUNICATION',
    website: 'https://luminary.example.com',
    linkedIn: 'https://linkedin.com/company/luminary-housing',
    address1: '200 W Monroe St',
    address2: 'Floor 12',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60606',
    contactIds: ['contact-seed-all-4'],
    unitCount: 3900
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
    unitCount: client.unitCount
  };
}

function buildClientRecord(input, overrides = {}) {
  const timestamp = Date.now().toString();
  const suffix = timestamp.slice(-6);
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: overrides.id ?? `client-${timestamp}`,
    clientId: overrides.clientId ?? `CLT-${suffix}`,
    companyName: input.companyName.trim(),
    assignedRepId: input.assignedRepId || null,
    createdDate: overrides.createdDate ?? today,
    createdClientDate: overrides.createdClientDate ?? today,
    activeClientDate: overrides.activeClientDate ?? null,
    archiveDate: overrides.archiveDate ?? null,
    dbas: input.dbas ?? [],
    isCorporate: input.isCorporate ?? false,
    corporateId: overrides.corporateId ?? `CORP-${suffix}`,
    firstFilePlacementDate: overrides.firstFilePlacementDate ?? null,
    mostRecentFilePlacementDate: overrides.mostRecentFilePlacementDate ?? null,
    clientStatus: overrides.clientStatus ?? 'PROSPECTING',
    prospectStatus: overrides.prospectStatus ?? null,
    website: input.website || null,
    linkedIn: input.linkedIn || null,
    address1: input.address?.address1 || null,
    address2: input.address?.address2 || null,
    city: input.address?.city || null,
    state: input.address?.state || null,
    zipCode: input.address?.zipCode || null,
    contactIds: input.contactIds ?? [],
    unitCount: input.unitCount ?? 0
  };
}

function toPrismaUserCreateManyInput() {
  return users.map((user) => ({
    ...user
  }));
}

function toPrismaClientCreateManyInput() {
  return clients.map((client) => ({
    ...client,
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

module.exports = {
  DEFAULT_CURRENT_USER_ID,
  buildClientRecord,
  clients,
  contacts,
  mapContact,
  mapClient,
  mapUser,
  serializeDate,
  toPrismaClientCreateManyInput,
  toPrismaContactCreateManyInput,
  toPrismaUserCreateManyInput,
  users
};
