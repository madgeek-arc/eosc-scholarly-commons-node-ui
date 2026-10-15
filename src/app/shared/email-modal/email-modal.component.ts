import { Component, Input, inject } from '@angular/core';
import {UntypedFormBuilder, Validators} from '@angular/forms';
import {NavigationService} from '../../services/navigation.service';
import {ActivatedRoute} from '@angular/router';
import {ResourceService} from '../../services/resource.service';
import {AuthenticationService} from '../../services/authentication.service';
import {ComparisonService} from '../../services/comparison.service';
import {EmailService} from '../../services/email.service';

declare let UIkit: any;

@Component({
  selector: 'app-email-modal',
  templateUrl: './email-modal.component.html',
  providers: [EmailService],
  standalone: false
})
export class EmailModalComponent {
  fb = inject(UntypedFormBuilder);
  router = inject(NavigationService);
  route = inject(ActivatedRoute);
  resourceService = inject(ResourceService);
  authenticationService = inject(AuthenticationService);
  comparisonService = inject(ComparisonService);
  navigationService = inject(NavigationService);
  emailService = inject(EmailService);


  @Input() serviceIdsArray;
  public emailErrorMessage = '';

  emailForm = this.fb.group({
    recipientEmail: '',
    senderEmail: ['', Validators.compose([Validators.required, Validators.email])],
    senderName: ['', Validators.required],
    subject: ['', Validators.required],
    message: ['', Validators.required],
  });

  resetForm() {
    this.emailForm.get('subject').reset('');
    this.emailForm.get('message').reset('');
    this.emailErrorMessage = '';
  }

  sendMail() {
    this.emailErrorMessage = '';
    if (this.emailForm.valid) {
      this.emailService.sendMail(this.serviceIdsArray, this.emailForm.value).subscribe(
        () => UIkit.modal('#email-modal').hide(),
        err =>  this.emailErrorMessage = 'Something went bad, server responded: ' + err.error
      );
    } else {
      this.emailErrorMessage = 'Please fill the red outlined fields';
      for (const i in this.emailForm.controls) {
        this.emailForm.controls[i].markAsDirty();
      }
      this.emailForm.updateValueAndValidity();
    }
  }
}
