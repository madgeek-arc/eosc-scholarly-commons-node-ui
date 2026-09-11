import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {UiVocabulary} from '../../../../entities/dynamic-form-model';
import {Service, URL} from '../../../../entities/eic-model';
import * as uikit from 'uikit';


@Component({
  selector: 'app-service-landing-page',
  templateUrl: 'overview.component.html',
  // styleUrls: ['../../landing-page.component.css'],
  standalone: false
})
export class OverviewComponent {

  @Input() vocabularies: Map<string, UiVocabulary[]>;
  @Input() relatedServices: Service[] = null;
  @Input() resourcePayload: Service = null;


  slide = 0;
  benefitSlide = 0;

  slideMobile = 0;
  benefitSlideMobile = 0;

  constructor(private router: Router) {}

  getVocabularyName(vocabularyType: string, id: string): string {
    // console.log(this.vocabularies);
    for (const vocabulary of this.vocabularies[vocabularyType]) {
      if (vocabulary.id === id)
        return vocabulary.name;
    }
  }

  dragSlide(id: string) {
    if (id === 'slideShow') {
      this.slide = uikit.getComponent(document.querySelector('[uk-slideshow]'), 'slideshow').index;
    } else {
      this.benefitSlide = uikit.getComponent(document.querySelector('[uk-slideshow]'), 'slideshow').index;
    }
  }

  showSlide(id: string, index: number) {
    uikit.slideshow('#' + id).show(index);
    // console.log(UIkit.getComponent(document.querySelector('[uk-slideshow]'), 'slideshow').index);
    if (id === 'slideShow') {
      this.slide = index;
    } else {
      this.benefitSlide = index;
    }
  }

  dragSlideMobile(id: string) {
    if (id === 'slideShowMobile') {
      this.slideMobile = uikit.getComponent(document.querySelector('[uk-slideshow]'), 'slideshow').index;
    } else {
      this.benefitSlideMobile = uikit.getComponent(document.querySelector('[uk-slideshow]'), 'slideshow').index;
    }
  }

  showSlideMobile(id: string, index: number) {
    uikit.slideshow('#' + id).show(index);
    // console.log(UIkit.getComponent(document.querySelector('[uk-slideshow]'), 'slideshow').index);
    if (id === 'slideShowMobile') {
      this.slideMobile = index;
    } else {
      this.benefitSlideMobile = index;
    }

  }

  reloadOnSamePage(url: string) {
    this.router.navigateByUrl('/', {skipLocationChange: true}).then( () => {
      this.router.navigate([url]);
    });
  }

  goto(url: string | URL) {
    window.open(url.toString(), '_blank');
  }

}
