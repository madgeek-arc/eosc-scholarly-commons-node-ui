import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {environment} from '../../../environments/environment';
import {PageContent} from '../../entities/page-content';
import {HelpContentService} from '../../services/help-content.service';
import {AsideHelpContentComponent, HelpContentComponent} from './help-content.component';

const page = (right: string[]) =>
  ({content: {top: [], bottom: [], left: [], right: right.map((content) => ({content}))}}) as unknown as PageContent;

describe('help content', () => {
  const getActivePageContent = vi.fn();
  const original = environment.showHelpContent;

  beforeEach(() => {
    getActivePageContent.mockReset().mockReturnValue(of(page(['<p>First</p>', '<p>Second</p>'])));
    environment.showHelpContent = true;
    TestBed.configureTestingModule({
      providers: [provideRouter([]), {provide: HelpContentService, useValue: {getActivePageContent}}],
    });
  });

  afterEach(() => {
    environment.showHelpContent = original;
  });

  const show = (component: typeof HelpContentComponent | typeof AsideHelpContentComponent, position: string) => {
    const fixture = TestBed.createComponent(component);
    fixture.componentRef.setInput('position', position);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('shows the contents of its position for the current route', () => {
    const root = show(HelpContentComponent, 'right');

    expect(getActivePageContent).toHaveBeenCalledWith('/');
    expect([...root.querySelectorAll('div')].map((div) => div.innerHTML)).toEqual(['<p>First</p>', '<p>Second</p>']);
  });

  it('shows nothing for a position without contents', () => {
    expect(show(HelpContentComponent, 'left').querySelector('div')).toBeNull();
  });

  it('does not ask for anything while help content is switched off', () => {
    environment.showHelpContent = false;
    const root = show(HelpContentComponent, 'right');

    expect(getActivePageContent).not.toHaveBeenCalled();
    expect(root.querySelector('div')).toBeNull();
  });

  it('shows the same contents in the side menu style', () => {
    const root = show(AsideHelpContentComponent, 'right');

    const cards = root.querySelectorAll('div.uk-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].innerHTML).toBe('<p>First</p>');
  });
});
