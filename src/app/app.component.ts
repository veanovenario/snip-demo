import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SnipService, Link } from './snip.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private snip = inject(SnipService);

  inputUrl = '';
  result = signal<Link | null>(null);
  error = signal<string | null>(null);
  submitting = signal(false);
  links = signal<Link[]>([]);

  ngOnInit(): void {
    this.loadLinks();
  }

  isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  submit(): void {
    this.error.set(null);
    this.result.set(null);
    if (!this.isValidUrl(this.inputUrl)) {
      this.error.set('Please enter a valid http:// or https:// URL.');
      return;
    }
    this.submitting.set(true);
    this.snip.shorten(this.inputUrl).subscribe({
      next: (link) => {
        this.result.set(link);
        this.inputUrl = '';
        this.submitting.set(false);
        this.loadLinks();
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Network error — is the backend running?');
        this.submitting.set(false);
      }
    });
  }

  private loadLinks(): void {
    this.snip.getLinks().subscribe({
      next: (list) => this.links.set(list),
      error: () => {}
    });
  }
}
