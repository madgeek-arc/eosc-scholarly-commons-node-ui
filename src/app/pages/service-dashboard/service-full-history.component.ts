import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Bundle, Service} from '../../entities/eic-model';

@Component({
  selector: 'app-service-dashboard',
  templateUrl: './service-full-history.component.html',
  standalone: false
})
export class ServiceFullHistoryComponent implements OnInit {

  @Input() serviceBundle: Bundle<Service>;

  constructor() {
  }

  ngOnInit() {
  }

}
