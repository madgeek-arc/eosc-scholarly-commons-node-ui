import {NgModule} from '@angular/core';
import {HelpContentService} from '../../services/help-content.service';
import {AsideHelpContentComponent, HelpContentComponent} from './help-content.component';
import {ReadMoreComponent, ReadMoreTextComponent} from './read-more.component';
import {provideHttpClient, withInterceptorsFromDi, withJsonpSupport, withXhr} from '@angular/common/http';

@NgModule({
    imports: [
        ReadMoreComponent,
        ReadMoreTextComponent,
        HelpContentComponent,
        AsideHelpContentComponent
    ],
    exports: [
        ReadMoreComponent,
        ReadMoreTextComponent,
        HelpContentComponent,
        AsideHelpContentComponent
    ],
    providers: [
        HelpContentService,
        provideHttpClient(withXhr(), withInterceptorsFromDi(), withJsonpSupport())
    ]
})
export class ReusableComponentsModule {
}
