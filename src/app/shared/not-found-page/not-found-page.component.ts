import { ChangeDetectionStrategy, Component } from '@angular/core';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-not-found-page',
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPageComponent {

  projectName = environment.projectName;
  serviceORresource = environment.serviceORresource;

}
