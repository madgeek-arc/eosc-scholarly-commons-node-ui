import {Component, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {Datasource, Service, Vocabulary} from '../../entities/eic-model';
import {SearchQuery} from '../../entities/search-query';
import {NavigationService} from '../../services/navigation.service';
import {ResourceService} from '../../services/resource.service';
import {DataSharingService} from '../../services/data-sharing.service';
import {PortfolioMap} from '../../entities/portfolioMap';
import * as uikit from 'uikit';

@Component({
  selector: 'app-home',
  templateUrl: './home.aire.component.html',
  styleUrls: ['./home.aire.component.css']
})
export class HomeAireComponent implements OnInit {
  public searchForm: UntypedFormGroup;
  public categories: Category[] = [
    {
      value: 'Authentication and authorization infrastructure',
      icon: 'fingerprint_scanning_authorization.svg',
      hover: 'fingerprint_scanning_authorization_hover.svg'
    },
    {value: 'Compute', icon: 'cloud_server.svg', hover: 'cloud_server_hover.svg'},
    {value: 'Connectivity', icon: 'connectivity.svg', hover: 'connectivity_hover.svg'},
    {value: 'Consulting', icon: 'consulting.svg', hover: 'consulting_hover.svg'},
    {value: 'Operations', icon: 'keyword.svg', hover: 'keyword_hover.svg'},
    {value: 'Content delivery', icon: 'data-connectivity.svg', hover: 'data-connectivity_hover.svg'},
    {value: 'Data discovery', icon: 'keyword.svg', hover: 'keyword_hover.svg'},
    {value: 'Data movement', icon: 'database.svg', hover: 'database_hover.svg'},
    {value: 'Data registration', icon: 'cloud_server.svg', hover: 'cloud_server_hover.svg'},
    {value: 'Data storage', icon: 'database_security.svg', hover: 'database_security_hover.svg'}
  ];

  resources: Map<string, Service[] | Datasource[]> = null;
  public portfolios: Vocabulary[] = null;
  public users: Vocabulary[] = null;
  public slide = 0;
  public slideMobile = 0;

  constructor(public fb: UntypedFormBuilder, public router: NavigationService,  public resourceService: ResourceService,
              private dataSharingService: DataSharingService) {
    this.searchForm = fb.group({query: ['']});
  }

  ngOnInit() {
    // fetch categories, check size, skip unpopulated ones here

    this.resourceService.getNewVocabulariesByType('Portfolios').subscribe(
      suc => {
        this.portfolios = suc;
      }
    );

    this.resourceService.getNewVocabulariesByType('Users').subscribe(
      suc => {
        this.users = suc;
      }
    );

    this.resourceService.getResourcesGroupedByField('portfolios', true).subscribe(
      res => {this.resources = res; },
      error => {console.log(error); }
    );

  }

  onSubmit(searchValue: SearchQuery) {
    return this.router.search({query: searchValue.query});
  }

  dragSlide() {
    this.slide = uikit.getComponent(document.querySelector('[uk-slideshow]'), 'slideshow').index;
  }

  showSlide(index: number) {
    uikit.slideshow('#slideShow').show(index);
    // console.log(UIkit.getComponent(document.querySelector('[uk-slideshow]'), 'slideshow').index);
    this.slide = index;

  }

  dragSlideMobile() {
    this.slideMobile = uikit.getComponent(document.querySelector('[uk-slideshow]'), 'slideshow').index;
  }

  showSlideMobile(index: number) {
    uikit.slideshow('#slideShowMobile').show(index);
    // console.log(UIkit.getComponent(document.querySelector('[uk-slideshow]'), 'slideshow').index);
    this.slideMobile = index;

  }
}

class Category {
  value: string;
  icon: string;
  hover: string;
}

