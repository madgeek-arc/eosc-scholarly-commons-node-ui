import { Component, Input } from '@angular/core';
import { Service } from '../../../../../entities/eic-model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-log',
  templateUrl: 'change-log.component.html',
  standalone: false
})

export class ChangeLogComponent {

  @Input() resourcePayload: Service = null;

  cleanView = this.router.url.includes('/changeLogClean');

  constructor(public router: Router) {}

  badgeColor(status: string) {
    switch (status) {
      case 'Add':
        return 'rgb(76, 137, 242)';
      case 'Added':
        return 'rgb(20, 179, 119)';
      case 'Fixed':
        return 'rgb(240, 80, 110)';
      case 'Changed':
        return 'rgb(76, 137, 242)';
      case 'Removed':
        return 'rgb(250, 160, 90)';
    }
  }

}
