import {Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Editor} from '@tiptap/core';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {RichTextEditorComponent} from './rich-text-editor.component';

@Component({
  imports: [ReactiveFormsModule, RichTextEditorComponent],
  template: '<app-rich-text-editor [formControl]="control" placeholder="Write here" />'
})
class HostComponent {
  readonly control = new FormControl('<p>Hello</p>', {nonNullable: true});
}

@Component({
  imports: [FormsModule, RichTextEditorComponent],
  template: '<app-rich-text-editor [(ngModel)]="description" placeholder="Describe it" />'
})
class TemplateDrivenHostComponent {
  description = '<p>Saved</p>';
}

describe('RichTextEditorComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
  let root: HTMLElement;
  let editor: Editor;

  const button = (title: string) => root.querySelector<HTMLButtonElement>(`button[aria-label="${title}"]`)!;
  const control = () => fixture.componentInstance.control;

  beforeAll(() => {
    // jsdom does not lay anything out; ProseMirror asks for these when it moves the selection.
    const rect = {top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({})};
    Range.prototype.getBoundingClientRect = () => rect as DOMRect;
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
    Element.prototype.scrollIntoView = () => undefined;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    root = fixture.nativeElement;
    editor = (fixture.debugElement.children[0].componentInstance as unknown as {editor: Editor}).editor;
  });

  it('shows the value of the control', () => {
    expect(root.querySelector('.ProseMirror')?.textContent).toBe('Hello');
  });

  it('writes the HTML back to the control', () => {
    editor.commands.setContent('<p>Typed <strong>text</strong></p>', {emitUpdate: true});
    expect(control().value).toBe('<p>Typed <strong>text</strong></p>');
  });

  it('gives an empty string, not an empty paragraph, when the text is cleared', () => {
    editor.commands.clearContent(true);
    expect(control().value).toBe('');
  });

  it('follows the control when its value is set from outside', () => {
    control().setValue('<h2>Title</h2>');
    expect(root.querySelector('.ProseMirror h2')?.textContent).toBe('Title');
  });

  it('keeps the HTML that the old editor produced', () => {
    control().setValue(
      '<h2>Heading</h2><ul><li><p>one</p></li></ul><figure class="table"><table><tbody><tr><td>cell</td></tr></tbody></table></figure>' +
      '<figure class="image"><img src="https://example.org/a.png" alt="A"></figure>'
    );
    expect(root.querySelector('.ProseMirror h2')?.textContent).toBe('Heading');
    expect(root.querySelector('.ProseMirror li')?.textContent).toBe('one');
    expect(root.querySelector('.ProseMirror td')?.textContent).toBe('cell');
    expect(root.querySelector('.ProseMirror img')?.getAttribute('src')).toBe('https://example.org/a.png');
  });

  it('shows the placeholder on an empty text', () => {
    control().setValue('');
    expect(root.querySelector('.ProseMirror p')?.getAttribute('data-placeholder')).toBe('Write here');
  });

  it('formats the selection from the toolbar', () => {
    editor.commands.selectAll();
    button('Bold').click();
    fixture.detectChanges();
    expect(control().value).toBe('<p><strong>Hello</strong></p>');
    expect(button('Bold').getAttribute('aria-pressed')).toBe('true');
  });

  it('turns the paragraph into a heading from the style list', () => {
    const select = root.querySelector<HTMLSelectElement>('select')!;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(control().value).toBe('<h2>Hello</h2>');
    expect(select.value).toBe('2');
  });

  it('adds a link from the address field', () => {
    editor.commands.selectAll();
    button('Link').click();
    fixture.detectChanges();
    const input = root.querySelector<HTMLInputElement>('input[type="url"]')!;
    input.value = 'https://example.org';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
    fixture.detectChanges();
    expect(control().value).toMatch(/<a [^>]*href="https:\/\/example\.org"[^>]*>Hello<\/a>/);
    expect(root.querySelector('input[type="url"]')).toBeNull();
  });

  it('inserts an image with its alternative text', () => {
    button('Image').click();
    fixture.detectChanges();
    const [address, alt] = Array.from(root.querySelectorAll<HTMLInputElement>('input'));
    address.value = 'https://example.org/a.png';
    address.dispatchEvent(new Event('input'));
    alt.value = 'A picture';
    alt.dispatchEvent(new Event('input'));
    root.querySelector<HTMLButtonElement>('button.uk-button-primary')!.click();
    fixture.detectChanges();
    expect(control().value).toContain('<img src="https://example.org/a.png" alt="A picture">');
  });

  it('inserts a table and shows the table tools', () => {
    button('Table').click();
    fixture.detectChanges();
    expect(control().value).toContain('<table');
    expect(root.textContent).toContain('Delete table');
  });

  it('disables the toolbar and the text when the control is disabled', () => {
    control().disable();
    fixture.detectChanges();
    expect(button('Bold').disabled).toBe(true);
    expect(editor.isEditable).toBe(false);
    control().enable();
    fixture.detectChanges();
    expect(button('Bold').disabled).toBe(false);
    expect(editor.isEditable).toBe(true);
  });

  it('marks the control as touched when the focus leaves', () => {
    expect(control().touched).toBe(false);
    root.querySelector('app-rich-text-editor > div')!.dispatchEvent(new Event('focusout', {bubbles: true}));
    expect(control().touched).toBe(true);
  });

  it('destroys the editor with the component', () => {
    fixture.destroy();
    expect(editor.isDestroyed).toBe(true);
  });

  it('moves the focus to the address field when it opens', () => {
    button('Link').click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(root.querySelector('input[type="url"]'));
  });

  describe('with ngModel, as in the form builder', () => {
    it('shows the model and writes the HTML back to it', async () => {
      const host = TestBed.createComponent(TemplateDrivenHostComponent);
      host.detectChanges();
      await host.whenStable();
      const element: HTMLElement = host.nativeElement;
      expect(element.querySelector('.ProseMirror')?.textContent).toBe('Saved');

      const typed = (host.debugElement.children[0].componentInstance as unknown as {editor: Editor}).editor;
      typed.commands.setContent('<p>Changed</p>', {emitUpdate: true});
      expect(host.componentInstance.description).toBe('<p>Changed</p>');
    });
  });
});
