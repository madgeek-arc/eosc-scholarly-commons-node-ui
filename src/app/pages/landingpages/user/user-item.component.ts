import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ResourceService} from '../../../services/resource.service';
import {Service, Vocabulary} from '../../../entities/eic-model';
import {Paging} from '../../../entities/paging';
import {zip} from 'rxjs';

@Component({
  selector: 'app-user-item',
  templateUrl: './user-item.component.html',
  standalone: false
})
export class UserItemComponent implements OnInit {

  response: Paging<Service>;
  services: Map<string, Object[]>;
  userVoc: Vocabulary;
  portfolios: Vocabulary[];
  portfoliosMap: Map<string, Service[]>;
  userVocId: string;
  ready = false;

  constructor(protected resourceService: ResourceService, protected route: ActivatedRoute) {
  }

  ngOnInit() {
    this.userVocId = this.route.snapshot.paramMap.get('id');
    zip(
      this.resourceService.getVocabularyById(this.userVocId),
      this.resourceService.getServicesByVocabularyTypeAndId('users', this.userVocId),
      this.resourceService.getNewVocabulariesByType('Portfolios')
    ).subscribe(
      res => {
        this.userVoc = res[0];
        this.response = res[1];
        for (const [key, value] of Object.entries(res[1])) {
          this.services = value;
        }
        this.portfolios = res[2];
        this.portfoliosMap = new Map<string, Service[]>();
        this.resourceService.getServicesSnippetByUserContentAndPortfolioType(this.userVocId.replace('&', '%26')).subscribe(
          next => {
            this.portfoliosMap.set('all', next.results);
          },
          error => { console.log(error); }
        );
        for (const portfolio of this.portfolios) {
          this.resourceService.getServicesSnippetByUserContentAndPortfolioType(this.userVocId.replace('&', '%26'), portfolio['id']).subscribe(
            next => {
              this.portfoliosMap.set(portfolio.id, next.results);
            },
            error => { console.log(error); }
          );
        }
      },
      error => { console.log(error); },
      () => {
        this.ready = true;
      }
    );
  }

}
