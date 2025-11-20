import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  showError(message: string): void {
    this.showNotification(message, 'error');
  }

  showInfo(message: string): void {
    this.showNotification(message, 'info');
  }

  showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  private showNotification(message: string, type: 'error' | 'info' | 'success'): void {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${this.getBootstrapClass(type)} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${this.getIcon(type)} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = '1050';
      document.body.appendChild(container);
    }

    container.appendChild(toast);

    // Initialize Bootstrap toast
    const bsToast = new (window as any).bootstrap.Toast(toast, {
      autohide: true,
      delay: type === 'error' ? 5000 : 3000
    });

    bsToast.show();

    // Remove element after hiding
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  }

  private getBootstrapClass(type: string): string {
    switch (type) {
      case 'error': return 'danger';
      case 'info': return 'info';
      case 'success': return 'success';
      default: return 'primary';
    }
  }

  private getIcon(type: string): string {
    switch (type) {
      case 'error': return 'bi-exclamation-triangle';
      case 'info': return 'bi-info-circle';
      case 'success': return 'bi-check-circle';
      default: return 'bi-info-circle';
    }
  }
}