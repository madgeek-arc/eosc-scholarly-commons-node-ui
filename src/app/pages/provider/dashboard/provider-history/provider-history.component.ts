import {Component, Input, OnInit} from '@angular/core';
import {ProviderBundle} from '../../../../entities/eic-model';

@Component({
  selector: 'app-provider-history',
  templateUrl: 'provider-history.componenet.html',
  standalone: false
})

export class ProviderHistoryComponent implements OnInit {

  @Input() providerBundle: ProviderBundle = null;

  constructor() {
  }

  ngOnInit() {
    // console.log(this.providerBundle);
  }

}
