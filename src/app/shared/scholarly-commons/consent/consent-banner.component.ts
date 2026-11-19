import {DatePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ConsentCategory, CONSENT_CATEGORIES} from './consent-cookies';
import {ConsentChoice, ConsentService} from './consent.service';

// UIkit is loaded as a global script (see "scripts" in angular.json).
declare const UIkit: { offcanvas(element: HTMLElement): { show(): void; hide(): void } };

/**
 * The cookie banner (bottom left, until the visitor has chosen), the floating cookie button that takes its place
 * once they have, and the cookie settings panel (a UIkit offcanvas, opened from either).
 */
@Component({
  selector: 'app-sc-consent-banner',
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consent-banner.component.html',
  styleUrl: './consent-banner.component.less',
})
export class ScConsentBannerComponent {
  protected readonly consent = inject(ConsentService);
  protected readonly categories = CONSENT_CATEGORIES;

  /** The panel's boxes; they only take effect with "Save settings". */
  protected readonly draft = signal<ConsentChoice>({analytics: false, errorMonitoring: false});

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  constructor() {
    effect(() => {
      const open = this.consent.settingsOpen();
      const panel = this.panel().nativeElement;
      if (open) {
        // Each time the panel opens, the boxes show what is stored (both off before any choice).
        untracked(() => this.draft.set({
          analytics: this.consent.analytics(),
          errorMonitoring: this.consent.errorMonitoring(),
        }));
        UIkit.offcanvas(panel).show();
      } else if (panel.classList.contains('uk-open')) {
        UIkit.offcanvas(panel).hide();
      }
    });
  }

  protected isChecked(id: ConsentCategory['id']): boolean {
    return id === 'necessary' || this.draft()[id];
  }

  protected toggle(id: ConsentCategory['id'], event: Event): void {
    if (id !== 'necessary') {
      const checked = (event.target as HTMLInputElement).checked;
      this.draft.update((draft) => ({...draft, [id]: checked}));
    }
  }

  protected save(): void {
    this.consent.save(this.draft());
  }

  /** UIkit closed the panel itself (Esc, the close button or the overlay): keep the service in step. */
  protected onHidden(event: Event): void {
    // `hidden` also bubbles up from UIkit components inside the panel.
    if (event.target === event.currentTarget) {
      this.consent.closeSettings();
    }
  }
}
