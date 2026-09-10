import {NavigationEnd, Router} from '@angular/router';
import {Injectable} from '@angular/core';
import {Subscription} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SmoothScroll {
  private interval;
  private readonly sub;
  private lastRoute;
  private whitelist = [];

  constructor(private router: Router) {
    if(typeof window !== 'undefined') {
      this.sub = router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          if (this.interval) {
            clearInterval(this.interval);
          }
          const fragment = router.parseUrl(router.url).fragment;
          if (this.lastRoute !== this.getUrl(event.url)) {
            window.scrollTo({top: 0});
          }
          if (fragment) {
            let i = 0;
            this.interval = setInterval(() => {
              i++;
              const element = document.getElementById(fragment);
              if (element) {
                if (this.interval) {
                  clearInterval(this.interval);
                }
                const yOffset = -100;
                let position = 0;
                const interval = setInterval(() => {
                  if (position !== element.getBoundingClientRect().top) {
                    position = element.getBoundingClientRect().top;
                  } else {
                    clearInterval(interval);
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({top: y, behavior: 'smooth'});
                  }
                }, 50);
              }
              if (i > 4 && this.interval) {
                clearInterval(this.interval);
              }
            }, 100);
          } else if(!this.whitelist.includes(this.getUrl(event.url))) {
            window.scrollTo({top: 0, behavior: 'smooth'});
          }
          this.lastRoute = this.getUrl(event.url);
        }
      });
    }
  }

  private getUrl(url: string): string {
    const full = url.split('?')[0].split('#')[0];
    const route = this.whitelist.find(_ => full.includes(_));
    return (route)?(route):full;
  }

  public clearSubscriptions() {
    if (this.sub && this.sub instanceof Subscription) {
      this.sub.unsubscribe();
    }
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

