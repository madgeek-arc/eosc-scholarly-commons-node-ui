import {
  Component,
  Input,
  OnChanges, OnInit,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import {TypeInfo} from '../../../domain/dynamic-form-model';


@Component({
  selector: 'app-type-selector',
  templateUrl: 'type-selector.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})

export class TypeSelectorComponent {

  @Input() typeInfo: TypeInfo;

  addOption() {
    this.typeInfo.values.push('Option '+ (this.typeInfo.values.length+1));
  }

  remove(position) {
    this.typeInfo.values.splice(position, 1);
  }

  trackBy(index, item) {
    return index;
  }

}
