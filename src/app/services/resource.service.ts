import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {AuthenticationService} from './authentication.service';
import {environment} from '../../environments/environment';
import {Provider, Service, ServiceHistory, Vocabulary, Type, Datasource, Bundle} from '../entities/eic-model';
import {Paging,} from '../entities/paging';
import {URLParameter} from '../entities/url-parameter';
import {PortfolioMap, ServiceSnippet} from '../entities/portfolioMap';


@Injectable()
export class ResourceService {

  base = environment.API_ENDPOINT;
  private options = {withCredentials: true};

  constructor(public http: HttpClient, public authenticationService: AuthenticationService) {}

  static removeNulls(obj) {
    const isArray = obj instanceof Array;
    for (const k in obj) {
      if (obj[k] === null || obj[k] === '') {
        isArray ? obj.splice(Number(k), 1) : delete obj[k];
      } else if (typeof obj[k] === 'object') {
        if (typeof obj[k].value !== 'undefined' && typeof obj[k].lang !== 'undefined') {
          if (obj[k].value === '' && obj[k].lang === 'en') {
            obj[k].lang = '';
          }
        }
        ResourceService.removeNulls(obj[k]);
      }
      if (obj[k] instanceof Array && obj[k].length === 0) {
        delete obj[k];
      } else if (obj[k] instanceof Array) {
        for (const l in obj[k]) {
          if (obj[k][l] === null || obj[k][l] === '') {
            delete obj[k][l];
          }
        }
      }
    }
  }

  getServiceOrDatasource(resourceId: string) { //todo: get rid of this
    return this.http.get<Service | Datasource>(this.base + `/catalogue-resources/${resourceId}`, this.options);
  }

  search(urlParameters: URLParameter[]) {
    let searchQuery = new HttpParams();
    for (const urlParameter of urlParameters) {
      for (const value of urlParameter.values) {
        searchQuery = searchQuery.append(urlParameter.key, value);
      }
    }
    return this.http.get<Paging<Service>>(this.base + `/services?${searchQuery.toString()}`, this.options);
  }

  getBundleOfServices(urlParameters?: URLParameter[]) {
    let searchQuery = new HttpParams();
    for (const urlParameter of urlParameters) {
      for (const value of urlParameter.values) {
        searchQuery = searchQuery.append(urlParameter.key, value);
      }
    }
    return this.http.get<Paging<Bundle<Service>>>(this.base + '/bundles/services', {params: searchQuery}); //former /catalogue-resources/bundles
  }

  getBundleOfDatasources(urlParameters?: URLParameter[]) {
    let searchQuery = new HttpParams();
    for (const urlParameter of urlParameters) {
      for (const value of urlParameter.values) {
        searchQuery = searchQuery.append(urlParameter.key, value);
      }
    }
    return this.http.get<Paging<Bundle<Datasource>>>(this.base + '/bundles/datasources', {params: searchQuery});
  }

  getResourceTypeById(id: string) {
    return this.http.get(this.base + `/catalogue-resources/${id}/resourceType`);
  }

  searchWithDatasource(urlParameters: URLParameter[]) {
    let searchQuery = new HttpParams();
    for (const urlParameter of urlParameters) {
      for (const value of urlParameter.values) {
        searchQuery = searchQuery.append(urlParameter.key, value);
      }
    }
    return this.http.get<Paging<Service | Datasource>>(this.base + `/catalogue-resources?active=true`, {params: searchQuery});
  }

  getServicesSnippetByUserContentAndPortfolioType(userType: string, portfolioType?: string) {
    const url = (portfolioType ? `/services?quantity=100&users=${userType}&portfolios=${portfolioType}` : `/services?quantity=100&users=${userType}`);
    return this.http.get<Paging<Service>>(this.base + url, this.options);
  }

  getVocabularyById(id: string) {
    return this.http.get<Vocabulary>(this.base + `/vocabularies/${id}`);
  }

  getAllVocabulariesByType() {
    return this.http.get<Map<Type, Vocabulary[]>>(this.base + `/vocabularies/byType`);
  }

  getNewVocabulariesByType(type: string) {
    return this.http.get<Vocabulary[]>(this.base + `/vocabularies/byType/${type}`);
  }

  getUiVocabularies() {
    return this.http.get<Map<string, object[]>>(this.base + `/vocabularies/mappings`);
  }

  getServicesByVocabularyTypeAndId(type: string, id?: string) {
    if (id) {
      let params = new HttpParams();
      params = params.append(type, id);
      params = params.append('quantity','100');
      return this.http.get<Paging<Service>>(this.base + `/services`, {params});
    } else {
      return this.http.get<Paging<Service>>(this.base + `/services`);
    }
  }

  getServicesByIdArray(idArray: string[]) {
    return this.http.get<Service[]>(this.base + `/services/ids/${idArray.toString()}`);
  }

  getResourcesGroupedByField(field: string, active?: boolean) {
    if (active) return this.http.get<Map<string, Service[] | Datasource[]>>(this.base + `/catalogue-resources/by/${field}?active=true`);
    return this.http.get<Map<string, Service[] | Datasource[]>>(this.base + `/catalogue-resources/by/${field}`);
  }

  getMyServiceProviders() {
    return this.http.get<Provider[]>(this.base + '/providers/my');
  }

  postService(service: Service) {
    return this.http.post<Service>(this.base + '/services', service, this.options);
  }

  getService(serviceId: string) {
    return this.http.get<Service>(this.base + `/services/${serviceId}`);
  }

  editService(service: Service) {
    return this.http.put<Service>(this.base + `/services/${service.id}`, service, this.options);
  }

  postDatasource(datasource: Datasource) {
    return this.http.post<Datasource>(this.base + '/datasources', datasource, this.options);
  }

  getDatasource(datasourceId: string) {
    return this.http.get<Datasource>(this.base + `/datasources/${datasourceId}`);
  }

  editDatasource(datasource: Datasource) {
    return this.http.put<Datasource>(this.base + `/datasources/${datasource.id}`, datasource, this.options);
  }

  getServiceHistory(serviceId: string) {
    return this.http.get<Paging<ServiceHistory>>(this.base + `/service/history/${serviceId}/`);
  }

  getServiceOrDatasourceBundle(resourceId: string) {
    return this.http.get<Bundle<Service | Datasource>>(this.base + `/catalogue-resources/bundles/${resourceId}/`);
  }

  verifyService(id: string, active: boolean, status: string) {
    return this.http.patch(this.base + `/bundles/services/${id}/verify?active=${active}&status=${status}`, {}, this.options);
  }

  publishService(id: string, active: boolean) { // toggles active/inactive service
    return this.http.patch(this.base + `/bundles/services/${id}/publish?active=${active}`, this.options);
  }

  deleteService(id: string) {
    return this.http.delete(this.base + `/services/${id}`, this.options);
  }

  verifyDatasource(id: string, active: boolean, status: string) {
    return this.http.patch(this.base + `/bundles/datasources/${id}/verify?active=${active}&status=${status}`, {}, this.options);
  }

  publishDatasource(id: string, active: boolean) { // toggles active/inactive service
    return this.http.patch(this.base + `/bundles/datasources/${id}/publish?active=${active}`, this.options);
  }

  deleteDatasource(id: string) {
    return this.http.delete(this.base + `/datasources/${id}`, this.options);
  }

  getDatasourceByServiceId(serviceId: string){
    return this.http.get<Datasource>(this.base + `/datasources/byService/${serviceId}`, this.options);
  }
}
