import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LowLectureMembersComponent } from './low-lecture-members.component';

describe('LowLectureMembersComponent', () => {
  let component: LowLectureMembersComponent;
  let fixture: ComponentFixture<LowLectureMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LowLectureMembersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LowLectureMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
