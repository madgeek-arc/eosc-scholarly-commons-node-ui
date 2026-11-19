import {ChangeDetectionStrategy, Component, OnInit, inject, input, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Content, PageContent} from '../../entities/page-content';
import {HelpContentService} from '../../services/help-content.service';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-help-content',
  template: `
    @if (contents()?.length) {
      @for (content of contents(); track content) {
        <div [innerHTML]="content.content" class="uk-margin-medium-bottom"></div>
      }
    }
    `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpContentComponent implements OnInit {
  _helpContentService = inject(HelpContentService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  readonly position = input<string>(undefined);

  readonly contents = signal<Content[] | undefined>(undefined);
  errorMessage: string = null;

  ngOnInit() {
    this.errorMessage = null;
    if (environment.showHelpContent) {
      this._helpContentService.getActivePageContent(this.router.url).subscribe(
        pageContent => this.shiftThroughContent(pageContent));
    }
  }

  shiftThroughContent(pageContent: PageContent) {
    this.contents.set(pageContent.content[this.position()]);
  }

  isPresent() {
    return !!this.contents()?.length;
  }

  handleError(error) {
    this.errorMessage = 'System error retrieving page content (Server responded: ' + error + ')';
  }
}

@Component({
  selector: 'app-aside-help-content',
  template: `
    @if (contents()?.length) {
      @for (content of contents(); track content) {
        <div [innerHTML]="content.content"
        class="uk-card uk-card-body uk-card-default sidemenu uk-margin-bottom"></div>
      }
    }
    `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideHelpContentComponent extends HelpContentComponent {
}
