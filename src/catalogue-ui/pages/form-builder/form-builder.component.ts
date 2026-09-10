import {Component, OnInit} from '@angular/core';
import {Section} from '../../domain/dynamic-form-model';

@Component({
  selector: 'app-form-builder',
  templateUrl: 'form-builder.component.html'
})

export class FormBuilderComponent implements OnInit {

  formBuilder: Section[] = [];
  show = 'chapter';

  ngOnInit() {
    // this.formBuilder.push();
  }

  updateView(show: string) {
    this.show = show;
  }

}
