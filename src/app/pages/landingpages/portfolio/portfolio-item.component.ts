import { Component, OnInit, inject } from '@angular/core';
import {ResourceService} from '../../../services/resource.service';
import {ActivatedRoute} from '@angular/router';
import {Service, Vocabulary} from '../../../entities/eic-model';
import {zip} from 'rxjs';
import {Paging} from '../../../entities/paging';


@Component({
  selector: 'app-portfolio-item',
  templateUrl: './portfolio-item.component.html',
  standalone: false
})
export class PortfolioItemComponent implements OnInit{
  protected resourceService = inject(ResourceService);
  protected route = inject(ActivatedRoute);


  response: Paging<Service>;
  portfolioVoc: Vocabulary;
  portfolioId: string;
  ready = false;

  ngOnInit() {
    this.portfolioId = this.route.snapshot.paramMap.get('id');
    zip(
      this.resourceService.getVocabularyById(this.portfolioId),
      this.resourceService.getServicesByVocabularyTypeAndId('portfolios', this.portfolioId)
    ).subscribe(
      res => {
        this.portfolioVoc = res[0];
        this.response = res[1];
      },
      error => {console.error(error);},
      () => {
        // console.log(this.services);
        this.ready = true;
      }
    );
  }

}
