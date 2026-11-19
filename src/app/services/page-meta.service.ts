import {Injectable, inject} from '@angular/core';
import {Meta, Title} from '@angular/platform-browser';

export const SITE_NAME = 'EOSC Scholarly Commons Node';
export const DEFAULT_DESCRIPTION =
  'Services from trusted providers for the scholarly commons, for institutions, funders, research teams and individual researchers.';

// Search engines cut descriptions at about this length.
const DESCRIPTION_LIMIT = 160;

export interface PageMetaOptions {
  description?: string;
  noindex?: boolean;
}

/**
 * Sets the document title and the description, Open Graph and robots tags for the page on screen.
 * Every call replaces all of them, so a page that passes nothing falls back to the site defaults.
 */
@Injectable({providedIn: 'root'})
export class PageMetaService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  set(page: string | undefined, options: PageMetaOptions = {}): void {
    const title = page ? `${page} | ${SITE_NAME}` : SITE_NAME;
    const description = summarise(options.description) || DEFAULT_DESCRIPTION;

    this.title.setTitle(title);
    this.meta.updateTag({name: 'description', content: description});
    this.meta.updateTag({property: 'og:title', content: title});
    this.meta.updateTag({property: 'og:description', content: description});
    if (options.noindex) {
      this.meta.updateTag({name: 'robots', content: 'noindex'});
    } else {
      this.meta.removeTag('name="robots"');
    }
  }
}

function summarise(text: string | undefined): string {
  const flat = (text ?? '').replace(/\s+/g, ' ').trim();
  if (flat.length <= DESCRIPTION_LIMIT) {
    return flat;
  }
  const cut = flat.slice(0, DESCRIPTION_LIMIT - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
