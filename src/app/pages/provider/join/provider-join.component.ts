import { Component, OnInit, inject } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-join',
  templateUrl: 'provider-join.component.html',
  standalone: false
})

export class ProviderJoinComponent implements OnInit {
  private route = inject(ActivatedRoute);


  token: string;

  ngOnInit() {
    this.route.params.subscribe(
      params=> {
        this.token = params['token'];
        sessionStorage.setItem('token', this.token);
      }
    );
  }
}
