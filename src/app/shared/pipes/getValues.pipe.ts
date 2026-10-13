import {Pipe, PipeTransform} from '@angular/core';

@Pipe({ name: 'values',  pure: false, standalone: false })
export class ValuesPipe implements PipeTransform {
    transform(value: any): any {
        return Object.keys(value);
    }
}
