import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { Router, NavigationEnd, Event } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'qatra-8eth';
  isDashboardRoute = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      this.isDashboardRoute =
        url.startsWith('/dashboard') ||
        url.startsWith('/all-join-request') ||
        url.startsWith('/all-members') ||
        url.startsWith('/upload-pdf') ||
        url.startsWith('/add-testimonials') ||
        url.startsWith('/add-leaderboards') ||
        url.startsWith('/add-gallery') ||
        url.startsWith('/low-lecture-members') ||
        url.startsWith('/tree') ||
        !!url.match(/^\/member\/[^\/]+$/) ||
        url.startsWith('/login');
      console.log('Current route:', url, 'isDashboardRoute:', this.isDashboardRoute);
    });
  }
}
