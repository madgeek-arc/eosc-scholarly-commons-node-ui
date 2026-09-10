import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Provider, ProviderBundle, Type, Vocabulary} from '../../../../entities/eic-model';
import {ProviderService} from '../../../../services/provider.service';
import {ResourceService} from '../../../../services/resource.service';

@Component({
  selector: 'app-provider-info',
  templateUrl: 'provider-info.component.html'
})

export class ProviderInfoComponent implements OnInit, OnChanges {

  @Input() providerBundle: ProviderBundle = null;
  provider: Provider = null;
  vocabularies: Map<string, Object[]> = null;

  // vocabularies: Map<string, Vocabulary[]> = null;
  // placesVocabulary: Vocabulary[] = null;
  // providerTypeVocabulary: Vocabulary[] = null;
  // providerLCSVocabulary: Vocabulary[] = null;
  // domainsVocabulary: Vocabulary[] = null;
  // categoriesVocabulary: Vocabulary[] = null;
  // merilDomainsVocabulary: Vocabulary[] = null;
  // merilCategoriesVocabulary: Vocabulary[] = null;
  // esfriDomainVocabulary: Vocabulary[] = null;
  // legalStatusVocabulary: Vocabulary[] = null;
  // esfriVocabulary: Vocabulary[] = null;
  // areasOfActivityVocabulary: Vocabulary[] = null;
  // networksVocabulary: Vocabulary[] = null;
  // societalGrandChallengesVocabulary: Vocabulary[] = null;
  // hostingLegalEntityVocabulary: Vocabulary[] = null;

  constructor(private resourceService: ResourceService) {
  }

  ngOnInit() {

    this.setVocabularies();

    if (this.providerBundle) {
      this.provider = this.providerBundle.provider;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.providerBundle) {
      this.provider = this.providerBundle.provider;
    }
  }

  getVocabularyName(vocabularyType: string, id: string): string {
    // console.log(this.vocabularies);
    for (const vocabulary of this.vocabularies[vocabularyType]) {
      if (vocabulary.id === id)
        return vocabulary.name;
    }
  }

  setVocabularies() {
    this.resourceService.getUiVocabularies().subscribe(
      res => {
        this.vocabularies = res;
      }
    );
  }

  // setVocabularies() {
  //   this.resourceService.getAllVocabulariesByType().subscribe(
  //     res => {
  //       this.vocabularies = res;
  //       this.placesVocabulary = this.vocabularies[Type.COUNTRY];
  //       this.providerTypeVocabulary = this.vocabularies[Type.PROVIDER_STRUCTURE_TYPE];
  //       this.providerLCSVocabulary = this.vocabularies[Type.PROVIDER_LIFE_CYCLE_STATUS];
  //       this.domainsVocabulary = this.vocabularies[Type.SCIENTIFIC_DOMAIN];
  //       this.categoriesVocabulary = this.vocabularies[Type.SCIENTIFIC_SUBDOMAIN];
  //       this.merilDomainsVocabulary = this.vocabularies[Type.PROVIDER_MERIL_SCIENTIFIC_DOMAIN];
  //       this.merilCategoriesVocabulary = this.vocabularies[Type.PROVIDER_MERIL_SCIENTIFIC_SUBDOMAIN];
  //       this.esfriDomainVocabulary = this.vocabularies[Type.PROVIDER_ESFRI_DOMAIN];
  //       this.legalStatusVocabulary = this.vocabularies[Type.PROVIDER_LEGAL_STATUS];
  //       this.esfriVocabulary = this.vocabularies[Type.PROVIDER_ESFRI_TYPE];
  //       this.areasOfActivityVocabulary = this.vocabularies[Type.PROVIDER_AREA_OF_ACTIVITY];
  //       this.networksVocabulary = this.vocabularies[Type.PROVIDER_NETWORK];
  //       this.societalGrandChallengesVocabulary = this.vocabularies[Type.PROVIDER_SOCIETAL_GRAND_CHALLENGE];
  //       // this.hostingLegalEntityVocabulary = this.vocabularies[Type.PROVIDER_HOSTING_LEGAL_ENTITY];
  //       return this.vocabularies;
  //     },
  //     error => console.log(JSON.stringify(error.error)),
  //     () => {
  //       return this.vocabularies;
  //     }
  //   );
  // }

}
