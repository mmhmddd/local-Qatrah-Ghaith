import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLeaderboardsComponent } from './add-leaderboards.component';

describe('AddLeaderboardsComponent', () => {
  let component: AddLeaderboardsComponent;
  let fixture: ComponentFixture<AddLeaderboardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLeaderboardsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddLeaderboardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
