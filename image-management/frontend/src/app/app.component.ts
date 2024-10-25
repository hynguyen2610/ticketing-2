import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImagesComponent } from './images/images.component';
import { MatToolbarModule } from '@angular/material/toolbar'; // Import MatToolbarModule


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ImagesComponent, MatToolbarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'image-management-frontend';
}
