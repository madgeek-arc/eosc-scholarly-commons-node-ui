import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {Section} from '../../../domain/dynamic-form-model';

@Component({
  selector: 'app-chapter-builder',
  templateUrl: 'chapter-builder.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})

export class ChapterBuilderComponent {

  @Input() chapter: Section = null;

}
