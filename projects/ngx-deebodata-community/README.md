# NgxDeebodataCommunity

Angular data grid with virtual scroll, column resizing, cell editing, tab accessibility, row selection, sorting, and filtering.  

**Live Demos** - https://deebodata.com/data-grid-community or see a demo of virtual scroll with 1.5 million rows using the 
JavaScript edition at https://deebodata.com/general-docs/row-virtualization

## Usage

**In the .ts component you want to use the data grid in**

```
import { NgxDeebodataCommunity } from 'ngx-deebodata-community';

@Component({
  selector: 'app-your-component',
  imports: [ NgxDeebodataCommunity ],
  templateUrl: './your-component.html',
  styleUrl: './your-component.css'
})
```

**In the template of the component**

```
<ngx-deebodata-community
[editable]="true"
[rowNumbers]="true"
[data]="signalArrayOfObjects()"
[color1]="'navy'"
[color2]="'lightblue'"
[primaryKey]="'employee_id'"
[defRowHgt]="'50px'"
[defGridHgt]="500"
[altRowColor]="'#ececec'"
></ngx-deebodata-community>
```

**Component Input API**

| Input | Type | Default | Description
|----------|----------|----------|----------|
| `editable` | `boolean`  | `true`   | Allows cells to be edited   |
| `rowNumbers` | `boolean`   | `true`   | Show row numbers on left hand side of grid   |
| `data` | `signal<any[]>`   | `[]`   | signal Array of objects to display   |
| `color1` | `string`   | `""`   | Theme color 1 (css, hex, rgb)   |
| `color2` | `string`   | `""`   | Theme color 2 (css, hex, rgb)   |
| `primaryKey` | `string`   | `""`   | primary key of your data set, helps performance to add it   |
| `defRowHgt` | `string`   | `50px`   | default row height (px)   |
| `defGridHgt` | `number`   | `500`   | default grid height in px   |
| `altRowColor` | `string`   | `""`   | alternate row color (css, hex, rgb)   |
-  



Pass valid CSS, rgb, or hex colors to **color1, color2, & altRowColor**  

Always pass a **px** value to defRowHgt like '50px'


**To pass Column Symbols (Numeric columns only)**

- In the .ts component you want to use the data grid in

```
import { ColumnSymbol, NgxDeebodataCommunity } from 'ngx-deebodata-community';
```

- in the exported class

```
symbols: ColumnSymbol[] = [{ column: "salary", symbol: "$" }];
```

- In the template of the component

```
<ngx-deebodata-community
[data]="signalArrayOfObjects()"
[myColumnSymbols]="symbols"
></ngx-deebodata-community>
```


**To Hook Cell Edits**

- In the .ts component you want to use the data grid in

```
import { CellEdit, NgxDeebodataCommunity } from 'ngx-deebodata-community';
```

- in the exported class

```
handleCellEdit(event: CellEdit) {//executes on cell edit if editable isn't false
    /*CellEdit interface -> { value: any; row: any; column: string; idType: string; valueChanged: boolean; }
    row will either be the 0-based index of the edited cell's parent row in the initial data set
    or, if a primaryKey is passed or detected, it will be the value of that primaryKey for the edited 
    row. Use idType (will be either "key" or "rowId") to know which one is emitting. column is 
    the column/attribute and value is the real value of the edit, which can be a string, number 
    or Date. Use valueChanged to know if an edit actually changed the value*/
    // console.log(event)
}
```

- In the template of the component

```
<ngx-deebodata-community
[data]="signalArrayOfObjects()"
(cellEdit)="handleCellEdit($event)"
></ngx-deebodata-community>
```