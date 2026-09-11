import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {ProviderService} from '../../../services/provider.service';
import {ProviderBundle} from '../../../entities/eic-model';
import {UserService} from '../../../services/user.service';
import {UserInfo} from '../../../entities/userInfo';
import {UntypedFormBuilder, UntypedFormControl, Validators} from '@angular/forms';


@Component({
  selector: 'app-provider-dashboard',
  templateUrl: 'provider-dashboard.component.html',
  standalone: false
})

export class ProviderDashboardComponent implements OnInit {

  providerId: string = null;
  providerBundle: ProviderBundle = null;
  userInfo: UserInfo = null;
  inviteeEmail: UntypedFormControl = this.fb.control(null, [Validators.email, Validators.required]);
  invitationUrl: string = null;
  path: string = null;

  titleIcon: string = null;
  title: string = null;

  constructor(private route: ActivatedRoute, private router: Router, private providerService: ProviderService,
              private userService: UserService, private fb: UntypedFormBuilder) {
    this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          if (event.url.includes('home')) {
            this.path = 'home';
            this.titleIcon = 'home';
            this.title = 'Home';
          } else if (event.url.includes('info')) {
            this.path = 'info';
            this.titleIcon = 'info';
            this.title = 'Provider\'s profile';
          } else if (event.url.includes('history')) {
            this.path = 'history';
            this.titleIcon = 'history';
            this.title = 'History of updates';
          } else if (event.url.includes('services')) {
            this.path = 'services';
            this.titleIcon = 'reorder';
            this.title = 'Services';
          }
        }
      }
    );
  }

  ngOnInit() {
    this.route.params.subscribe(
      params => {
        this.providerId = params['providerId'];
        if (this.providerId) {
          this.providerService.getProviderBundleById(this.providerId).subscribe(
            res => {this.providerBundle = res;},
            error => {console.error(error);}
          );
        }
      }
    );

    this.userService.getUserInfo().subscribe(
      res => {this.userInfo = res;},
      error => {console.error(error);}
    );
  }

  onActivate(componentReference) {
    componentReference.providerBundle = this.providerBundle;
  }

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

  // getInvitationToken() {
  //   this.userService.getInvitationToken(this.inviteeEmail.value).subscribe(
  //     res=> {
  //       this.invitationUrl = location.origin + '/join/' + res;
  //       console.log(this.invitationUrl);
  //     },
  //     error => {console.error(error)}
  //   );
  // }
  //
  // clearData() {
  //   this.inviteeEmail.reset(null);
  //   this.invitationUrl = null;
  // }
  //
  // copyToClipboard() {
  //   // navigator clipboard api needs a secure context (https)
  //   if (!navigator.clipboard) {
  //     this.fallbackCopyTextToClipboard(this.invitationUrl);
  //     return;
  //   }
  //   navigator.clipboard.writeText(this.invitationUrl).then( ()=> {
  //     this.title = 'copied to clipboard';
  //     // console.log('Async: Copying to clipboard was successful!');
  //   }).catch((err)=> {
  //     console.error('Async: Could not copy text: ', err);
  //   });
  // }
  //
  // fallbackCopyTextToClipboard(text) { // this is deprecated support is not guaranteed
  //   const textArea = document.createElement("textarea");
  //   textArea.value = text;
  //
  //   // Avoid scrolling to bottom
  //   textArea.style.top = "0";
  //   textArea.style.left = "0";
  //   textArea.style.position = "fixed";
  //
  //   document.body.appendChild(textArea);
  //   textArea.focus();
  //   textArea.select();
  //
  //   try {
  //     const successful = document.execCommand('copy');
  //     if (successful)
  //       this.title = 'copied to clipboard';
  //     // const msg = successful ? 'successful' : 'unsuccessful';
  //     // console.log('Fallback: Copying text command was ' + msg);
  //   } catch (err) {
  //     console.error('Fallback: Oops, unable to copy', err);
  //   }
  //
  //   document.body.removeChild(textArea);
  // }

}
