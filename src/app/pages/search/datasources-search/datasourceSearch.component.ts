import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DatasourceDetails, DatasourceTypes} from '../../../entities/datasource';
import {URLParameter} from '../../../entities/url-parameter';
import {Paging} from '../../../entities/paging';
import {PremiumSortFacetsPipe} from '../../../shared/pipes/premium-sort.pipe';
import {AuthenticationService} from '../../../services/authentication.service';
import {DatasourceService} from '../../../services/datasource.service';
import {environment} from '../../../../environments/environment';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import {fromEvent} from 'rxjs';


@Component({
  selector: 'app-search',
  templateUrl: './datasourceSearch.component.html',
  providers: [DatasourceService]
})

export class DatasourceSearchComponent implements OnInit {

  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;

  public projectName = environment.projectName;
  searchResults: Paging<DatasourceDetails> = null;
  datasourceTypes: DatasourceTypes = null;
  private sortFacets = new PremiumSortFacetsPipe();
  searchQuery: string = null;
  eoscDatasourceType = '';
  orderField = 'registrationdate';
  order = 'desc';

  // Paging
  pages: number[] = [];
  offset = 2;
  pageSize = 20;
  totalPages = 0;
  currentPage = 0;

  errorMessage: string;
  filtersMobileShown = false;
  urlParameters: URLParameter[] = [];
  loading = false;


  constructor(public router: Router, public route: ActivatedRoute, public datasourceService: DatasourceService,
              public authenticationService: AuthenticationService) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.urlParameters.splice(0, this.urlParameters.length);
      for (const obj in params) {
        if (params.hasOwnProperty(obj)) {
          const urlParameter: URLParameter = {
            key: obj,
            values: params[obj].split(',')
          };
          this.urlParameters.push(urlParameter);
        }
      }

      this.datasourceService.getDatasources(this.urlParameters).subscribe(
        searchResults => {
          this.updateSearchResultsSnippets(searchResults);
        },
      error => {},
      () => {this.paginationInit();}
      );
    });

    this.datasourceService.getDatasourceTypes().subscribe(
      res => {this.datasourceTypes = res;},
      error => {console.log(error);}
    );

    fromEvent(this.searchInput.nativeElement, 'keyup').pipe(
      map((event: any) => { // get value
        return event.target.value;
      })
      // , filter(res => res.length > 2) // if character length greater then 2
      , debounceTime(500) // Time in milliseconds between key events
      , distinctUntilChanged() // If previous query is different from current
    ).subscribe((text: string) => {
        this.updateURLParameters('query', text);
        this.navigateUsingParameters();
      }
    );
  }

  updateSearchResultsSnippets(searchResults: Paging<DatasourceDetails>) {
    // INITIALISATIONS
    this.errorMessage = null;
    this.searchResults = searchResults;

    if (this.searchResults.results.length > 0 ) {
      this.sortFacets.transform(this.searchResults.facets,['portfolios', 'users', 'trl', 'lifeCycleStatus']);
    }
    // update form values using URLParameters
    for (const urlParameter of this.urlParameters) {
      if (urlParameter.key === 'eoscDatasourceType') {
        this.eoscDatasourceType = urlParameter.values[0];
      }
      if (urlParameter.key === 'orderField') {
        this.orderField = urlParameter.values[0];
      }
      if (urlParameter.key === 'order') {
        this.order = urlParameter.values[0];
      }
      if (urlParameter.key === 'query') {
        this.searchQuery = urlParameter.values[0];
      } else {
        for (const facet of this.searchResults.facets) {
          if (facet.field === urlParameter.key) {
            for (const parameterValue of urlParameter.values) {
              for (const facetValue of facet.values) {
                if (parameterValue === facetValue.value) {
                  facetValue.isChecked = true;
                }
              }
            }
          }
        }
      }
    }
    // this.updateURLParameters('quantity', this.pageSize);
  }

  paginationInit() {
    let addToEndCounter = 0;
    let addToStartCounter = 0;
    this.totalPages = Math.ceil(this.searchResults.total/this.pageSize);
    this.currentPage = Math.ceil(this.searchResults.from/this.pageSize) + 1;
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

  updateURLParameters(key, value) {
    for (const urlParameter of this.urlParameters) {
      if (urlParameter.key === key) {
        urlParameter.values = [value];
        return;
      }
    }
    this.urlParameters.push({key, values: [value]});
  }

  navigateUsingParameters() {
    const map: { [name: string]: string } = {};
    for (const urlParameter of this.urlParameters) {
      map[urlParameter.key] = urlParameter.values.join(',');
    }
    return this.router.navigate([`/datasources/search`], {queryParams: map});
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

  showFiltersMobile(show: boolean) {
    this.filtersMobileShown = show;
  }

  onSelect(key: string, value: string) {
    console.log(key);
    console.log(value);
    this.updateURLParameters(key, value);
    return this.navigateUsingParameters();
  }

  clearSelections(e, category: string) {
    let categoryIndex = 0;
    for (const urlParameter of this.urlParameters) {
      if (urlParameter.key === category) {
        this.urlParameters.splice(categoryIndex, 1);
      }
      categoryIndex++;
    }
    return this.navigateUsingParameters();
  }

  onSelection(e, category: string, value: string) {
    if (e.target.checked) {
      this.addParameterToURL(category, value);
    } else {
      let categoryIndex = 0;
      for (const urlParameter of this.urlParameters) {
        if (urlParameter.key === category) {
          const valueIndex = urlParameter.values.indexOf(value, 0);
          if (valueIndex > -1) {
            urlParameter.values.splice(valueIndex, 1);
            if (urlParameter.values.length === 0) {
              this.urlParameters.splice(categoryIndex, 1);
            }
          }
        }
        categoryIndex++;
      }
    }
    return this.navigateUsingParameters();
  }

  private addParameterToURL(category: string, value: string) {
    let foundCategory = false;
    for (const urlParameter of this.urlParameters) {
      if (urlParameter.key === category) {
        foundCategory = true;
        const valueIndex = urlParameter.values.indexOf(value, 0);
        if (valueIndex < 0) {
          urlParameter.values.push(value);
          this.updateURLParameters('from', 0);
        }
      }
    }
    if (!foundCategory) {
      this.updateURLParameters('from', 0);
      const newParameter: URLParameter = {
        key: category,
        values: [value]
      };
      this.urlParameters.push(newParameter);
    }
  }

}
