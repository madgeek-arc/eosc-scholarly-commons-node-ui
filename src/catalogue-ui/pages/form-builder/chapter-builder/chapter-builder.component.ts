import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {Section} from '../../../domain/dynamic-form-model';
import {ClassicEditor} from '../../../domain/ckeditor-classic-editor';

@Component({
  selector: 'app-chapter-builder',
  templateUrl: 'chapter-builder.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})

export class ChapterBuilderComponent {

  @Input() chapter: Section = null;

  public editor = ClassicEditor;
}
