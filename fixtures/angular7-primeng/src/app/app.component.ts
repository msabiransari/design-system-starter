import { Component } from '@angular/core';

interface Transaction {
  id: string;
  account: string;
  status: string;
  amount: string;
}

interface ThemeOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  selectedTheme = 'auto';
  selectedSegment = { label: 'Enterprise', value: 'enterprise' };

  themes: ThemeOption[] = [
    { label: 'Auto', value: 'auto' },
    { label: 'Professional', value: 'professional' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Healthcare', value: 'healthcare' },
    { label: 'SaaS', value: 'saas' },
    { label: 'Minimal', value: 'minimal' },
    { label: 'Forest', value: 'forest' },
    { label: 'Ocean', value: 'ocean' }
  ];

  segments = [
    { label: 'Enterprise', value: 'enterprise' },
    { label: 'Healthcare', value: 'healthcare' },
    { label: 'Operations', value: 'operations' }
  ];

  transactions: Transaction[] = [
    { id: 'INV-1042', account: 'Northstar Clinic', status: 'Paid', amount: '$12,400' },
    { id: 'INV-1043', account: 'Harbor Logistics', status: 'Pending', amount: '$8,150' },
    { id: 'INV-1044', account: 'Crescent Foods', status: 'Review', amount: '$4,920' }
  ];

  setTheme(theme: string): void {
    this.selectedTheme = theme;
    const link = document.getElementById('theme-link') as HTMLLinkElement | null;

    if (link) {
      link.href = `assets/acme/themes/${theme}.css`;
    }

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }
  }
}
