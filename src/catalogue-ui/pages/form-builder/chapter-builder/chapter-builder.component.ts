import {Component, Input} from '@angular/core';
import {Section} from '../../../domain/dynamic-form-model';
import {ClassicEditor} from '../../../domain/ckeditor-classic-editor';

@Component({
  selector: 'app-chapter-builder',
  templateUrl: 'chapter-builder.component.html',
  standalone: false
})

export class ChapterBuilderComponent {

  @Input() chapter: Section = null;

  public editor = ClassicEditor;
}
