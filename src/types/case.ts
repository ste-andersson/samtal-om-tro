export interface Case {
  id: string;
  name: string;
  address: string;
  caseNumber: string;
}

export const cases: Case[] = [
  {
    id: '1',
    name: 'Masthuggets Vårdcentral',
    address: 'Fjärde Långgatan 48',
    caseNumber: '14K1-017313'
  },
  {
    id: '2',
    name: 'GTG – Tekniska Gymnasiet',
    address: 'Diagonalen 6',
    caseNumber: '14K1-017317'
  },
  {
    id: '3',
    name: 'Högsbotorps Vård- och omsorgsboende',
    address: 'Markmyntsgatan 14',
    caseNumber: '14K1-017320'
  },
  {
    id: '4',
    name: 'Havskrogen Storkök & Catering',
    address: 'Södra Hamngatan 88, 411 05 Göteborg',
    caseNumber: '14K1-022102'
  },
  {
    id: '5',
    name: 'Kulturhuset Skeppet',
    address: 'Skeppsbron 31, 414 59 Göteborg',
    caseNumber: '14K1-022104'
  },
  {
    id: '6',
    name: 'Teknikhuset Innovate',
    address: 'Teknikgatan 5, 412 55 Göteborg',
    caseNumber: '14K1-022105'
  }
];