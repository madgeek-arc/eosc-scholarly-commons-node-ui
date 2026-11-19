/**
 * Created by spyroukostas on 27/6/18.
 */

import {Pipe, PipeTransform} from '@angular/core';
import {isNullOrUndefined} from '../tools';


@Pipe({
    name: 'sort'
})
export class StringArraySortPipe implements PipeTransform {
    transform(array: Array<string>): Array<string> {
        if (isNullOrUndefined(array)) {
            return undefined;
        }
        array.sort();
        return array;
    }
}
