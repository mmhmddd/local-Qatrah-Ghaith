import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService, LeaderboardUser } from '../../core/services/leaderboard.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-leaderboards',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './leaderboards.component.html',
  styleUrls: ['./leaderboards.component.scss'],
})
export class LeaderboardsComponent implements OnInit {
  leaderboard: LeaderboardUser[] = [];
  topLeaders: LeaderboardUser[] = [];
  topVolunteers: LeaderboardUser[] = [];
  remainingVolunteers: LeaderboardUser[] = [];
  error: string = '';

  constructor(
    private leaderboardService: LeaderboardService,
    public translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.leaderboardService.getLeaderboard().subscribe({
      next: (users) => {
        this.leaderboard = users;
        this.topLeaders = users.filter(user => user.type === this.translationService.translate('leaderboards.leaderType')).slice(0, 3);
        this.topVolunteers = users.filter(user => user.type === this.translationService.translate('leaderboards.volunteerType')).slice(0, 3);
        this.remainingVolunteers = users
          .filter(user => user.type === this.translationService.translate('leaderboards.volunteerType'))
          .filter(user => !this.topVolunteers.includes(user));
        this.error = '';
      },
      error: (err) => {
        this.error = this.translationService.translate('leaderboards.errorLoadingLeaderboard');
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
