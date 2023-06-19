import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoolItemComponent } from './pool-item.component';

describe('PoolItemComponent', () => {
  let component: PoolItemComponent;
  let fixture: ComponentFixture<PoolItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PoolItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoolItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
