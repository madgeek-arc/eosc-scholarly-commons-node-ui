import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {GroupedFields, Section} from '../../../domain/dynamic-form-model';

@Component({
  selector: 'app-section-builder',
  templateUrl: 'section-builder.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})

export class SectionBuilderComponent {

  @Input() section: Section;


}
