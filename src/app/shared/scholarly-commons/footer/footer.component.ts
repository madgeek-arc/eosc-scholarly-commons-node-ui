import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ConsentService} from '../consent/consent.service';

@Component({
  selector: 'app-sc-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="sc-footer">
      <div class="uk-container uk-container-expand sc-footer__bar">
        <span>EOSC Node &middot; Scholarly Commons &mdash; Data, Computing &amp; Digital</span>
        <span class="uk-flex uk-flex-wrap sc-footer__links">
          <a routerLink="/terms-and-policies" class="uk-link-muted">Terms &amp; Policies</a>
          <a href="#" role="button" class="uk-link-muted" (click)="openCookieSettings($event)">Cookie settings</a>
          <span>Contact</span>
          <span>Provider dashboard</span>
        </span>
      </div>
    </footer>
  `,
  styleUrl: './footer.component.less',
})
export class ScFooterComponent {
  private readonly consent = inject(ConsentService);

  protected openCookieSettings(event: Event): void {
    event.preventDefault();
    this.consent.openSettings();
  }
}
