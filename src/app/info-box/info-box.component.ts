import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-info-box',
  templateUrl: './info-box.component.html',
  styleUrls: ['./info-box.component.scss'],
})
export class InfoBoxComponent {
  @Input() imageSrc: string | null = null;
  @Input() header: string | null = null;
  @Input() distance: string | null = null;

}
