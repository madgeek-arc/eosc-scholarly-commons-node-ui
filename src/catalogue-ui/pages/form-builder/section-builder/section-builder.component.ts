import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {GroupedFields, Section} from '../../../domain/dynamic-form-model';
import {ClassicEditor} from '../../../domain/ckeditor-classic-editor';

@Component({
  selector: 'app-section-builder',
  templateUrl: 'section-builder.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})

export class SectionBuilderComponent {

  @Input() section: Section;

  public editor = ClassicEditor;

}
