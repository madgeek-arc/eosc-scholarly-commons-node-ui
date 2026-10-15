import { Component, OnInit, inject } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DatasourceService} from '../../../services/datasource.service';
import {DatasourceDetails} from '../../../entities/datasource';

@Component({
  selector: 'app-datasource-landing',
  templateUrl: 'datasource.html',
  providers: [DatasourceService],
  standalone: false
})

export class Datasource implements OnInit {
  private route = inject(ActivatedRoute);
  private datasourceService = inject(DatasourceService);


  datasource: DatasourceDetails = null;

  ngOnInit() {
    this.route.params.subscribe(
      params => {
        this.datasourceService.getDatasourceById(params['datasourceId']).subscribe(
          next => {
            if (next.results.length === 1)
              this.datasource = next.results[0];
          },
          error => {console.error(error);}
        );
      }
    );
  }

}
