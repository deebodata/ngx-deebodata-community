import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxDeebodataCommunity } from './ngx-deebodata-community';

describe('NgxDeebodataCommunity', () => {
  let component: NgxDeebodataCommunity;
  let fixture: ComponentFixture<NgxDeebodataCommunity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxDeebodataCommunity]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxDeebodataCommunity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
