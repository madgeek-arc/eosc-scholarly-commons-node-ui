import {Component, Input} from '@angular/core';
import {Service, URL} from '../../../../entities/eic-model';

@Component({
  selector: 'app-service-landing-page-misc',
  templateUrl: 'miscellaneous.component.html',
  // styleUrls: ['../../landing-page.component.css'],
  standalone: false
})
export class MiscellaneousComponent {

  @Input() resourcePayload: Service;

  navigateTo(url: URL) {
    window.open(url.toString(), '_blank');
  }

}
