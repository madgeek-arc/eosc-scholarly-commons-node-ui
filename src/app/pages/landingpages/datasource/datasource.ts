import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DatasourceService} from '../../../services/datasource.service';
import {DatasourceDetails} from '../../../entities/datasource';

@Component({
  selector: 'app-datasource-landing',
  templateUrl: 'datasource.html',
  providers: [DatasourceService],
  standalone: false
})

export class Datasource implements OnInit {

  datasource: DatasourceDetails = null;

  constructor(private route: ActivatedRoute, private datasourceService: DatasourceService) { }

  ngOnInit() {
    this.route.params.subscribe(
      params => {
        this.datasourceService.getDatasourceById(params['datasourceId']).subscribe(
          next => {
            if (next.results.length === 1)
              this.datasource = next.results[0];
          },
          error => {console.log(error);}
        );
      }
    );
  }

}
