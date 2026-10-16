import {Injectable, inject} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy} from '@angular/router';
import {PageMetaService} from './page-meta.service';

/** Applies the `title` of the deepest route, and `data.noindex`, to the document after every navigation. */
@Injectable({providedIn: 'root'})
export class PageTitleStrategy extends TitleStrategy {
  private readonly pageMeta = inject(PageMetaService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let leaf: ActivatedRouteSnapshot = snapshot.root;
    while (leaf.firstChild) {
      leaf = leaf.firstChild;
    }
    this.pageMeta.set(this.buildTitle(snapshot), {noindex: leaf.data['noindex'] === true});
  }
}
