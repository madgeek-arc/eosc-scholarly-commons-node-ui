import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ReadMoreComponent, ReadMoreTextComponent} from './read-more.component';

describe('read more', () => {
  const link = (root: HTMLElement) => root.querySelector('a');
  const box = (root: HTMLElement) => root.querySelector<HTMLElement>('div')!;

  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // jsdom has no layout, so the height of the content is set by hand.
  const contentHeight = (height: number) => vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height);

  describe('ReadMoreComponent', () => {
    const create = (maxHeight: number) => {
      const fixture = TestBed.createComponent(ReadMoreComponent);
      fixture.componentRef.setInput('maxHeight', maxHeight);
      fixture.detectChanges();
      return fixture;
    };

    it('collapses content taller than the limit once it has been measured, and offers "View more"', () => {
      contentHeight(300);
      const fixture = create(100);
      const root = fixture.nativeElement as HTMLElement;
      expect(link(root)).toBeNull();

      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      expect(box(root).classList.contains('collapsed')).toBe(true);
      expect(box(root).style.height).toBe('100px');
      expect(link(root)?.textContent).toContain('View more');
    });

    it('expands and collapses again when the link is clicked', () => {
      contentHeight(300);
      const fixture = create(100);
      const root = fixture.nativeElement as HTMLElement;
      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      link(root)!.click();
      fixture.detectChanges();
      expect(box(root).classList.contains('collapsed')).toBe(false);
      expect(box(root).style.height).toBe('auto');
      expect(link(root)?.textContent).toContain('View less');

      link(root)!.click();
      fixture.detectChanges();
      expect(box(root).classList.contains('collapsed')).toBe(true);
    });

    it('leaves short content alone and offers no link', () => {
      contentHeight(60);
      const fixture = create(100);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      expect(box(root).classList.contains('collapsed')).toBe(false);
      expect(link(root)).toBeNull();
    });
  });

  describe('ReadMoreTextComponent', () => {
    it('shows the text and collapses it the same way', () => {
      contentHeight(300);
      const fixture = TestBed.createComponent(ReadMoreTextComponent);
      fixture.componentRef.setInput('text', '<b>Long</b> text');
      fixture.detectChanges();
      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      expect(box(root).innerHTML).toBe('<b>Long</b> text');
      expect(box(root).classList.contains('collapsed')).toBe(true);
      expect(link(root)?.textContent).toContain('View more');
    });
  });
});
