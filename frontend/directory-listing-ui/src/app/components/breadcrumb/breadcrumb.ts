import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BreadcrumbItem {
  name: string;
  path: string;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [CommonModule],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class Breadcrumb {
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() currentPath: string = '/';
  @Output() pathSelected = new EventEmitter<string>();
  @Output() navigateUp = new EventEmitter<void>();

  onBreadcrumbClick(path: string): void {
    this.pathSelected.emit(path);
  }

  onNavigateUp(): void {
    this.navigateUp.emit();
  }
}
