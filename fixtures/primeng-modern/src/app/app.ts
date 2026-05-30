import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

interface Transaction {
  name: string;
  date: string;
  status: string;
  amount: string;
  statusSeverity: 'success' | 'warning';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, InputTextModule, TableModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'PrimeNG Modern Fixture';
  subtitle = 'Real Angular 17 + PrimeNG 17 with ACME design tokens';

  themes = ['professional', 'light', 'dark', 'healthcare', 'saas', 'minimal', 'forest', 'ocean'];
  currentTheme = 'professional';

  constructor() {
    // Ensure theme-link exists for runtime switching
    if (!document.getElementById('theme-link')) {
      const link = document.createElement('link');
      link.id = 'theme-link';
      link.rel = 'stylesheet';
      link.href = 'themes/professional.css';
      document.head.appendChild(link);
    }
  }

  transactions: Transaction[] = [
    { name: 'Meridian Holdings', date: 'Oct 24', status: 'Completed', amount: '+$450,000', statusSeverity: 'success' },
    { name: 'Apex Construction', date: 'Oct 23', status: 'Pending', amount: '-$82,500', statusSeverity: 'warning' },
    { name: 'Nova Biotech', date: 'Oct 21', status: 'Completed', amount: '+$125,000', statusSeverity: 'success' },
    { name: 'Summit Logistics', date: 'Oct 20', status: 'Pending', amount: '+$38,200', statusSeverity: 'warning' },
  ];

  setTheme(theme: string) {
    this.currentTheme = theme;
    const link = document.getElementById('theme-link') as HTMLLinkElement;
    if (link) {
      const base = link.href.replace(/themes\/.*\.css/, 'themes/');
      link.href = base + theme + '.css';
    }
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
}
