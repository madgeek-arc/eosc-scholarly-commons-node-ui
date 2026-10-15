import { Injectable, inject } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {UserInfo} from '../entities/userInfo';
import {Provider} from '../entities/eic-model';

@Injectable()
export class UserService {
  private http = inject(HttpClient);

  base = environment.API_ENDPOINT;

  getUserInfo() {
    return this.http.get<UserInfo>(this.base + '/user/info');
  }

  getMyProviders() {
    return this.http.get<Provider[]>(this.base + '/providers/my');
  }

  getInvitationToken(email: string) {
    let params = new HttpParams();
    params = params.append('email', email);
    return this.http.post(this.base + '/invitations' , {}, {params, responseType: 'text'});
  }
}
