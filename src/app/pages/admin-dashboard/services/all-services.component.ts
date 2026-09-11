import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Paging} from '../../../entities/paging';
import {Bundle, Service, Vocabulary} from '../../../entities/eic-model';
import {ResourceService} from '../../../services/resource.service';
import {URLParameter} from '../../../entities/url-parameter';
import {FacetValue} from '../../../entities/facet';

declare let UIkit: any;

@Component({
  selector: 'app-admin-all-services-dashboard',
  templateUrl: 'all-services.component.html',
  standalone: false
})

export class AllServicesDashboardComponent implements OnInit {

  services: Paging<Bundle<Service>> = null;
  selectedService: Bundle<Service> = null;
  resourceState: Vocabulary[] = null;
  providerFacet: FacetValue[] = [];
  queryParams: URLParameter[] = [];

  // Paging
  pages: number[] = [];
  offset = 2;
  pageSize = 9;
  totalPages = 0;
  currentPage = 0;

  // Filter
  order: string = null;
  activeStatus = '';
  status: string = null;
  provider: string = null;

  showLoader = false;
  errorMessage: string;
  loadingMessage = '';

  constructor(private route: ActivatedRoute, private router: Router, private resourceService: ResourceService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      let found = false;
      this.queryParams.splice(0, this.queryParams.length);
      for (const obj in params) {
        if (params.hasOwnProperty(obj)) {
          if (obj === 'quantity')
            found = true;
          const urlParameter: URLParameter = {
            key: obj,
            values: params[obj].split(',')
          };
          this.queryParams.push(urlParameter);
        }
      }
      if (!found) {
        this.updateURLParameters('quantity', this.pageSize);
      }
      this.setFilters();
      this.getResources();
    });
    // this.resourceService.getBundleOfServices(this.queryParams).subscribe(
    //   res => {
    //     this.services = res;
    //     res.facets.forEach(facet => {
    //       if (facet.field === 'resource_providers') {
    //         this.providerFacet = facet.values;
    //         return;
    //       }
    //     });
    //   },
    //   error => {console.error(error)},
    //   () => {this.paginationInit()}
    // );

    this.resourceService.getNewVocabulariesByType('Resource state').subscribe(
      res => {
        this.resourceState = res;
        // this.loading = false;
      },
    );
  }

    getResources() {
      this.resourceService.getBundleOfServices(this.queryParams).subscribe(
        res => {
          this.services = res;
          res.facets.forEach(facet => {
            if (facet.field === 'resource_organisation') {
              this.providerFacet = facet.values;
              return;
            }
          });
        },
        error => console.error(error),
        () => this.paginationInit()
      );
    }

  /** Pagination and Paging navigation -------------> **/
  paginationInit() {
    let addToEndCounter = 0;
    let addToStartCounter = 0;
    this.totalPages = Math.ceil(this.services.total/this.pageSize);
    this.currentPage = Math.ceil(this.services.from/this.pageSize) + 1;
    this.pages = [];
    for (let i = (+this.currentPage - this.offset); i < (+this.currentPage + 1 + this.offset); ++i ) {
      if ( i < 1 ) { addToEndCounter++; }
      if ( i > this.totalPages ) { addToStartCounter++; }
      if ((i >= 1) && (i <= this.totalPages)) {
        this.pages.push(i);
      }
    }
    for ( let i = 0; i < addToEndCounter; ++i ) {
      if (this.pages.length < this.totalPages) {
        this.pages.push(this.pages.length + 1);
      }
    }
    for ( let i = 0; i < addToStartCounter; ++i ) {
      if (this.pages[0] > 1) {
        this.pages.unshift(this.pages[0] - 1 );
      }
    }
  }

  goToPage(page: number) {
    this.updateURLParameters('from', (page) * this.pageSize);
    return this.navigateUsingParameters();
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updateURLParameters('from', (this.currentPage-1)*this.pageSize);
      this.navigateUsingParameters();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateURLParameters('from', (this.currentPage-1)*this.pageSize);
      this.navigateUsingParameters();
    }
  }

  filterSelection(key: string, value: string | string[]) {
    if (key === 'order' && value === null)
      this.updateURLParameters('orderField', null);

    this.updateURLParameters(key, value);
    this.updateURLParameters('from', '0');
    return this.navigateUsingParameters();
  }

  /** <------------- Pagination and Paging navigation **/

  /** Handle query params and navigation ---------------> **/
  updateURLParameters(key: string, value) {
    if (value instanceof Object) {
      value = value['$ngOptionValue'];
    }
    if (value === null) {
      this.queryParams = this.queryParams.filter(params => {return params.key != key;});
      return;
    }
    for (const urlParameter of this.queryParams) {
      if (urlParameter.key === key) {
        urlParameter.values = [value];
        return;
      }
    }
    this.queryParams.push({key, values: [value]});
  }

  navigateUsingParameters() {
    const map: { [name: string]: string } = {};
    for (const urlParameter of this.queryParams) {
      map[urlParameter.key] = urlParameter.values.join(',');
    }
    return this.router.navigate(['/admin/services'], {queryParams: map});
  }
  /** <--------------- Handle query params and navigation **/

  /** Set filters -------------> **/

  setFilters() {
    for (let i = 0; i < this.queryParams.length; i++) {
      if (this.queryParams[i].key === 'active') {
        this.activeStatus = this.queryParams[i].values[0];
        continue;
      }
      if (this.queryParams[i].key === 'status') {
        this.status = this.queryParams[i].values[0];
        continue;
      }
      if (this.queryParams[i].key === 'order') {
        this.order = this.queryParams[i].values[0];
      }
    }
  }

  /** <------------- Set filters  **/

  verifyService(id, active, status) {
    this.resourceService.verifyService(id, active, status).subscribe(
      res => this.getResources(),
      err => console.log(err),
      () => {}
    );
  }

  toggleServiceActive(bundle: Bundle<Service>) {
    if (bundle.status === 'pending resource' || bundle.status === 'rejected resource') {
      this.errorMessage = `You cannot activate a ${bundle.status}.`;
      window.scrollTo(0, 0);
      return;
    }
    this.showLoader = true;
    this.resourceService.publishService(bundle.id, !bundle.active).subscribe(
      res => {},
      error => {
        this.showLoader = false;
        this.errorMessage = 'Something went bad. ' + error.error.error ;
      },
      () => {
        this.showLoader = false;
        this.getResources();
      }
    );
  }

  showDeletionModal(bundle: Bundle<Service>) {
    this.selectedService = bundle;
    if (this.selectedService) {
      UIkit.modal('#deletionModal').show();
    }
  }

  deleteService(bundle: Bundle<Service>) {
    this.showLoader = true;
    this.resourceService.deleteService(bundle.id).subscribe(
      res => {},
      error => {
        this.showLoader = false;
        this.errorMessage = 'Something went bad. ' + error.error ;
        // this.getResources();
      },
      () => {
        window.location.reload();
        // this.showLoader = false;
      }
    );
  }

  // getPayload(bundle : Bundle<Service | Datasource>): Service | Datasource {
  //   return bundle.service != null ? bundle.service : bundle.datasource;
  // }
}
