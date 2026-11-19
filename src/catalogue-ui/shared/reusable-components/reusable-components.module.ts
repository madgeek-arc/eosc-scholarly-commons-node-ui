import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReadMoreComponent, ReadMoreTextComponent} from './read-more.component';
import {provideHttpClient, withInterceptorsFromDi, withJsonpSupport, withXhr} from '@angular/common/http';

@NgModule({
    imports: [CommonModule],
    declarations: [
        ReadMoreComponent,
        ReadMoreTextComponent,
    ],
    exports: [
        ReadMoreComponent,
        ReadMoreTextComponent,
    ],
    providers: [provideHttpClient(withXhr(), withInterceptorsFromDi(), withJsonpSupport())]
})
export class ReusableComponentsModule {
}
