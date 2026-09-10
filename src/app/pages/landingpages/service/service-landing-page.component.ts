import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Provider, Service, URL } from '../../../entities/eic-model';
import { AuthenticationService } from '../../../services/authentication.service';
import { ResourceService } from '../../../services/resource.service';
import { environment } from 'src/environments/environment';
import { zip } from 'rxjs/internal/observable/zip';

@Component({
  selector: 'app-service-landing-page',
  templateUrl: './service-static-landing-page.component.html',
  // styleUrls: ['../landing-page.component.css']
})
export class ServiceLandingPageComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  projectName = environment.projectName;
  vocabularies: Map<string, object[]>;
  id: string;
  ready = false;

  path: string;
  myProviders:  Provider[] = [];
  canAddOrEditService = false;

  relatedServices: Service[] = null;
  resourcePayload: Service = null;
  cleanView = false;
  showLogo = false;

  constructor(public router: Router, public route: ActivatedRoute, public resourceService: ResourceService, private authenticationService: AuthenticationService) {
  }

  ngOnInit() {
    this.ready = false;
    this.cleanView = this.router.url.includes('/changeLogClean');

    this.subscriptions.push(
      this.route.params.subscribe(
        params => {
          this.id = params['id'];
          this.subscriptions.push(
            zip(this.resourceService.getServiceOrDatasource(this.id),
              this.resourceService.getUiVocabularies()).subscribe(
              next => {
                  this.resourcePayload = next[0];
                  this.resourcePayload.extras['openAireChangeLog'].reverse();
                  this.vocabularies = next[1];
                  if(this.resourcePayload.relatedResources == null
                    || this.resourcePayload.relatedResources.length === 0
                    || (this.resourcePayload.relatedResources.length === 1 && this.resourcePayload.relatedResources[0] === null)) {
                    this.relatedServices = [];
                    this.ready = true;
                  }
                  else {
                    this.resourceService.getServicesByIdArray(this.resourcePayload.relatedResources).subscribe(
                      next => {this.relatedServices = next;},
                      error => {console.log(error);},
                      () => {this.ready = true;}
                    );
                  }
                },
              error => {console.log(error);},
              () => {}
            )
          );
        }
      )
    );

    this.canAddOrEditService = false;
    // console.log('is logged in: ' + this.authenticationService.isLoggedIn());
    if (this.authenticationService.isLoggedIn() && this.projectName === 'OpenAIRE Catalogue') {
      this.myProviders = [];
      this.resourceService.getMyServiceProviders().subscribe(
        res => this.myProviders = res,
        error => console.log(error.error),
        () => {
          this.canAddOrEditService = this.myProviders.some(p => p.id === 'openaire');
        }
      );
    }
  }

  ngOnDestroy(): void {
    for (let i = 0; i < this.subscriptions.length; i++) {
      this.subscriptions[i].unsubscribe();
    }
  }

  timeOut(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onOutletLoaded(component) {
    if (!this.ready) {
      this.timeOut(300).then(() => this.onOutletLoaded(component));
      return;
    } else {
      component.resourcePayload = this.resourcePayload;
      component.vocabularies = this.vocabularies;
      component.relatedServices = this.relatedServices;
    }
    if (window.location.toString().includes('overview')) {
      this.path = 'overview';
    } else if (window.location.toString().includes('subscriptions')) {
      this.path = 'subscriptions';
    } else if (window.location.toString().includes('resourcesAndSupport')) {
      this.path = 'resourcesAndSupport';
    } else if (window.location.toString().includes('miscellaneous')) {
      this.path = 'miscellaneous';
    }

    return;
  }

  goto(url: URL) {
    window.open(url.toString(), '_blank');
  }

  protected readonly document = document;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.checkNavbarSticky();
  }

  checkNavbarSticky() {
    const navbar = document.getElementById('myNavBar');
    this.showLogo = navbar && navbar.classList.contains('uk-active') && navbar.classList.contains('uk-navbar-sticky');
  }

}
