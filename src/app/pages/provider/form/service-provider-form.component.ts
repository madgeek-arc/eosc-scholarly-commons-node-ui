import {Component, OnInit} from '@angular/core';
import {UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import * as sd from '../../../entities/services.description';
import {AuthenticationService} from '../../../services/authentication.service';
import {ProviderService} from '../../../services/provider.service';
import {ActivatedRoute, Router} from '@angular/router';
import {URLValidator} from '../../../shared/validators/generic.validator';
import {Vocabulary} from '../../../entities/eic-model';
import {ResourceService} from '../../../services/resource.service';
import {environment} from '../../../../environments/environment';
import {PremiumSortPipe} from '../../../shared/pipes/premium-sort.pipe';

import {ClassicEditor} from '../../../shared/ckeditor-classic-editor';

declare let UIkit: any;

@Component({
  selector: 'app-new-service-provider',
  templateUrl: './service-provider-form.component.html',
  styleUrls: ['./service-provider-form.component.css'],
  standalone: false
})
export class ServiceProviderFormComponent implements OnInit {

  private _hasUserConsent = environment.hasUserConsent;

  public editor = ClassicEditor;

  serviceORresource = environment.serviceORresource;
  projectName = environment.projectName;
  projectMail = environment.projectMail;
  privacyPolicyURL = environment.privacyPolicyURL;
  providerId: string = null;
  providerName = '';
  errorMessage = '';
  userInfo = {family_name: '', given_name: '', email: ''};
  newProviderForm: UntypedFormGroup;
  logoUrl = '';
  vocabularies: Map<string, Vocabulary[]> = null;
  premiumSort = new PremiumSortPipe();
  edit = false;
  hasChanges = false;
  pendingProvider = false;
  disable = false;
  showLoader = false;
  tabsError: boolean[] = [false, false, false, false, false, false, false, false];
  selectedTab = 0;
  selectTab(index: number): void {this.selectedTab = index;}
  isPortalAdmin = false;

  codeOfConduct = false;
  privacyPolicy = false;
  authorizedRepresentative = false;
  agreedToTerms: boolean;

  readonly fullNameDesc: sd.Description = sd.providerDescMap.get('fullNameDesc');
  readonly abbreviationDesc: sd.Description = sd.providerDescMap.get('abbreviationDesc');
  readonly websiteDesc: sd.Description = sd.providerDescMap.get('websiteDesc');
  readonly providerDescriptionDesc: sd.Description = sd.providerDescMap.get('providerDescriptionDesc');
  readonly providerLogoDesc: sd.Description = sd.providerDescMap.get('providerLogoDesc');
  readonly multimediaURLDesc: sd.Description = sd.providerDescMap.get('multimediaURLDesc');
  readonly multimediaNameDesc: sd.Description = sd.providerDescMap.get('multimediaNameDesc');
  readonly providerScientificDomainDesc: sd.Description = sd.providerDescMap.get('providerScientificDomainDesc');
  readonly providerScientificSubdomainsDesc: sd.Description = sd.providerDescMap.get('providerScientificSubdomainsDesc');
  readonly structureTypesDesc: sd.Description = sd.providerDescMap.get('structureTypesDesc');
  readonly participatingCountriesDesc: sd.Description = sd.providerDescMap.get('participatingCountriesDesc');
  readonly affiliationDesc: sd.Description = sd.providerDescMap.get('affiliationDesc');
  readonly providerTagsDesc: sd.Description = sd.providerDescMap.get('providerTagsDesc');
  readonly streetNameAndNumberDesc: sd.Description = sd.providerDescMap.get('streetNameAndNumberDesc');
  readonly postalCodeDesc: sd.Description = sd.providerDescMap.get('postalCodeDesc');
  readonly cityDesc: sd.Description = sd.providerDescMap.get('cityDesc');
  readonly regionDesc: sd.Description = sd.providerDescMap.get('regionDesc');
  readonly countryDesc: sd.Description = sd.providerDescMap.get('countryDesc');
  readonly providerMainContactFirstNameDesc: sd.Description = sd.providerDescMap.get('providerMainContactFirstNameDesc');
  readonly providerMainContactLastNameDesc: sd.Description = sd.providerDescMap.get('providerMainContactLastNameDesc');
  readonly providerMainContactEmailDesc: sd.Description = sd.providerDescMap.get('providerMainContactEmailDesc');
  readonly providerMainContactPhoneDesc: sd.Description = sd.providerDescMap.get('providerMainContactPhoneDesc');
  readonly providerMainContactPositionDesc: sd.Description = sd.providerDescMap.get('providerMainContactPositionDesc');
  readonly providerPublicContactFirstNameDesc: sd.Description = sd.providerDescMap.get('providerPublicContactFirstNameDesc');
  readonly providerPublicContactLastNameDesc: sd.Description = sd.providerDescMap.get('providerPublicContactLastNameDesc');
  readonly providerPublicContactEmailDesc: sd.Description = sd.providerDescMap.get('providerPublicContactEmailDesc');
  readonly providerPublicContactPhoneDesc: sd.Description = sd.providerDescMap.get('providerPublicContactPhoneDesc');
  readonly providerPublicContactPositionDesc: sd.Description = sd.providerDescMap.get('providerPublicContactPositionDesc');
  readonly providerCertificationsDesc: sd.Description = sd.providerDescMap.get('providerCertificationsDesc');
  readonly lifeCycleStatusDesc: sd.Description = sd.providerDescMap.get('lifeCycleStatusDesc');
  readonly ESFRIDomainDesc: sd.Description = sd.providerDescMap.get('ESFRIDomainDesc');
  readonly hostingLegalEntityDesc: sd.Description = sd.providerDescMap.get('hostingLegalEntityDesc');
  readonly ESFRITypeDesc: sd.Description = sd.providerDescMap.get('ESFRITypeDesc');
  readonly merilScientificDomainsDesc: sd.Description = sd.providerDescMap.get('merilScientificDomainsDesc');
  readonly merilScientificSubdomainsDesc: sd.Description = sd.providerDescMap.get('merilScientificSubdomainsDesc');
  readonly areasOfActivityDesc: sd.Description = sd.providerDescMap.get('areasOfActivityDesc');
  readonly societalGrandChallengesDesc: sd.Description = sd.providerDescMap.get('societalGrandChallengesDesc');
  readonly nationalRoadmapsDesc: sd.Description = sd.providerDescMap.get('nationalRoadmapsDesc');
  readonly legalEntityDesc: sd.Description = sd.providerDescMap.get('legalEntityDesc');
  readonly legalStatusDesc: sd.Description = sd.providerDescMap.get('legalStatusDesc');
  readonly networksDesc: sd.Description = sd.providerDescMap.get('networksDesc');

  placesVocabulary: Vocabulary[] = null;
  providerTypeVocabulary: Vocabulary[] = null;
  providerLCSVocabulary: Vocabulary[] = null;
  domainsVocabulary: Vocabulary[] = null;
  categoriesVocabulary: Vocabulary[] = null;
  merilDomainsVocabulary: Vocabulary[] = null;
  merilCategoriesVocabulary: Vocabulary[] = null;
  esfriDomainVocabulary: Vocabulary[] = null;
  legalStatusVocabulary: Vocabulary[] = null;
  esfriVocabulary: Vocabulary[] = null;
  areasOfActivityVocabulary: Vocabulary[] = null;
  networksVocabulary: Vocabulary[] = null;
  societalGrandChallengesVocabulary: Vocabulary[] = null;

  readonly formDefinition = {
    id: [''],
    name: ['', Validators.required],
    abbreviation: ['', Validators.required],
    website: ['', Validators.compose([Validators.required, URLValidator])],
    legalEntity: [''],
    legalStatus: [''],
    description: ['', Validators.required],
    logo: ['', Validators.compose([Validators.required, URLValidator])],
    multimedia: this.fb.array([
      this.fb.group({
        multimediaURL: ['', Validators.compose([Validators.required, URLValidator])],
        multimediaName: ['']
      })
    ]),
    scientificDomains: this.fb.array([]),
    // scientificDomain: this.fb.array([]),
    // scientificSubdomains: this.fb.array([]),
    tags: this.fb.array([this.fb.control('')]),
    location: this.fb.group({
      streetNameAndNumber: ['', Validators.required],
      postalCode: ['', Validators.required],
      city: ['', Validators.required],
      region: [''],
      country: ['', Validators.required]
    }, Validators.required),
    mainContact: this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', Validators.compose([Validators.required, Validators.email])],
      phone: ['', Validators.pattern('[+]?\\d+$')],
      position: [''],
    }, Validators.required),
    publicContacts: this.fb.array([
      this.fb.group({
        firstName: [''],
        lastName: [''],
        email: ['', Validators.compose([Validators.required, Validators.email])],
        phone: ['', Validators.pattern('[+]?\\d+$')],
        position: [''],
      })
    ]),
    lifeCycleStatus: [''],
    certifications: this.fb.array([this.fb.control('')]),
    hostingLegalEntity: [''],
    participatingCountries: this.fb.array([this.fb.control('')]),
    affiliations: this.fb.array([this.fb.control('')]),
    networks: this.fb.array([this.fb.control('')]),
    structureTypes: this.fb.array([this.fb.control('')]),
    esfriDomains: this.fb.array([this.fb.control('')]),
    esfriType: [''],
    merilScientificDomains: this.fb.array([]),
    // merilScientificDomain: this.fb.array([]),
    // merilScientificSubdomains: this.fb.array([]),
    areasOfActivity: this.fb.array([this.fb.control('')]),
    societalGrandChallenges: this.fb.array([this.fb.control('')]),
    nationalRoadmaps: this.fb.array([this.fb.control('')]),
    users: this.fb.array([
      this.user()
    ])
  };

  constructor(public fb: UntypedFormBuilder,
              public authService: AuthenticationService,
              public providerService: ProviderService,
              public resourceService: ResourceService,
              public router: Router,
              public route: ActivatedRoute) {
  }

  ngOnInit() {

    const path = this.route.snapshot.routeConfig.path;
    if (path.includes('add/:providerId')) {
      this.pendingProvider = true;
    }
    // if (path.includes('info/:providerId')) {
    //   this.pendingProvider = true;
    // }
    this.setVocabularies();
    this.newProviderForm = this.fb.group(this.formDefinition);
    if (this.edit === false) {
      this.pushDomain();
      this.pushMerilDomain();
      this.addDefaultUser();  // Admin + mainContact
      this.newProviderForm.get('legalEntity').setValue(false);
    }

    if (sessionStorage.getItem('provider')) {
      const data = JSON.parse(sessionStorage.getItem('provider'));
      for (const i in data) {
        if (data.hasOwnProperty(i)) {
          if (Array.isArray(data[i])) {
            // console.log(i);
            for (let j = 0; j < data[i].length - 1; j++) {
              if (i === 'scientificDomains') {
                this.domainArray.push(this.newScientificDomain());
              } else if (i === 'merilScientificDomains') {
                this.merilDomainArray.push(this.newMerilScientificDomain());
              } else if (i === 'publicContacts') {
                this.pushPublicContact();
              } else if (i === 'users') {
                this.addUser();
              } else if (i === 'structureTypes') {
                this.push(i, true);
              } else if (i === 'multimedia') {
                this.pushMultimedia();
              } else {
                this.push(i, false);
              }
            }
          }
        }
      }
      this.newProviderForm.patchValue(data);
      if (!this.edit) {
        sessionStorage.removeItem('provider');
      }
    }

    // fixme: hasAdminAcceptedTerms 404
    // if (this._hasUserConsent) {
    //   if (this.edit) {
    //     this.providerService.hasAdminAcceptedTerms(this.providerId, this.pendingProvider).subscribe(
    //       boolean => { this.agreedToTerms = boolean; },
    //       error => console.log(error),
    //       () => {
    //         if (!this.agreedToTerms) {
    //           UIkit.modal('#modal-consent').show();
    //         }
    //       }
    //     );
    //   } else {
    //     if (!this.agreedToTerms) {
    //       UIkit.modal('#modal-consent').show();
    //     }
    //   }
    // }

    // this.isPortalAdmin = this.authService.isAdmin();

  }

  registerProvider(saveDraft: boolean) {
    // console.log('Submit');
    if (!this.authService.isLoggedIn()) {
      sessionStorage.setItem('provider', JSON.stringify(this.newProviderForm.value));
      this.authService.login();
    }

    this.errorMessage = '';
    // this.trimFormWhiteSpaces();
    const path = this.route.snapshot.routeConfig.path;
    let method;
    if (path === 'add/:providerId') {
      method = 'updateAndPublishPendingProvider';
    } else {
      method = this.edit ? 'updateServiceProvider' : 'createNewServiceProvider';
    }

    for (let i = 0; i < this.domainArray.length ; i++) {
      if (this.domainArray.controls[i].get('scientificDomain').value === ''
        || this.domainArray.controls[i].get('scientificDomain').value === null) {
        this.removeDomain(i);
      }
    }

    for (let i = 0; i < this.merilDomainArray.length ; i++) {
      if (this.merilDomainArray.controls[i].get('merilScientificDomain').value === ''
        || this.merilDomainArray.controls[i].get('merilScientificDomain').value === null) {
        // console.log(this.merilDomainArray.controls[i]);
        this.removeMerilDomain(i);
      }
    }

    for (let i = 0; i < this.multimediaArray.length; i++) {
      if (this.multimediaArray.controls[i].get('multimediaURL').value === ''
        || this.multimediaArray.controls[i].get('multimediaURL').value === null) {
        this.removeMultimedia(i);
      }
    }

    if (saveDraft) { //not used
      this.showLoader = true;
      window.scrollTo(0, 0);
      this.providerService.temporarySaveProvider(this.newProviderForm.value, (path !== 'add/:providerId' && this.edit))
        .subscribe(
          res => {
            this.showLoader = false;
            this.router.navigate([`/provider/add/${res.id}`]);
          },
          err => {
            this.showLoader = false;
            window.scrollTo(0, 0);
            this.errorMessage = 'Something went wrong. ' + JSON.stringify(err.error.error);
          },
          () => {
            this.showLoader = false;
          }
        );
    } else if (this.newProviderForm.valid) {
      this.showLoader = true;
      window.scrollTo(0, 0);

      const token = sessionStorage.getItem('token');
      if (token) {
        this.providerService.createNewServiceProviderWithToken(this.newProviderForm.value, token).subscribe(
          res => {
            sessionStorage.removeItem('token');
            setTimeout(()=>{
              this.router.navigate([`/provider/${res.id}/dashboard/home`]);
            }, 3000);
          },
          err => {
            this.showLoader = false;
            window.scrollTo(0, 0);
            this.errorMessage = 'Something went wrong. ' + JSON.stringify(err.error.error);
          }
        );
      } else {
        this.providerService[method](this.newProviderForm.value, this.providerId).subscribe(
          res => {},
          err => {
            this.showLoader = false;
            window.scrollTo(0, 0);
            this.errorMessage = 'Something went wrong. ' + JSON.stringify(err.error.error);
          },
          () => {
            this.showLoader = false;
            if (this.edit) {
            this.router.navigate([`/provider/${this.newProviderForm.value.id}/dashboard/home`]);
            } else { //add new provider
              this.router.navigate([`/provider/${this.sanitizeAbbreviation(this.newProviderForm.value.abbreviation)}/dashboard/home`]);
            //   if (environment.projectName === 'OpenAIRE Catalogue')
            //     this.authService.login();
            //   else {
            //     this.authService.login();
              }
          }
        );
      }
    } else {
      // console.log(this.newProviderForm);
      this.markFormAsDirty();
      window.scrollTo(0, 0);
      this.markTabs();
      this.errorMessage = 'Please fill in all required fields (marked with an asterisk), ' +
        'and fix the data format in fields underlined with a red colour.';
    }
  }

  /** check form fields and tabs validity--> **/
  checkFormValidity(name: string, edit: boolean): boolean {
    return (!this.newProviderForm.get(name).valid && (edit || this.newProviderForm.get(name).dirty));
  }

  checkFormArrayValidity(name: string, position: number, edit: boolean, groupName?: string): boolean {
    if (groupName) {
      return (!this.getFieldAsFormArray(name).get([position]).get(groupName).valid
        && (edit || this.getFieldAsFormArray(name).get([position]).get(groupName).dirty));
    }
    return (!this.getFieldAsFormArray(name).get([position]).valid
      && (edit || this.getFieldAsFormArray(name).get([position]).dirty));
  }

  checkEveryArrayFieldValidity(name: string, edit: boolean, groupName?: string): boolean {
    for (let i = 0; i < this.getFieldAsFormArray(name).length; i++) {
      if (groupName) {
        if (!this.getFieldAsFormArray(name).get([i]).get(groupName).valid
          && (edit || this.getFieldAsFormArray(name).get([i]).get(groupName).dirty)) {
          return true;
        }
      } else if (!this.getFieldAsFormArray(name).get([i]).valid
        && (edit || this.getFieldAsFormArray(name).get([i]).dirty)) {
        return true;
      }
    }
    return false;
  }

  markTabs() {
    this.tabsError[0] = (this.checkFormValidity('name', this.edit)
      || this.checkFormValidity('abbreviation', this.edit)
      || this.checkFormValidity('website', this.edit)
      || this.checkEveryArrayFieldValidity('legalEntity', this.edit)
      || this.checkFormValidity('legalStatus', this.edit)
      || this.checkFormValidity('hostingLegalEntity', this.edit));
    this.tabsError[1] = (this.checkFormValidity('description', this.edit)
      || this.checkFormValidity('logo', this.edit)
      || this.checkEveryArrayFieldValidity('multimedia', this.edit, 'multimediaURL')
      || this.checkEveryArrayFieldValidity('multimedia', this.edit, 'multimediaName'));
    this.tabsError[2] = (this.checkEveryArrayFieldValidity('tags', this.edit)
      || this.checkEveryArrayFieldValidity('scientificDomains', this.edit, 'scientificDomain')
      || this.checkEveryArrayFieldValidity('scientificDomains', this.edit, 'scientificSubdomain')
      || this.checkEveryArrayFieldValidity('structureTypes', this.edit));
    this.tabsError[3] = (this.checkFormValidity('location.streetNameAndNumber', this.edit)
      || this.checkFormValidity('location.postalCode', this.edit)
      || this.checkFormValidity('location.city', this.edit)
      || this.checkFormValidity('location.region', this.edit)
      || this.checkFormValidity('location.country', this.edit));
    this.tabsError[4] = (this.checkFormValidity('mainContact.firstName', this.edit)
      || this.checkFormValidity('mainContact.lastName', this.edit)
      || this.checkFormValidity('mainContact.email', this.edit)
      || this.checkFormValidity('mainContact.phone', this.edit)
      || this.checkFormValidity('mainContact.position', this.edit)
      || this.checkEveryArrayFieldValidity('publicContacts', this.edit, 'firstName')
      || this.checkEveryArrayFieldValidity('publicContacts', this.edit, 'lastName')
      || this.checkEveryArrayFieldValidity('publicContacts', this.edit, 'email')
      || this.checkEveryArrayFieldValidity('publicContacts', this.edit, 'phone')
      || this.checkEveryArrayFieldValidity('publicContacts', this.edit, 'position'));
    this.tabsError[5] = (this.checkFormValidity('lifeCycleStatus', this.edit)
      || this.checkEveryArrayFieldValidity('certifications', this.edit));
    this.tabsError[6] = (this.checkEveryArrayFieldValidity('participatingCountries', this.edit)
      || this.checkEveryArrayFieldValidity('affiliations', this.edit)
      || this.checkEveryArrayFieldValidity('networks', this.edit));
    this.tabsError[7] = (this.checkEveryArrayFieldValidity('esfriDomains', this.edit)
      || this.checkFormValidity('esfriType', this.edit)
      || this.checkEveryArrayFieldValidity('merilScientificDomains', this.edit, 'merilScientificDomain')
      || this.checkEveryArrayFieldValidity('merilScientificDomains', this.edit, 'merilScientificSubdomain')
      || this.checkEveryArrayFieldValidity('areasOfActivity', this.edit)
      || this.checkEveryArrayFieldValidity('societalGrandChallenges', this.edit)
      || this.checkEveryArrayFieldValidity('nationalRoadmaps', this.edit));
    this.tabsError[8] = (this.checkEveryArrayFieldValidity('users', this.edit, 'name')
      || this.checkEveryArrayFieldValidity('users', this.edit, 'surname')
      || this.checkEveryArrayFieldValidity('users', this.edit, 'email'));
  }

  /** check form fields and tabs validity--> **/

  /** get and set vocabularies **/
  setVocabularies() {
    this.resourceService.getAllVocabulariesByType().subscribe(
      res => {
        this.vocabularies = res;
        this.placesVocabulary = this.vocabularies['Country'];
        this.providerTypeVocabulary = this.vocabularies['Provider structure type'];
        this.providerLCSVocabulary = this.vocabularies['Life cycle status'];
        this.domainsVocabulary = this.vocabularies['Scientific domain'];
        this.categoriesVocabulary = this.vocabularies['Scientific subdomain'];
        this.merilDomainsVocabulary = this.vocabularies['Provider meril scientific domain'];
        this.merilCategoriesVocabulary = this.vocabularies['Provider meril scientific subdomain'];
        this.esfriDomainVocabulary = this.vocabularies['Provider esfri domain'];
        this.legalStatusVocabulary = this.vocabularies['Provider legal status'];
        this.esfriVocabulary = this.vocabularies['Provider esfri type'];
        this.areasOfActivityVocabulary = this.vocabularies['Provider area of activity'];
        this.networksVocabulary = this.vocabularies['Provider network'];
        this.societalGrandChallengesVocabulary = this.vocabularies['Provider societal grand challenge'];
      },
      error => console.log(JSON.stringify(error.error)),
      () => {
        this.premiumSort.transform(this.placesVocabulary, ['Europe', 'Worldwide']);
        return this.vocabularies;
      }
    );
  }

  /** Categorization --> **/
  newScientificDomain(): UntypedFormGroup {
    return this.fb.group({
      scientificDomain: [''],
      scientificSubdomain: ['']
    });
  }

  get domainArray() {
    return this.newProviderForm.get('scientificDomains') as UntypedFormArray;
  }

  pushDomain() {
    this.domainArray.push(this.newScientificDomain());
    this.domainArray.controls[this.domainArray.length - 1].get('scientificSubdomain').disable();
  }

  removeDomain(index: number) {
    this.domainArray.removeAt(index);
  }

  onDomainChange(index: number) {
    this.domainArray.controls[index].get('scientificSubdomain').enable();
    this.domainArray.controls[index].get('scientificSubdomain').reset();
  }

  /** <-- Categorization **/

  /** MERIL scientificDomains --> **/
  newMerilScientificDomain(): UntypedFormGroup {
    return this.fb.group({
      merilScientificDomain: [''],
      merilScientificSubdomain: ['']
    });
  }

  get merilDomainArray() {
    return this.newProviderForm.get('merilScientificDomains') as UntypedFormArray;
  }

  pushMerilDomain() {
    this.merilDomainArray.push(this.newMerilScientificDomain());
    this.merilDomainArray.controls[this.merilDomainArray.length - 1].get('merilScientificSubdomain').disable();
  }

  removeMerilDomain(index: number) {
    this.merilDomainArray.removeAt(index);
  }

  onMerilDomainChange(index: number) {
    this.merilDomainArray.controls[index].get('merilScientificSubdomain').enable();
    this.merilDomainArray.controls[index].get('merilScientificSubdomain').reset();
  }

  /** <-- MERIL Categorization **/

  /** handle form arrays--> **/
  getFieldAsFormArray(field: string) {
    return this.newProviderForm.get(field) as UntypedFormArray;
  }

  remove(field: string, i: number) {
    this.getFieldAsFormArray(field).removeAt(i);
  }

  push(field: string, required: boolean, url?: boolean) {
    if (required) {
      if (url) {
        this.getFieldAsFormArray(field).push(this.fb.control('', Validators.compose([Validators.required, URLValidator])));
      } else {
        this.getFieldAsFormArray(field).push(this.fb.control('', Validators.required));
      }
    } else if (url) {
      this.getFieldAsFormArray(field).push(this.fb.control('', URLValidator ));
    } else {
      this.getFieldAsFormArray(field).push(this.fb.control(''));
    }
  }

  /** <--handle form arrays**/

  /** Multimedia -->**/
  newMultimedia(): UntypedFormGroup {
    return this.fb.group({
      multimediaURL: ['', Validators.compose([Validators.required, URLValidator])],
      multimediaName: ['']
    });
  }

  get multimediaArray() {
    return this.newProviderForm.get('multimedia') as UntypedFormArray;
  }

  pushMultimedia() {
    this.multimediaArray.push(this.newMultimedia());
  }

  removeMultimedia(index: number) {
    this.multimediaArray.removeAt(index);
  }

  /** <--Multimedia**/

  /** Contact Info -->**/
  newContact(): UntypedFormGroup {
    return this.fb.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      phone: [''],
      position: [''],
    });
  }

  get publicContactArray() {
    return this.newProviderForm.get('publicContacts') as UntypedFormArray;
  }

  pushPublicContact() {
    this.publicContactArray.push(this.newContact());
  }

  removePublicContact(index: number) {
    this.publicContactArray.removeAt(index);
  }

  /** <--Contact Info **/

  /** User Array -->**/
  user(): UntypedFormGroup {
    return this.fb.group({
      email: ['', Validators.compose([Validators.required, Validators.email])],
      id: [''],
      name: ['', Validators.required],
      surname: ['', Validators.required]
    });
  }

  get usersArray() { // return form fields as array
    return this.newProviderForm.get('users') as UntypedFormArray;
  }

  addUser() {
    this.usersArray.push(this.user());
  }

  deleteUser(index) {
    if (this.usersArray.length === 1) {
      this.errorMessage = 'There must be at least one provider!';
      window.scrollTo(0, 0);
      return;
    }
    this.usersArray.removeAt(index);
  }

  addDefaultUser() {
    // this.userInfo.given_name = this.authService.getUserProperty('given_name');
    // this.userInfo.family_name = this.authService.getUserProperty('family_name');
    // this.userInfo.email = this.authService.getUserProperty('email');
    this.usersArray.controls[0].get('name').setValue(this.userInfo.given_name);
    this.usersArray.controls[0].get('surname').setValue(this.userInfo.family_name);
    this.usersArray.controls[0].get('email').setValue(this.userInfo.email);
    this.newProviderForm.controls['mainContact'].get('firstName').setValue(this.userInfo.given_name);
    this.newProviderForm.controls['mainContact'].get('lastName').setValue(this.userInfo.family_name);
    this.newProviderForm.controls['mainContact'].get('email').setValue(this.userInfo.email);
  }

  /** <-- User Array**/

  getSortedChildrenCategories(childrenCategory: Vocabulary[], parentId: string) {
    return this.sortVocabulariesByName(childrenCategory.filter(entry => entry.parentId === parentId));
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

  markFormAsDirty() {
    for (const i in this.newProviderForm.controls) {
      for (const j in this.newProviderForm.controls[i].value) {
        // console.log(this.newProviderForm.controls[i].value);
        if (this.newProviderForm.controls[i].value.hasOwnProperty(j)) {
          if (this.newProviderForm.controls[i].get(j)) {
            if (this.newProviderForm.controls[i].get(j).value.constructor !== Array) {
              this.newProviderForm.controls[i].get(j).markAsDirty();
              this.newProviderForm.controls[i].get(j).markAsTouched();
            }
          }
        }
      }
      if (this.newProviderForm.controls[i].value.constructor === Array) {
        for (let j = 0; j < this.getFieldAsFormArray(i).controls.length; j++) {
          const keys = Object.keys(this.newProviderForm.controls[i].value[j]);
          for (let k = 0; k < keys.length; k++) {
            if (this.getFieldAsFormArray(i).controls[j].get(keys[k])) {
              this.getFieldAsFormArray(i).controls[j].get(keys[k]).markAsTouched();
              this.getFieldAsFormArray(i).controls[j].get(keys[k]).markAsDirty();
            }
          }
        }
      }
      this.newProviderForm.controls[i].markAsDirty();
    }
  }

  unsavedChangesPrompt() {
    this.hasChanges = true;
  }

  timeOut(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Terms Modal--> **/
  toggleTerm(term) {
    if (term === 'privacyPolicy') {
      this.privacyPolicy = !this.privacyPolicy;
    } else if (term === 'authorizedRepresentative') {
      this.authorizedRepresentative = !this.authorizedRepresentative;
    }
    this.checkTerms();
  }

  checkTerms() {
    this.agreedToTerms = this.privacyPolicy && this.authorizedRepresentative;
  }

  acceptTerms() {
    if (this._hasUserConsent && this.edit) {
      this.providerService.adminAcceptedTerms(this.providerId, this.pendingProvider).subscribe(
        res => {},
        error => { console.log(error); },
        () => {}
      );
    }
  }

  /** <--Terms Modal **/

  sanitizeAbbreviation(input: string): string {
    return input.replace(/[\n\t\s]+/g, ' ')
      .replace(/\s+$/g, '')
      .replace(/[^a-zA-Z0-9\s\-_/]+/g, '')
      .replace(/[\/\s]+/g, '_')
      .toLowerCase();
  }

}
