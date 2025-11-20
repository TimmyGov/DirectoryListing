import { Component } from '@angular/core';
import { DirectoryBrowser } from './components/directory-browser/directory-browser';

@Component({
  selector: 'app-root',
  imports: [DirectoryBrowser],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'Directory Listing Application';
}
