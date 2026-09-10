import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {UserInfo} from '../../entities/userInfo';
import {FormBuilder, FormControl, Validators} from '@angular/forms';


@Component({
  selector: 'app-admin-dashboard',
  templateUrl: 'admin-dashboard.component.html',
})

export class AdminDashboardComponent implements OnInit {

  userInfo: UserInfo = null;
  inviteeEmail: FormControl = this.fb.control(null, [Validators.email, Validators.required]);
  invitationUrl: string = null;

  path: string = null;

  titleIcon: string = null;
  title: string = null;

  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService, private fb: FormBuilder) {
    this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          if (event.url.includes('services')) {
            this.path = 'services';
            this.titleIcon = 'grid_view';
            this.title = 'Services';
          } else if (event.url.includes('datasources')) {
            this.path = 'datasources';
            this.titleIcon = 'grid_view';
            this.title = 'Datasource Subprofiles';
          } else {
            this.path = 'providers';
            this.titleIcon = 'real_estate_agent';
            this.title = 'Providers';
          }
        }
      }
    );
  }

  ngOnInit() {
    this.userService.getUserInfo().subscribe(
      res => {this.userInfo = res;},
      error => {console.error(error);}
    );
    // this.route.params.subscribe(
    //   params => {
    //     this.providerId = params['providerId'];
    //     if (this.providerId) {
    //       this.providerService.getProviderBundle(this.providerId).subscribe(
    //         res => {this.providerBundle = res},
    //         error => {console.error(error)}
    //       );
    //     }
    //   }
    // );
  }

  // onActivate(componentReference) {
  //   componentReference.providerBundle = this.providerBundle;
  // }

  toggleSidebar() {
    const el: HTMLElement = document.getElementById('sidebar_toggle');
    if(!el.classList.contains('closed')) {
      el.classList.add('closed');
      const el1: HTMLElement = document.getElementById('sidebar_main_content');
      el1.classList.remove('sidebar_main_active');
      el1.classList.add('sidebar_main_inactive');
    } else {
      el.classList.remove('closed');
      const el1: HTMLElement = document.getElementById('sidebar_main_content');
      el1.classList.add('sidebar_main_active');
      el1.classList.remove('sidebar_main_inactive');
    }
  }

  canInvite() {
    if (this.userInfo) {
      if (this.userInfo.roles.includes('ADMIN') || this.userInfo.roles.includes('ONBOARDING_TEAM'))
        return true;
    }
    return false;
  }

  getInvitationToken() {
    this.userService.getInvitationToken(this.inviteeEmail.value).subscribe(
      res=> {
        this.invitationUrl = location.origin + '/join/' + res;
        // console.log(this.invitationUrl);
      },
      error => {console.error(error);}
    );
  }

  clearData() {
    this.inviteeEmail.reset(null);
    this.invitationUrl = null;
  }

  copyToClipboard() {
    // navigator clipboard api needs a secure context (https)
    if (!navigator.clipboard) {
      this.fallbackCopyTextToClipboard(this.invitationUrl);
      return;
    }
    navigator.clipboard.writeText(this.invitationUrl).then( ()=> {
      // this.title = 'copied to clipboard';
      // console.log('Async: Copying to clipboard was successful!');
    }).catch((err)=> {
      console.error('Async: Could not copy text: ', err);
    });
  }

  fallbackCopyTextToClipboard(text) { // this is deprecated support is not guaranteed
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) console.log('copied');
      // this.title = 'copied to clipboard';
      // const msg = successful ? 'successful' : 'unsuccessful';
      // console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  }

}
