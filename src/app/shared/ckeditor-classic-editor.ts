import {
  ClassicEditor as ClassicEditorBase,
  Essentials,
  Autoformat,
  Bold,
  Italic,
  BlockQuote,
  Heading,
  Image,
  ImageCaption,
  ImageInsertViaUrl,
  ImageStyle,
  ImageToolbar,
  Indent,
  IndentBlock,
  Link,
  List,
  MediaEmbed,
  Paragraph,
  PasteFromOffice,
  Table,
  TableToolbar,
  TextTransformation
} from 'ckeditor5';

/**
 * Replaces the old @ckeditor/ckeditor5-build-classic "predefined build" (removed at Angular 16,
 * since every ckeditor5-angular release compatible with Ivy also requires the new modular
 * ckeditor5 package). Plugin list and toolbar replicate that build's defaults; imageUpload was
 * dropped for insertImageViaUrl since no upload adapter was ever configured at any call site.
 */
export class ClassicEditor extends ClassicEditorBase {
  public static override builtinPlugins = [
    Essentials, Autoformat, Bold, Italic, BlockQuote, Heading, Image, ImageCaption,
    ImageInsertViaUrl, ImageStyle, ImageToolbar, Indent, IndentBlock, Link, List,
    MediaEmbed, Paragraph, PasteFromOffice, Table, TableToolbar, TextTransformation
  ];

  public static override defaultConfig = {
    licenseKey: 'GPL',
    toolbar: {
      items: [
        'heading', '|',
        'bold', 'italic', 'link',
        'bulletedList', 'numberedList', '|',
        'outdent', 'indent', '|',
        'insertImage', 'blockQuote', 'insertTable',
        'mediaEmbed', 'undo', 'redo'
      ]
    },
    image: {
      toolbar: ['imageStyle:full', 'imageStyle:side', '|', 'imageTextAlternative']
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
    }
  };
}
