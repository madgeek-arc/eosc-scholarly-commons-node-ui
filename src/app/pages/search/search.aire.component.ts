import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Datasource, Provider, Service, Vocabulary} from '../../entities/eic-model';
import {URLParameter} from '../../entities/url-parameter';
import {Paging} from '../../entities/paging';
import {PremiumSortFacetsPipe} from '../../shared/pipes/premium-sort.pipe';
import {UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ResourceService} from '../../services/resource.service';
import {AuthenticationService} from '../../services/authentication.service';
import {ComparisonService} from '../../services/comparison.service';
import {environment} from '../../../environments/environment';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import {fromEvent, zip} from 'rxjs';


@Component({
  selector: 'app-search',
  templateUrl: './search.aire.component.html',
  standalone: false
})

export class SearchAireComponent implements OnInit {

  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;

  public projectName = environment.projectName;
  canAddOrEditService: boolean;
  myProviders:  Provider[] = [];
  searchResults: Paging<Service | Datasource> = null;
  private sortFacets = new PremiumSortFacetsPipe();
  advanced = false;
  listViewActive = true;
  public showSearchFieldDropDown = true;
  public searchFields: string[] = ['name', 'description', 'tagline', 'user value', 'user base', 'use cases'];
  public serviceIdsArray: string[] = [];
  vocabularies: Vocabulary[] = null;
  searchQuery: string = null;

  // Paging
  pages: number[] = [];
  offset = 2;
  pageSize = 10;
  totalPages = 0;
  currentPage = 0;

  public searchForm: UntypedFormGroup;
  errorMessage: string;
  filtersMobileShown = false;
  urlParameters: URLParameter[] = [];
  loading = false;


  constructor(public fb: UntypedFormBuilder, public router: Router, public route: ActivatedRoute,
              public resourceService: ResourceService, public authenticationService: AuthenticationService,
              public comparisonService: ComparisonService) {
    this.searchForm = fb.group({query: [''], searchFields: ['']});
  }

  ngOnInit() {
    this.listViewActive = true;
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

      this.loading = true;
      zip(
        this.resourceService.getNewVocabulariesByType('Users'),
        this.resourceService.getNewVocabulariesByType('Portfolios')).subscribe(
          value => {
            this.vocabularies = value[0].concat(value[1]);
            this.loading = false;
          },
          error => {console.log(error);}
      );

      this.resourceService.searchWithDatasource(this.urlParameters).subscribe(
        searchResults => {
          this.updateSearchResultsSnippets(searchResults);
        },
      error => {},
      () => {this.paginationInit();}
      );
    });

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

    this.canAddOrEditService = false;
    if (this.authenticationService.isLoggedIn() && this.projectName === 'OpenAIRE Catalogue') {
      this.myProviders = [];
      this.resourceService.getMyServiceProviders().subscribe(
        res => this.myProviders = res,
        error => console.log(error),
        () => {
          this.canAddOrEditService = this.myProviders.some(p => p.id === 'openaire');
        }
      );
    }
  }

  updateSearchResultsSnippets(searchResults: Paging<Service | Datasource>) {
    // INITIALISATIONS
    this.errorMessage = null;
    this.searchResults = searchResults;

    if (this.searchResults.results.length > 0 ) {
      this.sortFacets.transform(this.searchResults.facets,['portfolios', 'users', 'trl', 'lifeCycleStatus', 'resource_organisation']);
    }
    // update form values using URLParameters
    for (const urlParameter of this.urlParameters) {
      if (urlParameter.key === 'searchFields') {
        this.searchForm.get('searchFields').setValue(urlParameter.values[0]);
      }
      if (urlParameter.key === 'query') {
        this.searchForm.get('query').setValue(urlParameter.values[0]);
      } else if (urlParameter.key === 'advanced') {
        this.advanced = urlParameter.values[0] === 'true';
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
    return this.router.navigate([`/search/`], {queryParams: map});
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

  getVocabularyName(id: string) {
    for (const vocabulary of this.vocabularies) {
      if (vocabulary.id === id) {
        return vocabulary.name;
      }
    }
  }

}
