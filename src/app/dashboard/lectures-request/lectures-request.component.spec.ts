import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LecturesRequestComponent } from './lectures-request.component';

describe('LecturesRequestComponent', () => {
  let component: LecturesRequestComponent;
  let fixture: ComponentFixture<LecturesRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LecturesRequestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LecturesRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
