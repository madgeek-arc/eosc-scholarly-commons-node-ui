import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AuthenticationService} from '../../services/authentication.service';
import {ResourceService} from '../../services/resource.service';
import {NavigationService} from '../../services/navigation.service';
import {Bundle, Datasource, Service} from '../../entities/eic-model';
import {Subscription} from 'rxjs';


@Component({
  selector: 'app-service-dashboard',
  templateUrl: './service-dashboard.component.html',
  standalone: false
})
export class ServiceDashboardComponent implements OnInit {

  public serviceBundle: Bundle<Service | Datasource>;
  public service: Service;
  providerId: string;
  serviceId: string;
  datasource: Datasource = null;

  private sub: Subscription;

  constructor(public authenticationService: AuthenticationService,
              public resourceService: ResourceService,
              public router: NavigationService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.providerId = this.route.snapshot.paramMap.get('providerId');
    this.serviceId = this.route.snapshot.paramMap.get('resourceId');

    this.sub = this.route.params.subscribe(params => {
      this.resourceService.getServiceOrDatasourceBundle(params['resourceId']).subscribe(
        suc => {
          this.serviceBundle = suc;
        },
        err => {
          if (err.status === 404) {
            this.router.go('/404');
          }
          // this.errorMessage = 'An error occurred while retrieving data for this service. ' + err.error;
        }
      );

      this.resourceService.getDatasourceByServiceId(params['resourceId']).subscribe(
        suc => this.datasource = suc,
        err => console.log(err)
      );
    });
  }

  onActivate(componentReference) {
    componentReference.serviceBundle = this.serviceBundle;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
