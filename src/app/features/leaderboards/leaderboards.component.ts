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

    this.translationService.currentLanguage$.subscribe(() => {
      this.loadLeaderboard();
    });
  }

  loadLeaderboard(): void {
    this.leaderboardService.getLeaderboard().subscribe({
      next: (users) => {
        this.leaderboard = users;
        this.topLeaders = users
          .filter(user => this.isLeaderType(user.type))
          .slice(0, 3);

        this.topVolunteers = users
          .filter(user => this.isVolunteerType(user.type))
          .slice(0, 3);

        this.remainingVolunteers = users
          .filter(user => this.isVolunteerType(user.type))
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


  private isLeaderType(userType: string): boolean {
    const type = userType?.toLowerCase();

    return type === 'leader' ||
           type === 'قاده' ||
           type === 'admin' ||
           type === 'administrator';
  }

  private isVolunteerType(userType: string): boolean {
    // Convert to lowercase for case-insensitive comparison
    const type = userType?.toLowerCase();

    return type === 'volunteer' ||
           type === 'متطوع' ||
           type === 'user';
  }

  getImageUrl(imagePath: string | null): string {
    return this.leaderboardService.getImageUrl(imagePath);
  }

  handleImageError(user: LeaderboardUser): void {
    user.image = null;
  }
}
