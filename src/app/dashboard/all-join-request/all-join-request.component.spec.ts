import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllJoinRequestComponent } from './all-join-request.component';

describe('AllJoinRequestComponent', () => {
  let component: AllJoinRequestComponent;
  let fixture: ComponentFixture<AllJoinRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllJoinRequestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllJoinRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
