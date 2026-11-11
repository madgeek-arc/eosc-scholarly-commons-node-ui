import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ConsentService} from '../consent/consent.service';

@Component({
  selector: 'app-sc-footer',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.less',
})
export class ScFooterComponent {
  private readonly consent = inject(ConsentService);

  protected openCookieSettings(event: Event): void {
    event.preventDefault();
    this.consent.openSettings();
  }
}
