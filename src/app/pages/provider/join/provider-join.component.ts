import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-join',
  templateUrl: 'provider-join.component.html',
  standalone: false
})

export class ProviderJoinComponent implements OnInit {

  token: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(
      params=> {
        this.token = params['token'];
        sessionStorage.setItem('token', this.token);
        console.log(sessionStorage.getItem('token'));
      }
    );
  }
}
