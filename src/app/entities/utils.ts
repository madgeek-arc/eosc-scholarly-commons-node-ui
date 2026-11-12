/**
 * Created by stefanos on 2/3/2017.
 */

export function deleteCookie(name) {
  setCookie(name, '', new Date(0));
}

export function setCookie(name: string, value: string, expiration: Date, path = '/') {
    const expires = `expires=${expiration.toUTCString()}`;
    const cpath = path ? `; path=${path}` : '';
    document.cookie = `${name}=${value}; ${expires}${cpath}; sameSite=None; secure=true;`;
}
