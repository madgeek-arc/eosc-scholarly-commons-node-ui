import {Meta, Title} from '@angular/platform-browser';
import {TestBed} from '@angular/core/testing';
import {beforeEach, describe, expect, it} from 'vitest';
import {DEFAULT_DESCRIPTION, PageMetaService, SITE_NAME} from './page-meta.service';

describe('PageMetaService', () => {
  let service: PageMetaService;
  let title: Title;
  let meta: Meta;

  const content = (selector: string) => meta.getTag(selector)?.content;

  beforeEach(() => {
    // The document is shared by all tests in this file, so start from an empty head.
    document.head.querySelectorAll('meta').forEach((tag) => tag.remove());
    service = TestBed.inject(PageMetaService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);
  });

  describe('title', () => {
    it('puts the page name before the site name', () => {
      service.set('Discover services');
      expect(title.getTitle()).toBe(`Discover services | ${SITE_NAME}`);
      expect(content('property="og:title"')).toBe(`Discover services | ${SITE_NAME}`);
    });

    it('uses the bare site name when the page has no title', () => {
      service.set(undefined);
      expect(title.getTitle()).toBe(SITE_NAME);
      expect(content('property="og:title"')).toBe(SITE_NAME);
    });
  });

  describe('description', () => {
    it('falls back to the site description when none is given, or only blanks', () => {
      service.set('Page');
      expect(content('name="description"')).toBe(DEFAULT_DESCRIPTION);
      expect(content('property="og:description"')).toBe(DEFAULT_DESCRIPTION);

      service.set('Page', {description: '  \n\t '});
      expect(content('name="description"')).toBe(DEFAULT_DESCRIPTION);
    });

    it('sets the description and the Open Graph description to the same text', () => {
      service.set('Page', {description: 'A short description.'});
      expect(content('name="description"')).toBe('A short description.');
      expect(content('property="og:description"')).toBe('A short description.');
    });

    it('collapses runs of whitespace', () => {
      service.set('Page', {description: '  Line one\n\n  line   two\t. '});
      expect(content('name="description"')).toBe('Line one line two .');
    });

    it('leaves a description of exactly 160 characters alone', () => {
      const text = 'x'.repeat(160);
      service.set('Page', {description: text});
      expect(content('name="description"')).toBe(text);
    });

    it('cuts a longer description at a word boundary and ends it with an ellipsis', () => {
      const words = Array.from({length: 60}, (_, i) => `word${i}`).join(' ');
      service.set('Page', {description: words});

      const result = content('name="description"') ?? '';
      expect(result.length).toBeLessThanOrEqual(160);
      expect(result.endsWith('…')).toBe(true);

      const kept = result.slice(0, -1);
      expect(words.startsWith(kept)).toBe(true);
      expect(words.charAt(kept.length)).toBe(' ');
      expect(kept.endsWith(' ')).toBe(false);
    });

    it('cuts a single very long word at the limit', () => {
      service.set('Page', {description: 'a'.repeat(300)});
      expect(content('name="description"')).toBe(`${'a'.repeat(159)}…`);
    });
  });

  describe('robots', () => {
    it('adds noindex when asked to, and removes it on the next page', () => {
      service.set('Hidden', {noindex: true});
      expect(content('name="robots"')).toBe('noindex');

      service.set('Visible');
      expect(meta.getTag('name="robots"')).toBeNull();
    });

    it('adds no robots tag by default', () => {
      service.set('Page');
      expect(meta.getTag('name="robots"')).toBeNull();
    });
  });

  it('replaces the tags on every call instead of adding more', () => {
    service.set('One', {description: 'first', noindex: true});
    service.set('Two', {description: 'second', noindex: true});

    expect(meta.getTags('name="description"')).toHaveLength(1);
    expect(meta.getTags('property="og:title"')).toHaveLength(1);
    expect(meta.getTags('name="robots"')).toHaveLength(1);
    expect(content('name="description"')).toBe('second');
  });
});
