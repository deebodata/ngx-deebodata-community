import { Component, signal } from '@angular/core';
import { CellEdit, ColumnSymbol, NgxDeebodataCommunity } from 'ngx-deebodata-community';
import { TestService } from './test-service';


@Component({
  selector: 'app-root',
  imports: [ NgxDeebodataCommunity ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  symbols: ColumnSymbol[] = [{ column: "salary", symbol: "$" },{ column: "width", symbol: "px" },{ column: "height", symbol: "px" }];

  data = signal<any[]> ([]);

  constructor(private testService: TestService){}

  ngOnInit() {
    this.testService.getData().subscribe({
      next: (data: any) => {
        this.data.set(data.result)
      },
      error: e => console.log(e)
    } 
  )
  }
  
  handleCellEdit(event: CellEdit) {//use this to hook to your back end for edits

  }
}
