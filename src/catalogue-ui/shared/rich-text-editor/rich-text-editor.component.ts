import {ChangeDetectionStrategy, Component, effect, ElementRef, forwardRef, input, OnDestroy, signal, viewChild, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {Editor} from '@tiptap/core';
import {Image} from '@tiptap/extension-image';
import {TableKit} from '@tiptap/extension-table';
import {Youtube} from '@tiptap/extension-youtube';
import {Placeholder} from '@tiptap/extensions';
import {StarterKit} from '@tiptap/starter-kit';
import {TiptapEditorDirective} from 'ngx-tiptap';

type UrlMode = 'link' | 'image' | 'video';
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface ToolbarButton {
  title: string;
  icon: string;
  run: () => void;
  active?: () => boolean;
  enabled?: () => boolean;
}

interface TableTool {
  label: string;
  run: () => void;
}

/**
 * Rich text editor for the form fields and the form builder. It stores HTML, like the CKEditor it replaces,
 * and works with ngModel, formControl and formControlName.
 */
@Component({
  selector: 'app-rich-text-editor',
  imports: [ReactiveFormsModule, TiptapEditorDirective],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichTextEditorComponent), multi: true}]
})
export class RichTextEditorComponent implements ControlValueAccessor, OnDestroy {
  readonly placeholder = input('');

  private readonly urlInput = viewChild<ElementRef<HTMLInputElement>>('urlInput');

  protected readonly headingLevels: HeadingLevel[] = [1, 2, 3, 4, 5, 6];
  protected readonly urlMode = signal<UrlMode | null>(null);
  protected readonly urlValue = signal('');
  protected readonly altValue = signal('');
  protected readonly disabled = signal(false);

  /** The editor holds its own state, so the toolbar re-reads it after every transaction. */
  private readonly version = signal(0);

  /** The value as the Tiptap directive sees it; the outer control gets the same HTML, with an empty document as ''. */
  protected readonly inner = new FormControl('', {nonNullable: true});

  protected readonly editor = new Editor({
    extensions: [
      // No trailing node: it would add an empty paragraph to the saved HTML after a heading, list, table or image.
      StarterKit.configure({link: {openOnClick: false, defaultProtocol: 'https'}, trailingNode: false}),
      Placeholder.configure({placeholder: () => this.placeholder()}),
      Image,
      TableKit.configure({table: {HTMLAttributes: {class: 'uk-table uk-table-divider uk-table-small'}}}),
      Youtube.configure({nocookie: true})
    ],
    editorProps: {
      attributes: {
        class: 'uk-textarea',
        // UIkit override attempted: uk-textarea and uk-height-small; the first has no minimum height, the second is a
        // fixed height that would scroll instead of growing with the text.
        style: 'min-height: 150px'
      }
    }
  });

  protected readonly toolbar: ToolbarButton[][] = [
    [
      {title: 'Bold', icon: 'format_bold', run: () => this.chain().toggleBold().run(), active: () => this.isActive('bold')},
      {title: 'Italic', icon: 'format_italic', run: () => this.chain().toggleItalic().run(), active: () => this.isActive('italic')},
      {title: 'Link', icon: 'link', run: () => this.openUrl('link'), active: () => this.isActive('link')}
    ],
    [
      {title: 'Bulleted list', icon: 'format_list_bulleted', run: () => this.chain().toggleBulletList().run(), active: () => this.isActive('bulletList')},
      {title: 'Numbered list', icon: 'format_list_numbered', run: () => this.chain().toggleOrderedList().run(), active: () => this.isActive('orderedList')},
      {title: 'Outdent', icon: 'format_indent_decrease', run: () => this.chain().liftListItem('listItem').run(), enabled: () => this.can(() => this.editor.can().liftListItem('listItem'))},
      {title: 'Indent', icon: 'format_indent_increase', run: () => this.chain().sinkListItem('listItem').run(), enabled: () => this.can(() => this.editor.can().sinkListItem('listItem'))},
      {title: 'Block quote', icon: 'format_quote', run: () => this.chain().toggleBlockquote().run(), active: () => this.isActive('blockquote')}
    ],
    [
      {title: 'Image', icon: 'image', run: () => this.openUrl('image')},
      {title: 'Table', icon: 'table_chart', run: () => this.chain().insertTable({rows: 3, cols: 3, withHeaderRow: true}).run(), active: () => this.isActive('table')},
      {title: 'YouTube video', icon: 'videocam', run: () => this.openUrl('video')}
    ],
    [
      {title: 'Undo', icon: 'undo', run: () => this.chain().undo().run(), enabled: () => this.can(() => this.editor.can().undo())},
      {title: 'Redo', icon: 'redo', run: () => this.chain().redo().run(), enabled: () => this.can(() => this.editor.can().redo())}
    ]
  ];

  protected readonly tableTools: TableTool[] = [
    {label: 'Row above', run: () => this.chain().addRowBefore().run()},
    {label: 'Row below', run: () => this.chain().addRowAfter().run()},
    {label: 'Delete row', run: () => this.chain().deleteRow().run()},
    {label: 'Column left', run: () => this.chain().addColumnBefore().run()},
    {label: 'Column right', run: () => this.chain().addColumnAfter().run()},
    {label: 'Delete column', run: () => this.chain().deleteColumn().run()},
    {label: 'Merge or split cells', run: () => this.chain().mergeOrSplit().run()},
    {label: 'Delete table', run: () => this.chain().deleteTable().run()}
  ];

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.editor.on('transaction', () => this.version.update(version => version + 1));
    effect(() => this.urlInput()?.nativeElement.focus());
    this.inner.valueChanges.pipe(takeUntilDestroyed()).subscribe(html => this.onChange(this.editor.isEmpty ? '' : html));
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  writeValue(value: string | null): void {
    this.inner.setValue(value ?? '', {emitEvent: false});
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) {
      this.inner.disable({emitEvent: false});
    } else {
      this.inner.enable({emitEvent: false});
    }
  }

  protected markTouched(): void {
    this.onTouched();
  }

  protected headingLevel(): string {
    this.version();
    const level = this.headingLevels.find(candidate => this.editor.isActive('heading', {level: candidate}));
    return String(level ?? 0);
  }

  protected setHeading(event: Event): void {
    const level = Number((event.target as HTMLSelectElement).value);
    if (level === 0) {
      this.chain().setParagraph().run();
    } else {
      this.chain().setHeading({level: level as HeadingLevel}).run();
    }
  }

  protected isActive(name: string): boolean {
    this.version();
    return this.editor.isActive(name);
  }

  protected isEnabled(button: ToolbarButton): boolean {
    return !this.disabled() && (button.enabled?.() ?? true);
  }

  protected openUrl(mode: UrlMode): void {
    this.urlValue.set(mode === 'link' ? (this.editor.getAttributes('link')['href'] ?? '') : '');
    this.altValue.set('');
    this.urlMode.set(mode);
  }

  protected closeUrl(): void {
    this.urlMode.set(null);
    this.editor.commands.focus();
  }

  protected applyUrl(): void {
    const url = this.urlValue().trim();
    const mode = this.urlMode();
    const chain = this.chain();
    if (mode === 'link') {
      if (url) {
        chain.extendMarkRange('link').setLink({href: url}).run();
      } else {
        chain.extendMarkRange('link').unsetLink().run();
      }
    } else if (mode === 'image' && url) {
      chain.setImage({src: url, alt: this.altValue().trim() || undefined}).run();
    } else if (mode === 'video' && url) {
      chain.setYoutubeVideo({src: url}).run();
    }
    this.urlMode.set(null);
  }

  protected valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected urlLabel(mode: UrlMode): string {
    return {link: 'Link address', image: 'Image address', video: 'YouTube address'}[mode];
  }

  private chain() {
    return this.editor.chain().focus();
  }

  private can(check: () => boolean): boolean {
    this.version();
    return check();
  }
}
