import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Bundle, Datasource, LoggingInfo, Provider, ProviderBundle, Service, ServiceBundle, Vocabulary} from '../../../../entities/eic-model';
import {ProviderService} from '../../../../services/provider.service';
import {ResourceService} from '../../../../services/resource.service';
import {DatePipe} from '@angular/common';
import * as moment from 'moment';

@Component({
  selector: 'app-provider-home',
  templateUrl: 'provider-home.component.html',
  standalone: false
})

export class ProviderHomeComponent implements OnInit, OnChanges {

  @Input() providerBundle: ProviderBundle = null;
  provider: Provider = null;
  loggingInfo: LoggingInfo[] = null;
  vocabularies: Map<string, Object[]> = null;
  resourceBundles: ServiceBundle[] = null;
  approvedResourceBundles: ServiceBundle[] = null;
  pendingResourceBundles: ServiceBundle[] = null;
  rejectedResourceBundles: ServiceBundle[] = null;

  constructor(private router: Router, private providerService: ProviderService, private resourceService: ResourceService, private datePipe: DatePipe) {
  }

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.resourceService.getUiVocabularies().subscribe(
      res => {this.vocabularies = res;}
    );

    if (this.providerBundle) {
      this.provider = this.providerBundle.provider;
      this.loggingInfo = this.providerBundle.loggingInfo;
      this.getResourcesOfProvider();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.providerBundle) {
      this.provider = this.providerBundle.provider;
      this.loggingInfo = this.providerBundle.loggingInfo;
    }
  }

  getPayload(bundle: ServiceBundle): Service | Datasource {
    return bundle.service != null ? bundle.service : bundle.datasource;
  }

  getResourcesOfProvider() {
    this.providerService.getServicesOfProvider(this.providerBundle.provider.id, [{key: 'orderField', values: ['modifiedAt']}, {key: 'order', values:['desc']}]).subscribe(
      res => {this.resourceBundles = res.results;},
      error => {console.error(error);},
      () => {
        this.approvedResourceBundles = this.resourceBundles.filter(bundle => bundle.status === 'approved resource');
        this.pendingResourceBundles = this.resourceBundles.filter(bundle => bundle.status === 'pending resource');
        this.rejectedResourceBundles = this.resourceBundles.filter(bundle => bundle.status === 'rejected resource');
      }
    );
  }

  getVocabularyName(vocabularyType: string, id: string): string {
    for (const vocabulary of this.vocabularies[vocabularyType]) {
      if (vocabulary.id === id)
        return vocabulary.name;
    }
  }

  // formatLogDate(logDate: string): string {
  //   const dateObject = moment(logDate, 'ddd MMM DD HH:mm:ss Z YYYY');
  //   return dateObject.format('DD MMM YYYY');
  // }

}
