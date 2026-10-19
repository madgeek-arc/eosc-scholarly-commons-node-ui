import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {of, throwError} from 'rxjs';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ComparisonService} from '../../services/comparison.service';
import {EmailService} from '../../services/email.service';
import {ResourceService} from '../../services/resource.service';
import {EmailModalComponent} from './email-modal.component';

describe('EmailModalComponent', () => {
  const sendMail = vi.fn();
  const hide = vi.fn();
  let root: HTMLElement;
  let fixture: ReturnType<typeof TestBed.createComponent<EmailModalComponent>>;

  const field = (selector: string) => root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
  const type = (selector: string, value: string) => {
    field(selector).value = value;
    field(selector).dispatchEvent(new Event('input'));
  };
  const send = () => {
    [...root.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Send')!.click();
    fixture.detectChanges();
  };
  const fillIn = () => {
    type('#email', 'ada@example.org');
    type('#name', 'Ada');
    type('#subject', 'A question');
    type('#textarea', 'Hello');
  };

  beforeEach(() => {
    sendMail.mockReset().mockReturnValue(of({}));
    hide.mockReset();
    vi.stubGlobal('UIkit', {modal: vi.fn(() => ({hide}))});
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: ResourceService, useValue: {}},
        {provide: ComparisonService, useValue: {}},
      ],
    });
    TestBed.overrideComponent(EmailModalComponent, {set: {providers: [{provide: EmailService, useValue: {sendMail}}]}});
    fixture = TestBed.createComponent(EmailModalComponent);
    fixture.componentRef.setInput('serviceIdsArray', ['a', 'b']);
    fixture.detectChanges();
    root = fixture.nativeElement;
  });

  afterEach(() => vi.unstubAllGlobals());

  it('shows no error before anything is sent', () => {
    expect(root.querySelector('.uk-alert-danger')).toBeNull();
  });

  it('asks for the missing fields, outlines them, and sends nothing', () => {
    send();

    expect(root.querySelector('.uk-alert-danger')?.textContent).toContain('Please fill the red outlined fields');
    expect(field('#email').classList.contains('uk-form-danger')).toBe(true);
    expect(field('#subject').classList.contains('uk-form-danger')).toBe(true);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('does not accept an address that is not an e-mail address', () => {
    fillIn();
    type('#email', 'not an address');
    send();

    expect(sendMail).not.toHaveBeenCalled();
    expect(field('#email').classList.contains('uk-form-danger')).toBe(true);
  });

  it('sends the message for the chosen services and closes the dialog', () => {
    fillIn();
    send();

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0]).toEqual(['a', 'b']);
    expect(sendMail.mock.calls[0][1]).toMatchObject({senderEmail: 'ada@example.org', senderName: 'Ada', subject: 'A question', message: 'Hello'});
    expect(hide).toHaveBeenCalledTimes(1);
    expect(root.querySelector('.uk-alert-danger')).toBeNull();
  });

  it('shows what the server said when sending fails, and keeps the dialog open', () => {
    sendMail.mockReturnValue(throwError({error: 'mailbox full'}));
    fillIn();
    send();

    expect(root.querySelector('.uk-alert-danger')?.textContent).toContain('Something went bad, server responded: mailbox full');
    expect(hide).not.toHaveBeenCalled();
  });

  it('clears the error and the subject and message when cancelled, but keeps who is writing', () => {
    fillIn();
    sendMail.mockReturnValue(throwError({error: 'x'}));
    send();

    [...root.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Cancel')!.click();
    fixture.detectChanges();

    expect(root.querySelector('.uk-alert-danger')).toBeNull();
    expect(field('#subject').value).toBe('');
    expect(field('#textarea').value).toBe('');
    expect(field('#email').value).toBe('ada@example.org');
  });
});
