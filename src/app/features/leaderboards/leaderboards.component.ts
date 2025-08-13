import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService, LeaderboardUser } from '../../core/services/leaderboard.service';

@Component({
  selector: 'app-leaderboards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboards.component.html',
  styleUrls: ['./leaderboards.component.scss'],
})
export class LeaderboardsComponent implements OnInit {
  leaderboard: LeaderboardUser[] = [];
  topLeaders: LeaderboardUser[] = [];
  topVolunteers: LeaderboardUser[] = [];
  remainingVolunteers: LeaderboardUser[] = [];
  error: string = '';

  constructor(private leaderboardService: LeaderboardService) {}

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.leaderboardService.getLeaderboard().subscribe({
      next: (users) => {
        this.leaderboard = users;
        this.topLeaders = users.filter(user => user.type === 'قاده').slice(0, 3);
        this.topVolunteers = users.filter(user => user.type === 'متطوع').slice(0, 3);
        this.remainingVolunteers = users
          .filter(user => user.type === 'متطوع')
          .filter(user => !this.topVolunteers.includes(user));
        this.error = '';
      },
      error: (err) => {
        this.error = err.message || 'خطأ في تحميل لوحة الصدارة';
        this.leaderboard = [];
        this.topLeaders = [];
        this.topVolunteers = [];
        this.remainingVolunteers = [];
      },
    });
  }

  getImageUrl(imagePath: string | null): string {
    return this.leaderboardService.getImageUrl(imagePath);
  }

  handleImageError(user: LeaderboardUser): void {
    user.image = null;
  }
}
