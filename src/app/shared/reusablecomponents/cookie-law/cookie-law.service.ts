/**
 * angular2-cookie-law
 *
 * Copyright 2016-2017, @andreasonny83, All rights reserved.
 *
 * @author: @andreasonny83 <andreasonny83@gmail.com>
 */

import { Injectable } from '@angular/core';

@Injectable()
export class CookieLawService {


  seen(): boolean {
    return this.cookieExists('cookieLawSeen');
  }

  storeCookie(): void {
    return this.setCookie('cookieLawSeen');
  }

  /**
   * try to read a saved cookie
   *
   * @param name [the cookie name]
   *
   * @return      [the cookie's value]
   */
  private cookieExists(name: string): boolean {
    if (typeof document !== 'undefined') {
      const ca: Array<string> = document.cookie.split(';');
      const caLen: number = ca.length;
      const cookieName = name + '=';
      let c: string;

      for (let i = 0; i < caLen; i += 1) {
        c = ca[i].replace(/^\s\+/g, '');
        if (c.indexOf(cookieName) !== -1) {
          return true;
        }
      }
  }
    return false;
  }

  /**
   * store a new cookie in the browser
   *
   * @param name [the name for the cookie]
   */
  private setCookie(name: string): void {
    if (typeof document !== 'undefined') {
      const d: Date = new Date();
      d.setTime(d.getTime() + 3*30 * 24 * 60 * 60 * 1000); // in 3 months
      const expires = `expires=${d.toUTCString()}`;

      document.cookie = encodeURIComponent(name) + '=true; path=/;  expires='+expires+';';
    }
  }
}
