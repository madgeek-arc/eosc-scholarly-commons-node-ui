import {Component, Input, OnInit} from '@angular/core';
import {ProviderBundle} from '../../../../entities/eic-model';

@Component({
  selector: 'app-provider-full-history',
  templateUrl: 'provider-full-history.component.html',
  standalone: false
})

export class ProviderFullHistoryComponent implements OnInit {

  @Input() providerBundle: ProviderBundle = null;

  constructor() {
  }

  ngOnInit() {
    // console.log(this.providerBundle);
  }

}
