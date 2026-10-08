import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-sc-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="sc-footer">
      <div class="uk-container uk-container-expand sc-footer__bar">
        <span>EOSC Node &middot; Scholarly Commons &mdash; Data, Computing &amp; Digital</span>
        <span class="uk-flex sc-footer__links">
          <a routerLink="/terms-and-policies" class="uk-link-muted">Terms &amp; Policies</a>
          <span>Contact</span>
          <span>Provider dashboard</span>
        </span>
      </div>
    </footer>
  `,
  styleUrl: './footer.component.less',
})
export class ScFooterComponent {
}
