import type { ClientRep } from "@/types/api";

export const MOCK_CLIENT_REP_AVATAR_COLORS: Record<string, string> = {
  "client-rep-001": "bg-red-100 text-red-700 border-red-200",
  "client-rep-002": "bg-orange-100 text-orange-700 border-orange-200",
  "client-rep-003": "bg-amber-100 text-amber-700 border-amber-200",
  "client-rep-004": "bg-green-100 text-green-700 border-green-200",
  "client-rep-005": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "client-rep-006": "bg-teal-100 text-teal-700 border-teal-200",
  "client-rep-007": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "client-rep-008": "bg-sky-100 text-sky-700 border-sky-200",
  "client-rep-009": "bg-blue-100 text-blue-700 border-blue-200",
  "client-rep-010": "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export const MOCK_CLIENT_REPS: ClientRep[] = [
  {
    "id": "client-rep-001",
    "firstName": "Tina",
    "lastName": "Mashburn",
    "companyStartDate": "2017-01-01",
    "city": "Denver",
    "state": "Colorado",
    "title": "Sales Representative",
    "role": "sales_rep",
    "timezone": "Mountain",
    "territoryStates": [
      "Colorado",
      "Utah",
      "Wyoming"
    ]
  },
  {
    "id": "client-rep-002",
    "firstName": "Gordon",
    "lastName": "Marshall",
    "companyStartDate": "2018-02-02",
    "city": "Austin",
    "state": "Texas",
    "title": "Senior Sales Representative",
    "role": "sales_rep",
    "timezone": "Central",
    "territoryStates": [
      "Texas",
      "Oklahoma",
      "New Mexico"
    ]
  },
  {
    "id": "client-rep-003",
    "firstName": "Gordon",
    "lastName": "Payn",
    "companyStartDate": "2019-03-03",
    "city": "Seattle",
    "state": "Washington",
    "title": "Account Executive",
    "role": "sales_rep",
    "timezone": "Pacific",
    "territoryStates": [
      "Washington",
      "Oregon",
      "Idaho"
    ]
  },
  {
    "id": "client-rep-004",
    "firstName": "Rod",
    "lastName": "Herper",
    "companyStartDate": "2020-04-04",
    "city": "Atlanta",
    "state": "Georgia",
    "title": "Regional Sales Manager",
    "role": "sales_rep",
    "timezone": "Eastern",
    "territoryStates": [
      "Georgia",
      "Alabama",
      "South Carolina"
    ]
  },
  {
    "id": "client-rep-005",
    "firstName": "Heath",
    "lastName": "Lindsey",
    "companyStartDate": "2021-05-05",
    "city": "Phoenix",
    "state": "Arizona",
    "title": "Client Success Manager",
    "role": "sales_rep",
    "timezone": "Mountain",
    "territoryStates": [
      "Arizona",
      "Nevada",
      "New Mexico"
    ]
  },
  {
    "id": "client-rep-006",
    "firstName": "Kim",
    "lastName": "Schott",
    "companyStartDate": "2022-06-06",
    "city": "Chicago",
    "state": "Illinois",
    "title": "Sales Representative",
    "role": "sales_rep",
    "timezone": "Central",
    "territoryStates": [
      "Illinois",
      "Indiana",
      "Wisconsin"
    ]
  },
  {
    "id": "client-rep-007",
    "firstName": "Kristen",
    "lastName": "Muse",
    "companyStartDate": "2023-07-07",
    "city": "Los Angeles",
    "state": "California",
    "title": "Senior Sales Representative",
    "role": "sales_rep",
    "timezone": "Pacific",
    "territoryStates": [
      "California",
      "Nevada",
      "Arizona"
    ]
  },
  {
    "id": "client-rep-008",
    "firstName": "Pete",
    "lastName": "Mann",
    "companyStartDate": "2017-08-08",
    "city": "Nashville",
    "state": "Tennessee",
    "title": "Account Executive",
    "role": "sales_rep",
    "timezone": "Central",
    "territoryStates": [
      "Tennessee",
      "Kentucky",
      "Arkansas"
    ]
  },
  {
    "id": "client-rep-009",
    "firstName": "Michael",
    "lastName": "Kucera",
    "companyStartDate": "2018-09-09",
    "city": "Miami",
    "state": "Florida",
    "title": "Regional Sales Manager",
    "role": "sales_rep",
    "timezone": "Eastern",
    "territoryStates": [
      "Florida",
      "Georgia",
      "South Carolina"
    ]
  },
  {
    "id": "client-rep-010",
    "firstName": "Chris",
    "lastName": "Hilton",
    "companyStartDate": "2019-10-10",
    "city": "Portland",
    "state": "Oregon",
    "title": "Client Success Manager",
    "role": "sales_rep",
    "timezone": "Pacific",
    "territoryStates": [
      "Oregon",
      "Washington",
      "California"
    ]
  }
];
