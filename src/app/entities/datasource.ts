import {Identifiable, Service} from './eic-model';

export class DatasourceDetails {
  id: string;
  openaireId: string;
  officialname: string;
  englishname: string;
  websiteurl: string;
  logourl: string;
  contactemail: string;
  latitude: number;
  longitude: number;
  namespaceprefix: string;
  languages: string;
  dateofvalidation: Date;
  eoscDatasourceType: string;
  dateofcollection: Date;
  platform: string;
  activationId: string;
  description: string;
  issn: string;
  eissn: string;
  lissn: string;
  registeredby: string;
  subjects: string;
  aggregator: string;
  collectedfrom: string;
  managed: boolean;
  registrationdate: Date;
  consentTermsOfUseDate: Date;
  lastConsentTermsOfUseDate: Date;
  consentTermsOfUse: boolean;
  fullTextDownload: boolean;
  organizations: OrganizationDetails[] = new Array<OrganizationDetails>();
  identities: IdentitiesDetails[];
  status: string;
  typology: string;
}

export class OrganizationDetails {
  legalshortname: string;
  legalname: string;
  websiteurl: string;
  logourl: string;
  country: string;
}

export class IdentitiesDetails {
  pid: string;
  issuertype: string;
}

export class DatasourceTypes {
  id: string;
  name: string;
  description: string;
  code: string;
  terms: Term[];
}

export class Term {
  englishName: string;
  nativeName: string;
  encoding: string;
  code: string;
  synonyms: string;
}
