import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Model} from '../../../catalogue-ui/domain/dynamic-form-model';
import {FormControlService} from '../../../catalogue-ui/services/form-control.service';
import {SurveyComponent} from '../../../catalogue-ui/pages/dynamic-form/survey.component';
import {ResourceService} from '../../services/resource.service';
import {zip} from 'rxjs/internal/observable/zip';
import {Datasource, Service, Vocabulary} from '../../entities/eic-model';
import {PremiumSortPipe} from '../../shared/pipes/premium-sort.pipe';

import * as uikit from 'uikit';

@Component({
  selector: 'app-form',
  templateUrl: 'forms.component.html',
  providers: [FormControlService],
  standalone: false
})

export class FormsComponent implements OnInit{

  @ViewChild(SurveyComponent) child: SurveyComponent;

  tabsHeader: string = null;
  model: Model = null;
  vocabulariesMap: Map<string, object[]> = new Map<string, object[]>();
  subVocabulariesMap: Map<string, object[]> = null;
  premiumSort = new PremiumSortPipe();
  providerId: string = null;
  resourceId: string = null;
  datasourceId: string = null;
  resourceType: string = null;
  payloadAnswer: object = null; // Find a way to do this better
  ready = false;
  errorMessage: string = null;
  editMode = false;

  constructor(private formService: FormControlService, private resourceService: ResourceService,
              private route: ActivatedRoute, private router: Router ) {}

  ngOnInit() {
    this.ready = false;
    this.route.params.subscribe(
      params => {
        this.providerId = params['providerId'];
        this.resourceId = params['resourceId'];
        this.datasourceId = params['datasourceId'];
        if (window.location.pathname.includes('service/add') || window.location.pathname.includes('service/edit')) this.resourceType = 'service';
        if (window.location.pathname.includes('subprofile/add') || window.location.pathname.includes('subprofile/edit')) this.resourceType = 'datasource';
        if (window.location.pathname.includes('service/edit') || window.location.pathname.includes('subprofile/edit')) this.editMode = true;
        if (this.editMode) { // edit
          zip(
            this.resourceType === 'service' ? this.resourceService.getService(this.resourceId) : this.resourceService.getDatasource(this.datasourceId),
            this.formService.getFormModelByResourceType(this.resourceType),
            this.resourceService.getUiVocabularies()).subscribe(
            next => {
              this.payloadAnswer = {answer: {Service: {}}};
              this.payloadAnswer['answer'].Service = next[0];
              this.model = next[1].results[0];
              this.vocabulariesMap = next[2];
            },
            error => {console.log(error);},
            () => {
              this.prepareVocabularies();
              this.ready = true;
            }
          );
        } else { // add new
          // console.log('add new');
          zip(
            this.formService.getFormModelByResourceType(this.resourceType),
            this.resourceService.getUiVocabularies()).subscribe(
            next => {
              this.model = next[0].results[0];
              this.vocabulariesMap = next[1];
            },
            error => {console.log(error);},
            () => {
              this.prepareVocabularies();
              this.ready = true;
            }
          );
        }

      },
      error => {console.log(error);}
    );
  }

  submitForm(value) {
    this.ready = false;
    // console.log(value[0].get('Service').value);
    const service: Service = {...value[0].get('Service').value};
    // for (const element in value[0].get('Service').controls) {
    //   console.log(element+' is '+ value[0].get('Service').get(element).valid);
    //   console.log(value[0].get('Service').get(element).value);
    // }
    if (this.resourceType === 'service') {
      if (!service.multimedia[0].multimediaURL) service.multimedia = null;
      if (!service.useCases[0].useCaseURL) service.useCases = null;
      if (value[1]) {
        this.resourceService.editService(service).subscribe(
          next => {
            this.router.navigate([`/service/${next.id}/overview`]);
          },
          error => {
            console.log(error);
            this.errorMessage = error.error.message + '\nFor more information please provide the error code to the system administrators. \nError Code: '+ error.error.transactionId;
            this.ready = true;
          }
        );
      } else {
        this.resourceService.postService(service).subscribe(
          next => {
            this.router.navigate([`/service/${next.id}/overview`]);
          },
          error => {
            console.log(error);
            this.errorMessage = error.error.message + '\nFor more information please provide the error code to the system administrators. \nError Code: '+ error.error.transactionId;
            this.ready = true;
          }
        );
      }
    }
    if (this.resourceType === 'datasource') {
      const datasource: Datasource = {...value[0].get('Service').value};
      let id = this.resourceId;
      if (!id) id = this.datasourceId;
      datasource.id = id;
      datasource.serviceId = id;
      datasource.catalogueId = 'openaire';
      if (value[1]) {
        this.resourceService.editDatasource(datasource).subscribe(
          next => {
            this.router.navigate([`/service/${next.id}/overview`]); //todo change page
          },
          error => {
            console.log(error);
            this.errorMessage = error.error.message + '\nFor more information please provide the error code to the system administrators. Error Code: '+ error.error.transactionId;
            this.ready = true;
          }
        );
      } else {
        this.resourceService.postDatasource(datasource).subscribe(
          next => {
            this.router.navigate([`/service/${next.id}/overview`]); //todo change page
          },
          error => {
            console.log(error);
            this.errorMessage = error.error.message + '\nFor more information please provide the error code to the system administrators. Error Code: '+ error.error.transactionId;
            this.ready = true;
          }
        );
      }
    }
  }

  prepareVocabularies() {
    this.sortVocabulariesByName(this.vocabulariesMap['Scientific domain']);
    this.sortVocabulariesByName(this.vocabulariesMap['Scientific subdomain']);
    this.sortVocabulariesByName(this.vocabulariesMap['Category']);
    this.sortVocabulariesByName(this.vocabulariesMap['Subcategory']);
    const voc: Vocabulary[] = this.vocabulariesMap['Subcategory'].concat(this.vocabulariesMap['Scientific subdomain']);
    this.subVocabulariesMap = this.groupByKey(voc, 'parentId');
    this.sortVocabulariesByName(this.vocabulariesMap['Access type']);
    this.sortVocabulariesByName(this.vocabulariesMap['Access mode']);
    this.sortVocabulariesByName(this.vocabulariesMap['Target user']);
    this.sortVocabulariesByName(this.vocabulariesMap['Language']);
    this.sortVocabulariesByName(this.vocabulariesMap['Country']);
    this.sortVocabulariesByName(this.vocabulariesMap['Technology readiness level']);
    this.sortVocabulariesByName(this.vocabulariesMap['Life cycle status']);
    this.sortVocabulariesByName(this.vocabulariesMap['Funding body']);
    this.sortVocabulariesByName(this.vocabulariesMap['Funding program']);
    this.vocabulariesMap['RegionOrCountry'] = this.vocabulariesMap['Country'].concat(this.vocabulariesMap['Region']);
    this.premiumSort.transform(this.vocabulariesMap['RegionOrCountry'], ['Europe', 'Worldwide']);
  }

  groupByKey(array, key) {
    return array.reduce((hash, obj) => {
      if (obj[key] === undefined) {
        return hash;
      }
      return Object.assign(hash, {[obj[key]]: (hash[obj[key]] || []).concat(obj)});
    }, {});
  }

  sortVocabulariesByName(vocabularies: Vocabulary[]): Vocabulary[] {
    return vocabularies.sort((vocabulary1, vocabulary2) => {
      if (vocabulary1.name > vocabulary2.name) {
        return 1;
      }
      if (vocabulary1.name < vocabulary2.name) {
        return -1;
      }
      return 0;
    });
  }

}
