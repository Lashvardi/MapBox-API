import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InfoBoxComponent } from './info-box/info-box.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [AppComponent, InfoBoxComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxMapboxGLModule.withConfig({
      accessToken:
        'pk.eyJ1IjoibGFzaHZhcmRpIiwiYSI6ImNsZmd6MzgzbzFibjYzdG56Y2JvbDVscGcifQ.U3o0WZs8iM9EhWIJ1XoBzQ', // Optional, can also be set per map (accessToken input of mgl-map)
    }),
    NgbModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
