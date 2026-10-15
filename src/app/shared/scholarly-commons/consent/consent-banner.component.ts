import {ChangeDetectionStrategy, Component, effect, inject, signal, untracked} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ConsentService} from './consent.service';

@Component({
  selector: 'app-sc-consent-banner',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consent-banner.component.html',
  styleUrl: './consent-banner.component.less',
})
export class ScConsentBannerComponent {
  protected readonly consent = inject(ConsentService);

  protected readonly analytics = signal(false);
  protected readonly errorMonitoring = signal(false);

  constructor() {
    // Each time the banner opens, the boxes show what is currently stored (both off for a first visit).
    effect(() => {
      if (this.consent.bannerVisible()) {
        untracked(() => {
          this.analytics.set(this.consent.analytics());
          this.errorMonitoring.set(this.consent.errorMonitoring());
        });
      }
    });
  }

  protected save(): void {
    this.consent.save({analytics: this.analytics(), errorMonitoring: this.errorMonitoring()});
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
