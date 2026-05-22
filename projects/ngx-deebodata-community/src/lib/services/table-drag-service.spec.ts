import { TestBed } from '@angular/core/testing';

import { TableDragService } from './table-drag-service';

describe('TableDragService', () => {
  let service: TableDragService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableDragService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
