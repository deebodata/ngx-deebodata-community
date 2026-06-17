import { Component, ElementRef, EventEmitter, HostListener, input, Input, Output, signal, SimpleChanges, ViewChild } from '@angular/core';
import { ColumnHeader } from '../../../interfaces/column-header';
import { CommonService } from '../../../services/common-service';
import { TableDragService } from '../../../services/table-drag-service';
import { DataTableService } from '../../../services/data-table-service';
import { DataRow } from '../../../interfaces/data-row';
import { DataTableHeader } from '../data-table-header/data-table-header';
import { DataTablePaginator } from '../data-table-paginator/data-table-paginator';
import { DataCellComponent } from '../data-cell/data-cell';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CellEdit } from '../../../interfaces/cell-edit';
import { DataCell } from '../../../interfaces/data-cell';
import { RowNumber } from '../../../interfaces/row-number';
import { ColumnSymbol } from '../../../interfaces/column-symbol';
import { timer } from 'rxjs';

@Component({
  selector: 'ngx-deebodata-community',
  imports: [
    DataTableHeader,
    DataCellComponent,
    DataTablePaginator,
    CommonModule,
    FormsModule,
    DecimalPipe,
  ],
  templateUrl: './ngx-deebodata-community-component.html',
  styleUrls: ['./ngx-deebodata-community-component.css', '../../../styles.css']
})
export class NgxDeebodataCommunity {

    @HostListener('window:click', ['$event'])
    onWindowClick(e: MouseEvent) {
        if(this.validatedEditType && (!document.activeElement || (document.activeElement && !document.activeElement.className)))
            this.clearValidatedEdit(e)
    }

    @HostListener('window:mouseup', ['$event'])
    onWindowMouseUp(e: MouseEvent) {
        if(this.tblDragService.listenForMouseUp){
            this.tblDragService.handleColResMouseUp(e)
            this.dataTableBody?.nativeElement.scrollBy(1, 0)
        }
        if(this.tblDragService.listenForColMvMouseUp)
          this.tblDragService.handleColMoveMouseUp(e)
        if(this.listenToCellDraggerMouseMove){
            this.listenToCellDraggerMouseMove = false
            this.clearDragEditFlag()
            try{this.fCellDragger.nativeElement.blur()}catch(e){}
        }
        if(this.listenToCellDraggerMouseUp)
            this.handleDraggerMU(e)
        this.handleScrlBarDrag() 
    }

    @HostListener('window:mousedown', ['$event'])
    onWindowMouseDown(e: MouseEvent) {
        this.mouseIsDown = true
    }

    @HostListener('window:mousemove', ['$event'])
    onWindowMouseMove(e: MouseEvent) {
        if(this.listenToCellDraggerMouseMove)
            this.handleCellDraggerEdit(e)
    }

    @HostListener('window:selectstart', ['$event'])
    onWindowSelectStart(e: Event) {
        if(this.listenToCellDraggerMouseMove)
            e.preventDefault()
        if(this.tblDragService.listenForSelectStart)
            this.tblDragService.stopWindowSelection(e)
    }

    @HostListener('window:resize', ['$event'])
    onWindowResize(e: Event) {
        this.dataTableService.setTblBounds()
        this.clearValidatedEdit()
    }

    @HostListener('window:scroll', ['$event'])
    onWindowScroll(e: Event) {
        this.dataTableService.setTblBounds()
        this.clearValidatedEdit()
    }

    constructor(public dataTableService: DataTableService, 
                private tblDragService: TableDragService,
                public common: CommonService,) {
  
      }

      rows: DataRow[] = [];
      aboveHgt = signal<number>(0);
      belowHgt = signal<number>(0);
      rnBTop = signal<number>(0);
      dtChecks: number[] = [];
      rowNos: RowNumber[] = [];
      verticalRest = 0
      horizRest = 0
      isScrolling = false;
      useRowWid: string = ""
      dtr: string = "dataTableRow";
      rowElsPad = 1;
      doRowsMod: number = 10;
      paginatorReady = false;
      handlingSelRows = false
      columnOfInterest: string = ""
      desRowHeight: string = "50"
      listenToCellDraggerMouseMove = false
      listenToCellDraggerMouseUp = false
      topLevelFilter: string = ""
      allFilSortInfo: string = ""
      lockVScroll: boolean = false;
      filterBuildUp: any[] = []
      togSelRows: string = "Selected Rows"
      maxCols: number = 0;
      lastElRowIndex: number = 0;
      scrollDir: string = "down";
      transY =signal<number>(0);
      mouseIsDown: boolean = false;
      finishScrollTO: any = null;
      valEditFocusTo: any = null;
      columnHeaders: ColumnHeader[] = []
      columnNames: string[] = []
      linkCell: any;
      linkCells: any[] = []
      validatedEditType: string = ""
      dataHasBeenSet = signal<boolean>(false);
      data = input<any[]>([])
      @Input() color1: string = ""
      @Input() color2: string = ""
      @Input() primaryKey: string = ""
      @Input() defRowHgt: string = "50px"
      @Input() defGridHgt: number = 500
      @Input() altRowColor: string = "";
      @Input() myColumnSymbols: ColumnSymbol[] = []
      @Input() editable: boolean = true;
      @Input() rowNumbers: boolean = true
      @Output("cellEdit") cellEdit: EventEmitter<CellEdit> = new EventEmitter()
      @ViewChild("dataTable", { static: true }) dataTable!: ElementRef<HTMLElement>;
      @ViewChild("dataTableBody", { static: true }) dataTableBody!: ElementRef<HTMLElement>;
      @ViewChild("aboveArea", { static: true }) aboveArea!: ElementRef<HTMLElement>;
      @ViewChild("belowArea", { static: true }) belowArea!: ElementRef<HTMLElement>;
      @ViewChild("validatedEdit", { static: true }) validatedEdit!: ElementRef<HTMLElement>;
      @ViewChild("rowNumHeader", { static: true }) rowNumHeader!: ElementRef<HTMLElement>;
      @ViewChild("fCellDragger", { static: true }) fCellDragger!: ElementRef<HTMLElement>;
      @ViewChild("selFilContainer", { static: true }) selFilContainer!: ElementRef<HTMLElement>;
      @ViewChild("btnTogSelRows", { static: true }) btnTogSelRows!: ElementRef<HTMLButtonElement>;
      @ViewChild("dataTableHeaders", { static: true }) dataTableHeaders!: ElementRef<HTMLElement>;
      @ViewChild("topLevelDataFilter", { static: true }) topLevelDataFilter!: ElementRef<HTMLInputElement>;

      ngOnChanges(changes: SimpleChanges) {
        if(typeof changes !== "undefined" && changes["data"] && !this.dataHasBeenSet() && this.data() && this.data().length)
          this.handleDataInput()
      }

      ngOnInit() {
        if(this.defRowHgt){
            this.dataTableService.defltRHgt = this.defRowHgt
            this.dataTableService.defltRHgtNum = parseInt(this.defRowHgt.replace(/[ ]?(px|vh|\%)/g, ""));
        }
        if(this.defGridHgt)
            this.dataTableService.dTblHeight.set(this.defGridHgt)
        if(this.myColumnSymbols)
            this.dataTableService.columnSymbols = [...this.myColumnSymbols]
        if(!this.dataHasBeenSet() && this.data().length)
            this.handleDataInput()
      }
      
      handleDataInput() {
        let tdata = this.convertNeededCols([...this.data()])
        this.dataTableService.mainData = tdata.filter( (d: any) => true )
        this.dataTableService.currFilData = tdata.filter( (d: any) => true )
        this.dataTableService.mainDataLen = this.dataTableService.mainData.length
        this.buildInitUiDataTable(tdata, this.color1, this.color2)//hex or rgb values work best
        if(!this.dataTableService.errorLoading)
            this.dataTableService.noDataMsg = "No data to display for this configuration.";
        this.tblDragService.dTblHeightOutput.subscribe( h => this.setTableHeight(h, true) )
        this.tblDragService.columnMove.subscribe( c => this.processColMove(c) )
        // setTimeout( () => this.setTableHeight(510), 1000)//for demo
        this.dataHasBeenSet.set(true)
      }

        getAllColsAtRuntime(excludeHidden: any) {
            let cols = (typeof this.dataTableService.mainData[0] === "object" ? Object.keys(this.dataTableService.mainData[0]) : 
            (Object.keys(this.dataTableService.dataFilSrtTracker)));
            if(!excludeHidden)
                return cols;
            return cols.filter( (c: any) => { 
                return !this.dataTableService.dataFilSrtTracker[c].minimize
            });
        }

        setMaxCols() {
            const el = this.dataTable.nativeElement
            if(el){
                const elWid = el.getBoundingClientRect().width;
                return elWid >= 1024 ? 5 : (elWid > 760 ? 3 : 2)
            }
            const wid = window.innerWidth
            return wid >= 1024 ? 5 : (wid > 760 ? 3 : 2)
        }

        getAllColWidth(colLen: any) {
            try{
                if(!colLen || colLen === 0)
                    return 0
                const colWid = parseInt(this.dataTableService.useColWid.replace(/[ ]?px/g, ""))
                let i = 0
                let wid = 0
                for(const prop in this.dataTableService.dataFilSrtTracker){
                    if(this.dataTableService.dataFilSrtTracker[prop].minimize)
                        continue
                    i += 1
                    const ownColWid = this.dataTableService.dataFilSrtTracker[prop].colWidth
                    wid += (ownColWid ? parseInt(ownColWid.replace(/[ ]?px/g, "")) : colWid)
                }
                if(i === colLen)
                    return Math.floor(wid)
                return Math.floor(colWid*colLen)
            }catch(e){ 
                try{
                    return Math.floor(parseInt(this.dataTableService.useColWid.replace(/[ ]?px/g, ""))*colLen)
                }catch(e){
                    return window.innerWidth
                }
            }
        }

        removeAllFreezeCols() {
            const len = this.columnHeaders.length
            const rlen = this.rows.length
            for(var i = (len-1); i >= 0; i--)
                try{this.columnHeaders[i].freeze = false}catch(e){}
            for(var o = (rlen-1); o >= 0; o--){
                try{
                    const row =this.rows[o]
                    const clen = row.cells?.length
                    if(clen && clen > 0){
                        for(var n = (clen-1); n >= 0; n--){
                            const cell = row.cells?.[n]
                            if(cell)
                                cell.freeze = false
                        }
                    }
                }catch(e){}
            }
        }

        setTableHeight(h: number, manual?: boolean) {
            this.dataTableService.dTblHeight.set(h)
            setTimeout( () => { 
                this.dataTableService.setTblBounds()
                this.dataTableBody?.nativeElement.scrollBy(0, (this.scrollDir === "down" ? 1 : -1))
                setTimeout(() => { this.setRowSelChecksPlacement() })
                if(manual){
                    this.dataTableService.listenForScroll.set(false)
                    if(this.tblDragService.handleTblHtTO)
                        clearTimeout(this.tblDragService.handleTblHtTO)
                    this.tblDragService.handleTblHtTO = setTimeout( () => {this.handleRowsOnHeightIncrease()}, 250) 
                }
            })
        }

        handleRowsOnHeightIncrease() {
            const len = this.rows.length
            const defNum = this.dataTableService.defltRHgtNum
            const nRows = Math.ceil(Math.abs(this.tblDragService.tblHgtDiff)/defNum);
            const cols = [...this.columnNames]
            const colLen = cols.length
            const vlen = this.dataTableService.visibleCols.length
            const lastVisInd = cols.indexOf(this.dataTableService.visibleCols[(vlen-1)]) + 1;
            if(this.tblDragService.tblHgtDiff > 0){//add rows
                let i = this.lastElRowIndex+1;
                let agoto = i+nRows;
                const xtras = agoto - this.dataTableService.currFilData.length;
                let bhToSub = 0
                let ahToSub = 0
                const applyRow = (o: number, setLast?: boolean) => {
                    const item = this.dataTableService.currFilData[o];
                    if(item){
                        const index = this.dataTableService.currMapping[o] || this.dataTableService.findObjIndxInData(item)
                        if(!this.rows.find(r => r.id === (this.dtr + index))){
                            const row: DataRow = { id: this.dtr + index, index: index, width: this.useRowWid, cells: [], height: this.dataTableService.defltRHgt }
                            let k = 0
                            for(k; k < colLen; k++){
                                const col = cols[k]
                                if(col)
                                    addCell(item[col], col, row, (k <= lastVisInd))
                            } 
                            if(setLast){
                                this.rows.push(row)
                                if(bhToSub < this.belowHgt())
                                    bhToSub += defNum
                                else
                                    ahToSub += defNum
                                this.setLastRowIndex()
                            } else {
                                this.rows.unshift(row)
                                ahToSub += defNum;
                            }
                            if(!this.dtChecks.includes(index))
                                this.dtChecks.push(index)
                        }
                    }
                }
                const addCell = (text: any, prop: string | null, row: DataRow | null, visible: boolean) => {
                    if(prop && row){
                        const useProp = this.dataTableService.dataFilSrtTracker[prop]
                        const notNum = (this.dataTableService.figureFilterType(prop) != "number" || /(year|yr|fy)/g.test(prop.toLocaleLowerCase())) ? true : false
                        const useTxt = this.dataTableService.figureCellText(text, notNum, this.dataTableService.dataFilSrtTracker[prop]["colCellSymbol"])
                        row.cells?.push({
                        column: prop,
                        freeze: useProp.freeze,
                        minimized: useProp.minimize,
                        rawText: text,
                        visible: visible,
                        width: useProp.colWidth || this.dataTableService.useColWid,
                        editable: useTxt.prop === "textContent" ? this.editable : false,
                        dataType: this.dataTableService.figureFilterType(prop),
                        text: (useTxt.prop === "textContent" ? useTxt.value : ""),
                        html: (useTxt.prop !== "textContent" ? useTxt.value : ""),
                        })
                    }
                }
                for(i; i < agoto; i++)
                    applyRow(i, true)
                if(xtras > 0){
                    const elsLen = document.getElementsByClassName("data-table-row").length
                    let x = (this.lastElRowIndex-elsLen)-1;
                    let xgoto = x-xtras;
                    for(x; x >= xgoto; x--)
                        applyRow(x)
                }
                if(bhToSub)
                    this.belowHgt.set((this.belowHgt() - bhToSub));
                if(ahToSub)
                    this.aboveHgt.set((this.aboveHgt() - ahToSub));
            } else {
                let bhToAdd = 0
                const goto = Math.max(0, (len-nRows))
                for(var o = (len-1); o >= goto; o--){
                    let el = this.rows[o]
                    if(el){
                        this.rows = this.rows.filter( r => r.index !== el.index)
                        this.dtChecks = this.dtChecks.filter( c => c !== el.index)
                        bhToAdd += defNum
                    }
                }
                if(bhToAdd)
                    this.belowHgt.set((this.belowHgt() + bhToAdd));
            }
            setTimeout( () => { 
                this.dataTableService.listenForScroll.set(true) 
                this.setRowNumbers(); 
                this.tblDragService.tblHgtDiff = 0; 
            })
        }

        processColMove(event: any) {
            let lfts = event.ls
            let nwColLft = event.nl
            let wantlfts = event.wl
            let xDrop = event.x
            const wLf = wantlfts.indexOf(xDrop)
            if(wLf != lfts.indexOf(nwColLft)){
                const inAft = wLf - 1
                this.columnHeaders = this.columnHeaders.filter( c => this.common.elifyCol(c.column) !== this.dataTableService.currColumnEdit)
                const rwCol = this.common.replaceUniSep(this.dataTableService.currColumnEdit)
                const trkr = this.dataTableService.dataFilSrtTracker[rwCol]
                const addCol: ColumnHeader = { column: rwCol, width: (trkr["colWidth"] || this.dataTableService.useColWid), 
                    hideMinCol: false, freeze: false, minimized: trkr["minimize"], dataType: this.dataTableService.figureFilterType(rwCol) }
                if(inAft === -1){//they want it first
                    this.columnHeaders.unshift(addCol)
                } else {
                    if(inAft >= (wantlfts.length - 2)){//last
                        this.columnHeaders.push(addCol)
                    } else {
                        if(this.columnHeaders[inAft])
                            this.columnHeaders.splice((inAft+1), 0, addCol)
                    }
                }
                timer(100).subscribe( () => {
                    let i = 0
                    const els = document.getElementsByClassName("col-header")
                    const len = els.length
                    this.columnHeaders = []
                    for(i; i < len; i++){
                        const col = this.common.replaceUniSep(els[i].id.replace(/^columnHeader/, ""))
                        if(!this.columnHeaders.map( c => c.column).includes(col)){
                            const trkr = this.dataTableService.dataFilSrtTracker[col]
                            const addCol: ColumnHeader = { column: col, width: (trkr["colWidth"] || this.dataTableService.useColWid), 
                            hideMinCol: false, freeze: false, minimized: trkr["minimize"], dataType: this.dataTableService.figureFilterType(col) }
                            this.columnHeaders.push(addCol)
                        }
                    }
                    this.columnNames = this.columnHeaders.map( c => c.column)
                    const dtB = this.dataTableBody.nativeElement
                    if(dtB){
                        const willSclTo = dtB.scrollLeft
                        this.renderCurrData(false)
                        timer(0).subscribe( () => { dtB.scrollLeft = willSclTo })
                    }
                    this.setHoldingCheckCls()
                })
            }
            this.clearValidatedEdit(null, true)
        }

        setColHeaderHgt() {//set hgt = to tallest
            let z = 0; let i = 0; let x = 0
            let hgts = []
            const cols =  document.getElementsByClassName("col-header")
            const cLen = this.columnHeaders?.length
            for(x; x < cLen; x++){
                const col = this.columnHeaders[x]
                col.height = undefined
                col.lineHeight = undefined
            }
            for(z; z < cLen; z++){
                if(cols[z])
                    hgts.push(cols[z].getBoundingClientRect().height)
            }
            const maxHgt = hgts.sort( (a: number,b: number) => a > b ? -1 : 1 )[0]
            const useHgt = Math.ceil(maxHgt)
            for(i; i < cLen; i++){
                const col = this.columnHeaders[i]
                if(col && !col.minimized){
                    col.height = useHgt + "px"
                    const elCol = cols[i]
                    if(elCol && elCol.firstElementChild && elCol.firstElementChild.getBoundingClientRect().height < 40)
                        col.lineHeight = Math.floor(((useHgt/2)-21)) + "px"
                }
            }
            if(this.dataTableHeaders)
                this.dataTableHeaders.nativeElement.style.height = useHgt + "px"
            if(this.rowNumHeader)
                this.rowNumHeader.nativeElement.style.height = useHgt + "px"
            setTimeout( () => { this.setRowSelChecksPlacement() })
        }

      renameColSpecChars(data: any[]) {
          if(data && data.some( d => d && typeof d === "object" )){
              let specCharCols = []
              if(data[0] && typeof data[0] === "object"){
                  for(const prop in data[0]){
                      if(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g.test(prop))
                          specCharCols.push(prop) 
                  }
                  let c = 0
                  let i = 0
                  const dlen = data.length
                  const len = specCharCols.length
                  for(c; c < len; c++){
                      const prop = specCharCols[c]
                      const okNwNam = this.common.stripSpecChars(prop)
                      for(i; i < dlen; i++){
                          if(data[i] && typeof data[i] === "object"){
                            const desc = Object.getOwnPropertyDescriptor(data[i], prop)
                            if(desc){
                                try{
                                    Object.defineProperty(data[i], okNwNam, desc);
                                    delete data[i][prop]
                                }catch(e){}
                            }
                          }
                      }
                      i = 0;
                  }
                  return data?.filter( d => true );
              }
              return data?.filter( d => true );
          }
          return data?.filter( d => true );
      }

      scoopOutObjsInObjs(data: any[]) {//scoop out one layer of nested objs
          let i = 0;
          let ndata = []
          const len = data?.length
          if(data && data.some( (d: any) => { return d && typeof d === "object" })){
              for(i; i < len; i++){
                  try{
                      const dta = data[i]
                      if(dta && typeof dta === "object"){
                          let nobj: any = {}
                          for(const prop in dta){
                              const val = dta[prop]
                              if(val && typeof val === "object" && typeof val.getTime === "undefined" && typeof val.filter === "undefined" && Object.keys(val).length){
                                  for(const iprp in val)
                                      nobj[iprp] = val[iprp]
                              } else {
                                  nobj[prop] = val
                              }
                          }
                          ndata.push(nobj)
                      }
                  } catch(e){}
              }
          } else {
              ndata = data?.filter( (d: any) => { return true })
          }
          return ndata;
      }

      convertNeededCols(data: any) {
          data = this.scoopOutObjsInObjs(data)
          data = this.renameColSpecChars(data)
          let nData = data?.filter( (d: any) => true )
          const symReg = new RegExp(/[$€£₹¥¢%\,\"\']/, "g")
          const isDtReg = new RegExp(/\d+(\/|-)\d+(\/|-)\d+/)
          let i = 0;
          const len = data?.length
          let allCols: any[] = []
          if(data && data.some( (d: any) => d && typeof d === "object" )){
              allCols = this.getDataColumns(data)//gets all possible props in array
              this.dataTableService.dataFilSrtTracker = this.dataTableService.buildDataFilSrtTracker(allCols)
              for(i; i < len; i++){
                  try{
                      if(data[i] && typeof data[i] === "object"){
                          for(const prop in data[i]){
                              if(!allCols.includes(prop)){
                                  delete data[i][prop]
                                  continue
                              }
                              const val = data[i][prop]
                              if(val && typeof val === "string"){
                                  const tval = val.trim()
                                  const low = tval.toLocaleLowerCase()
                                  if(this.common.testLongDate(low))
                                      nData[i][prop] = this.common.coerceDate(low)
                                  if(!this.common.testLongDate(low) && (this.common.testShortDate(tval) || this.common.testISODate(tval)))
                                      nData[i][prop] = this.common.coerceDate(tval)
                                  if(this.common.testISODate(tval.replace(/ /g, "")))
                                      nData[i][prop] = this.common.coerceDate(tval.replace(/ /g, ""))
                                  if(low === "null" || low === "undefined")
                                      nData[i][prop] = null
                                  if(!this.common.idCol(prop) && !isDtReg.test(tval) && !/[A-Za-z]/g.test(val) && /^[0-9,]+[\.]{0,1}?[0-9,]*$/g.test(tval.replace(symReg, "")) && !isNaN(parseInt(tval.replace(symReg, ""))))//not viewed as num, but can be
                                      nData[i][prop] = /\./g.test(val) ? parseFloat(tval.replace(symReg, "")) : parseInt(tval.replace(symReg, ""))
                              }
                              if(val && typeof val === "object" && typeof val.getTime === "undefined")/**not dates */
                                  try{ nData[i][prop] = JSON.stringify(val).replace(/[\[\]{}\"]/g, "").replace(/:/g, ": ").replace(/,/g, ", ").replace(/  /g, " ")}catch(e){}
                          }
                          const keys = Object.keys(data[i])
                          const diff = allCols.filter( (c) => keys.indexOf(c) < 0 )
                          const dLen = diff.length
                          if(dLen){//obj doesn't have all props
                              let n = 0
                              for(n; n < dLen; n++)
                                  nData[i][diff[n]] = "";
                          }
                      }
                  }catch(e) {  }
              }
          }
          //read data that's already not a string
          if(allCols && allCols.length){//array of objs
              let a = 0
              const alen = allCols.length
              for(a; a < alen; a++){
                  const col = allCols[a]
                  const colData = nData?.map( (d: any) => d[col] )
                  if(colData && colData.every( (d: any) => !d ))
                      continue
                  if(!this.common.idCol(col) && colData && colData.every( (d: any) => !d || typeof d === "number" )){
                      try{ this.dataTableService.dataFilSrtTracker[col]["type"] = "number" } catch(e){}
                  }
                  if(colData && colData.every( (d: any) => { return !d || this.common.isADateObject(d) })){
                      try{ this.dataTableService.dataFilSrtTracker[col]["type"] = "date" } catch(e){}
                  }
                  if(colData && colData.every( (d: any) => !d || typeof d === "boolean" )){
                      nData = nData.map( (d: any) => {
                          d[col] = d[col]?.toString() || "false";
                          return d
                      })
                  }
              }
          }
          return nData
      }

      setRowSelChecksPlacement() {
        let i = 0
        const radd = 12
        const els = document.getElementsByClassName("select-row-check")
        const len = els.length
        const dtBody = this.dataTableBody.nativeElement
        const tbds = dtBody.getBoundingClientRect()
        const initT = this.initCheckTop()
        const col1Frozen = document.getElementsByClassName("col-item-freeze").length
        for(i; i < len; i++){
            const chk = <HTMLInputElement>els[i]
            const row = document.getElementById(chk.value)
            if(row){
                const tTop = tbds.top
                const rbds = row.getBoundingClientRect()
                const hh = (rbds.height/2)
                const top = Math.floor(initT + ((rbds.bottom - (hh+radd)) - tTop))
                chk.style.top = Math.floor(top) + "px"
                if((rbds.top+(hh-radd)) < tTop || ((rbds.bottom - (hh-radd)) >= (tTop + tbds.height)) || (dtBody.scrollLeft > 35 && !col1Frozen)){
                    chk.classList.add("hide")
                    continue
                }
                chk.className = "select-row-check"
            } else {
                chk.classList.add("hide")
            }
        }
        this.setRowNumbers()
    }

    cleanRowChecks() {
        const len = this.dtChecks.length
        for(let i = (len-1); i >= 0; i--){
            const chk = this.dtChecks[i]
            if(this.dtChecks.filter( d => d === chk).length > 1){
                const cind = this.dtChecks.lastIndexOf(chk)
                this.dtChecks = this.dtChecks.filter( (d, ind) => ind !== cind) 
            }
            const accRow = this.rows.find( r => r.index === chk)
            if(!accRow)
                this.dtChecks = this.dtChecks.filter( d => d !== chk )
        }
    }

    setRowNumbers() {
        const rlen = this.rows.length
        if(this.rowNumbers && rlen){
            const hasHgt: RowNumber[] = this.rowNos.filter( r => r.height)
            this.rowNos = []
            let n = (this.lastElRowIndex + 1) - rlen
            for(n; n <= this.lastElRowIndex; n++){
                let rn: any = {number: n + 1}
                if(hasHgt.length){
                    const hh = hasHgt.find( h => h.number === n+1)
                    if(hh)
                        rn.height = hh.height
                }
                this.rowNos.push(rn)
            }
            const listen = this.dataTableService.listenForScroll();
            const r1 = document.getElementsByClassName("data-table-row")[0]
            if(r1 && listen){
                const ty = (this.transY()*(this.scrollDir === "down" ? -1 : 1));
                const useCalc = -(this.dataTableService.tblTop - r1.getBoundingClientRect().top) - ty;
                this.rnBTop.set(Math.min(useCalc, 0))
            } else {
                if(listen)
                    this.rnBTop.set(0)
            }
        }
    }

    initCheckTop() {
        const headHt = this.dataTableHeaders.nativeElement.getBoundingClientRect().height
        return headHt + 17;//dt table marg top is 17
    }

    toggleSelectedRows(forceUnsel?: any) {
        this.handlingSelRows = true
        setTimeout( () => {//let the button disable
            this.dataTableService.displayOnlySelRows = !this.dataTableService.displayOnlySelRows
            if(forceUnsel)
                this.dataTableService.displayOnlySelRows = false
            const icn = this.btnTogSelRows.nativeElement.firstElementChild;
            if(this.dataTableService.displayOnlySelRows){
                this.dataTableService.currFilData = this.dataTableService.mainData.
                filter( (d: any, ind: number) => this.dataTableService.currSelRows.indexOf(ind) > -1 )
                if(icn){
                    icn.textContent = "check_box"
                    icn.classList.add("sel-rows-checked")
                }
            } else {
                this.dataTableService.currFilData = this.dataTableService.mainData.filter( (d: any) => true )
                if(icn){
                    icn.classList.remove("sel-rows-checked")
                    icn.textContent = "check_box_outline_blank"
                }
            }
            if(this.dataTableService.arefilSrtTrkPropsDefault(true)){
                this.renderCurrData(false)
            } else {
                const col = this.columnHeaders[0].column//just fil by 1st col
                const fil = this.dataTableService.dataFilSrtTracker[col].filter
                if(col)
                    this.execFilter(col, (fil || ""))
            }
            setTimeout( () => this.handlingSelRows = false)
        })
    }

    toggleSingleRowSelected(useInd: number) {
        if(this.tblDragService.didResizeOnEvent)
            return false
        try{
            if(this.dataTableService.currSelRows.indexOf(useInd) > -1){//it's already selected
                this.dataTableService.currSelRows = this.dataTableService.currSelRows.filter( (r) => r !== useInd )
                if(this.dataTableService.displayOnlySelRows){
                    const btnTog = this.btnTogSelRows.nativeElement
                    btnTog.click()
                    btnTog.click()
                    if(!this.dataTableService.currSelRows.length)
                        btnTog.click()
                }
            } else {
                if(this.dataTableService.currSelRows.indexOf(useInd) < 0)
                    this.dataTableService.currSelRows.push(useInd)
            }
        }catch(e){}
        return this.setBtnTogRows(this.dataTableService.currSelRows.length)
    } 

    setBtnTogRows(amt?: number) {
        if(amt){
            this.togSelRows = amt.toLocaleString(undefined, {maximumFractionDigits:0}) + " Selected Row" + (amt == 1 ? "" : "s")
        } else {
            this.togSelRows = "Selected Rows"
        }
    }

    clearSelectedRows() {
        this.handlingSelRows = true
        this.dataTableService.currSelRows = []
        const fullClear = this.dataTableService.displayOnlySelRows ? true : false;
        this.dataTableService.displayOnlySelRows = false;
        this.setBtnTogRows()
        if(fullClear)
            return this.toggleSelectedRows(true)
        setTimeout( () => this.handlingSelRows = false)
    }

      getDataColumns(data: any[]) {
          let i = 0
          let cols = Object.keys(data[0])
          const len = data.length
          for(i; i < len; i++){
              const obj = data[i]
              const keys = Object.keys(obj)
              const notInCols = keys.filter( (k: any) => cols.indexOf(k) < 0)
              if(typeof obj === "object" && notInCols.length){
                  let n = 0
                  const dLen = notInCols.length
                  for(n; n < dLen; n++)
                      cols.push(notInCols[n])
              }
          }
          let f =0
          let fincols: any = []
          const strpdcols = cols.map( (c: any) => this.common.stripSpecChars(c) )
          const slen = strpdcols.length
          for(f; f < slen; f++){
            const scol = strpdcols[f]
            if(!fincols.includes(scol))
                fincols.push(scol)  
          }
          return fincols
      }

        setLastRowIndex() {
            const realMax = this.dataTableService.currFilData.length - 1
            const wannabeMax = (this.rows.length - 1) + Math.floor(this.aboveHgt()/this.dataTableService.defltRHgtNum)
            this.lastElRowIndex = Math.min(wannabeMax, realMax)
            return this.lastElRowIndex;
        }

      buildInitUiDataTable(data: any[], color1?: any, color2?: any) {
          try{
              const cols = Object.keys(data[0])
              let i = 0; let n = 0; 
              const len = data.length;
              const colLen = cols.length
              this.maxCols = this.setMaxCols()
              const defNum = this.dataTableService.defltRHgtNum
              const init = Math.ceil(this.dataTableService.dTblHeight()/defNum)+this.rowElsPad;
              this.dataTableService.useColWid = Math.ceil((this.dataTableBody.nativeElement.getBoundingClientRect().width-16)/Math.min(colLen, this.maxCols)) + "px"
              for(i; i < colLen; i++){
                  this.columnHeaders.push({ column: cols[i], width: this.dataTableService.useColWid, hideMinCol: false, freeze: false, minimized: false, dataType: this.dataTableService.figureFilterType(cols[i]) })
                  if(i < this.maxCols)
                    this.dataTableService.visibleCols.push(cols[i])
              }
              this.setHoldingCheckCls()
              this.columnNames = this.columnHeaders.map( c => c.column)
              const initVisCols = cols.filter( (c, ind) => ind <= (this.maxCols+1) )
              const addCell = (text: any, prop: string | null, row: DataRow | null, indx: number) => {
                if(prop && row){
                    const notNum = (this.dataTableService.figureFilterType(prop) != "number" || /(year|yr|fy)/g.test(prop.toLocaleLowerCase())) ? true : false
                    const useTxt = this.dataTableService.figureCellText(text, notNum, this.dataTableService.dataFilSrtTracker[prop]["colCellSymbol"])
                    row.cells?.push({
                      column: prop,
                      freeze: false,
                      minimized: false,
                      rawText: text,
                      visible: initVisCols.includes(prop),
                      width: this.dataTableService.useColWid,
                      editable: useTxt.prop === "textContent" ? this.editable : false,
                      dataType: this.dataTableService.figureFilterType(prop),
                      text: (useTxt.prop === "textContent" ? useTxt.value : ""),
                      html: (useTxt.prop !== "textContent" ? useTxt.value : ""),
                    })
                    this.dataTableService.dataFilSrtTracker[prop].colWidth = this.dataTableService.useColWid
                }

                  if(row && prop && row.cells && row.cells.length === 1)
                      this.dtChecks.push(indx)
              }
              this.useRowWid = this.getAllColWidth(colLen) + "px"
              const limit = Math.min(init, len)
              let localRows: DataRow[] = [];
              for(n; n < limit; n++){
                const row: DataRow = { id: "dataTableRow" + n, index: n, width: this.useRowWid, cells: [], height: this.dataTableService.defltRHgt }
                let k = 0
                for(k; k < colLen; k++)
                    addCell(data[n][cols[k]], cols[k], row, n)
                localRows.push(row)
                this.dataTableService.currMapping[n] = n
              }
              this.rows = [...localRows];
              this.setLastRowIndex()
              this.paginatorReady = true;
              this.handleTheme(color1, color2)
              if(len >= 500000)
                this.doRowsMod = 15
              timer(0).subscribe( () => { 
                this.setColHeaderHgt()
                this.setRowSelChecksPlacement()
                this.dataTableService.setTblBounds()
              })
              timer(250).subscribe( () => { 
                this.dataTableService.setIdealColumnWidth.next(true)
                if(len > init){
                    let total = 0
                    let z = this.lastElRowIndex + 1
                    for(z; z < len; z++){
                        total += 1
                        this.dataTableService.currMapping[z] = z
                    }
                    this.belowHgt.set(total*defNum)
                }
                
                this.setColsOnVisScreen()
            })
            this.getPrimaryKey(cols)
          } catch(e) {}                
      }

      getPrimaryKey(cols: string[]): string {
        let i = 0
        const len = cols.length
        if(this.primaryKey){//means they set 1 manually
            const colData = this.dataTableService.mainData.map( (d) => d[this.primaryKey] )
            if(colData.length && !colData.some( (c) => !c )){
                const map = new Set(colData)
                if(map.size === this.dataTableService.mainDataLen){
                    this.dataTableService.primaryKey = this.primaryKey;
                    return this.dataTableService.primaryKey;//they set a good one
                }
            }
        }
        for(i; i < len; i++){
            const col = cols[i]
            if(this.common.idCol(col)){
                const colData = this.dataTableService.mainData.map( d => d[col])
                if(colData && !colData.some( c => !c)){//no null vals
                    const map = new Set(colData)
                    if(map.size === this.dataTableService.mainDataLen){//all unique vals
                        this.dataTableService.primaryKey = col
                        return this.dataTableService.primaryKey
                    }
                }
            }
        }
        return ""
      }

    execFilter(field: any, val: any) {
        this.dataTableService.isFiltering = true
        this.dataTableService.dataFilSrtTracker[field].filter = val || ""
        this.dataTableService.columnFilter(this.dataTableService.mainData, field, this.dataTableService.dataFilSrtTracker, this.dataTableService.sortOrder, true)
        this.renderCurrData(false, field)
        setTimeout( () => { this.dataTableService.isFiltering = false }, 500)
    }

    topFilterOnKeyUp(event: any) {
      if(event && !this.common.keyCanSearch(event))
        return;
      if(!this.dataTableService.isFiltering){
          this.dataTableService.isFiltering = true
          this.dataTableService.easyFilter((this.topLevelFilter || ""), this.dataTableService.mainData, this.dataTableService.sortOrder)
          if(!this.topLevelFilter && !this.dataTableService.arefilSrtTrkPropsDefault()){
              let altField = Object.keys(this.dataTableService.mainData[0])[0]
              this.dataTableService.columnFilter(this.dataTableService.mainData, altField, this.dataTableService.dataFilSrtTracker, this.dataTableService.sortOrder, false)
          }
          this.renderCurrData(false, "topLevelDataFilter")
          setTimeout( () => { 
              this.dataTableService.isFiltering = false
              const buildUpLen = this.filterBuildUp.length
              if(buildUpLen){
                  this.topFilterOnKeyUp(null)
                  this.filterBuildUp = []
              } 
          }, 500)
      } else {
          if(this.filterBuildUp.indexOf(this.topLevelFilter) < 0)
            this.filterBuildUp.push(this.topLevelFilter)
      }
    }

      setHorizPos(event: any) {
        const head = this.dataTableHeaders.nativeElement
        if(event > 0)
            head.style.marginLeft = -event + "px"
        else
            head.style.removeProperty("margin-left")
        this.horizRest = event
      }

      blurContEd() {
        const actEl = <HTMLElement>document.activeElement
        if(actEl && actEl.getAttribute("contenteditable"))
            actEl.blur()
      }

      setColsOnVisScreen() {
        const lftPlus = this.rowNumbers ? 75 : 0//ctrl+f "--row-num-width" in css
        let i = 0
        let vCols = []
        const useCols = this.columnHeaders.filter( c => !c.minimized).map( c => c.column)
        const len = useCols.length
        for(i; i < len; i++){
            const col = useCols[i]
            const el = document.getElementById("columnHeader" + this.common.elifyCol(col))
            if(el){
                const elbds = el.getBoundingClientRect()
                if(elbds.left >= (this.dataTableService.tblLeft-lftPlus) && elbds.right < this.dataTableService.tblRight)
                    vCols.push(col)
            }
        }
        this.dataTableService.visibleCols = [...vCols]
      }

      handleScrlBarDrag() {
        this.mouseIsDown = false;
        if(!this.finishScrollTO && this.dataTableService.currEditIndex === -1){
            timer(0).subscribe(() => {this.completeScroll(); this.dataTableService.listenForScroll.set(true);})
        } else {
            this.dataTableService.listenForScroll.set(true);
        }
      }

      setAllRowsDefHgt() {
          let i = 0
          const len = this.rows.length
          for(i; i < len; i++)
              this.setSingleRowHgt(this.dataTableService.defltRHgtNum, this.rows[i].id, true) 
      }

      completeScroll() {
         this.isScrolling = false
         this.finishScrollTO = null
         const dtb = this.dataTableBody?.nativeElement
         if(dtb){
            const lfs = this.dataTableService.listenForScroll()
            this.execVertScrollUp(this.columnNames, this.columnNames.length, dtb.scrollTop, true)
            this.execHorizScroll(dtb.scrollLeft)
            this.handleScrollEnd()
            if(lfs && this.rows.some( r => r.height !== this.dataTableService.defltRHgt))
                this.setAllRowsDefHgt()
            if(!lfs)
                timer(0).subscribe(() => {this.dataTableService.listenForScroll.set(true) });
         }
      }

      handleScroll(event: any) {
          const top = event.target.scrollTop
          const left = event.target.scrollLeft
          /*horiz scroll*/
          if(left !== this.horizRest)
            this.execHorizScroll(left)
          /*horiz scroll*/
          /*vert scroll*/
          if(top === this.verticalRest || this.lockVScroll || !this.dataTableService.listenForScroll()){
              if(!this.dataTableService.autoScrollOnEdit)
                this.clearValidatedEdit();
              return this.setRowSelChecksPlacement()
          }
          this.isScrolling = true
          this.execVertScroll(top)
          /*vert scroll*/
          if(top%2===0)
            this.clearValidatedEdit()
          if(this.finishScrollTO)
              this.finishScrollTO.unsubscribe()
          this.finishScrollTO = timer(150).subscribe( () => { this.completeScroll() })  
        }

        execHorizScroll(left: number) {
            const head = this.dataTableHeaders.nativeElement
            if(left > 0)
                head.style.marginLeft = -left + "px"
            else
                head.style.removeProperty("margin-left")
            this.setColsOnVisScreen()
            this.execHorizBodyScroll()
            this.horizRest = left
            this.setColsOnVisScreen()
        }

        fixRowContainer(transY: number) {
            this.transY.set(transY);
        }

        execVertScroll(top: number) {
            if(top >= this.verticalRest){
                this.scrollDir = "down"
                this.execVertScrollDown(this.columnNames, this.columnNames.length, top)
            } else {//scrolling back up
                this.scrollDir = "up"
                this.execVertScrollUp(this.columnNames, this.columnNames.length, top)
            }
            this.verticalRest = top;
        }

    handleScrollEnd(): any {
        if(!this.dataTableService.listenForScroll())
            return;
        this.fixRowContainer(0)
        this.isScrolling = false
        this.lockVScroll = false
        timer(0).subscribe( () => { 
            this.dataTableService.autoScrollOnEdit = false
            this.setColsOnVisScreen()
            this.cleanRowChecks()
            this.setRowSelChecksPlacement()
            if(this.listenToCellDraggerMouseMove)
                this.settleCellDragger()
            timer(0).subscribe( () => { this.cleanUpPossibles(); })
        })
    }

    addCell(text: any, prop: string, visible: boolean): DataCell {
        const useProp = this.dataTableService.dataFilSrtTracker[prop]
        const notNum = (this.dataTableService.figureFilterType(prop) != "number" || /(year|yr|fy)/g.test(prop.toLocaleLowerCase())) ? true : false
        const useTxt = this.dataTableService.figureCellText(text, notNum, useProp["colCellSymbol"])
        return {
            column: prop,
            rawText: text,
            editable: useTxt.prop !== "textContent" ? false : this.editable,
            dataType: this.dataTableService.figureFilterType(prop),
            freeze: useProp.freeze,
            visible: visible,
            minimized: useProp.minimize,
            width: useProp.colWidth || this.dataTableService.useColWid,
            text: useTxt.prop === "textContent" ? useTxt.value : "",
            html: useTxt.prop !== "textContent" ? useTxt.value : "",
        }
    }

    setCellsOnVertScroll(text: string, prop: string, row: DataRow, vis: boolean) {
        const useProp = this.dataTableService.dataFilSrtTracker[prop]
        const notNum = (this.dataTableService.figureFilterType(prop) != "number" || /(year|yr|fy)/g.test(prop.toLocaleLowerCase())) ? true : false
        const useTxt = this.dataTableService.figureCellText(text, notNum, useProp["colCellSymbol"])
        row.cells = row.cells?.map( c => {
            if(c.column === prop){
                c.visible = vis;
                c.rawText = text
                c.text = useTxt.prop === "textContent" ? useTxt.value : "";
                c.html = useTxt.prop !== "textContent" ? useTxt.value : "";
                return c
            }
            return c
        })
    }

    execHorizBodyScroll() {
        const allcols = this.getAllColsAtRuntime(null);
        let i = 0;
        const clen = allcols.length
        const rlen = this.rows.length
        const lftPlus = this.rowNumbers ? 75 : 0//ctrl+f "--row-num-width" in css
        let positions: any = []
        const row0 = this.rows[0]
        for(let p = (clen-1); p >= 0; p--){
            const col = allcols[p]
            const elcol = this.common.elifyCol(col)
            const head = document.getElementById("columnHeader" + elcol)
            if(head){
                const bds = head.getBoundingClientRect()
                if(bds.left > this.dataTableService.tblRight)
                    continue
                const cell = row0?.cells?.find( c => c.column === col)
                if(cell){
                    if(!cell.visible && (this.dataTableService.visibleCols.includes(col) || (bds.left >= (this.dataTableService.tblLeft-lftPlus) && bds.right < (this.dataTableService.tblRight+lftPlus))))//visible
                        positions.push({ col: col, vis: true })
                    if(cell.visible && !this.dataTableService.visibleCols.includes(col) && !positions.find( (p: any) => p.col === col))
                        positions.push({ col: col, vis: false })
                }
            }
        }
        const plen = positions.length
        for(i; i < rlen; i++){
            let c = 0
            const row = this.rows[i]
            if(row){
                for(c; c < plen; c++){
                    const pos = positions[c]
                    if(pos){
                        if(pos.vis){
                            row.cells = row.cells?.map( c => {
                                if(c.column === pos.col)
                                    return this.addCell(c.rawText, pos.col, true)
                                return c
                            })
                        } else {
                            const rCell: DataCell | undefined = row.cells?.find( c => c.column === pos.col)
                            if(rCell){
                                rCell.visible = false
                            }
                        }
                    }
                }
            }
        }
                timer(50).subscribe( () => { 
                    this.dataTableService.setIdealColumnWidth.next(true); 
                    this.setColsOnVisScreen() 
                    timer(0).subscribe( () => { this.cleanUpPossibles() })
                })
    }

    cleanUpPossibles() {
        let i = 0
        const len = this.rows.length
        const lftPlus = this.rowNumbers ? 75 : 0//ctrl+f "--row-num-width" in css
        for(i; i < len; i++){
            const row = this.rows[i]
            if(row){
                let p = 0
                if(row.cells?.length){
                    const rclen = row.cells.length
                    for(p; p < rclen; p++){
                        const cell = row.cells[p]
                        if(cell){
                            const ccol = cell.column
                            const el = document.querySelector("#" + row.id + " .data-cell-" + this.common.elifyCol(ccol))
                            if((el && el.getBoundingClientRect().right < (this.dataTableService.tblLeft-lftPlus)) && (!el?.innerHTML || !el.getAttribute("style"))){
                                row.cells[p].visible = true
                                row.cells[p] = {...this.addCell(cell.rawText, ccol, true)}
                            }
                        }
                    }
                }
            }
        }
    }

    applyToDomRows(rows: any[], cols: string[], colLen: number, lastVisInd: number, dir: string, defNum: number, newRows: number) {
        const len = this.rows.length
        let nrowsAcctFor = 0
        let chks: number[] = []
        if(dir === "down"){
            let i = 0;
            let ahToAdd: number = 0;
            let bhToSub: number = 0;
            for(i; i < len; i++){
                const row = this.rows[i]//move the top x num of dom rows to the bottom
                const vrow = rows[i]//{index: index, data: item}
                if(vrow && vrow.index !== row.index){
                    const index = vrow.index
                    const doIt = index > -1;
                    if(doIt){
                        for(let k = (colLen-1); k >= 0; k--){
                            const col = cols[k]
                            if(col)
                                this.setCellsOnVertScroll(vrow.data[col], col, row, (k <= lastVisInd))//prepend
                        }
                    }
                    if(nrowsAcctFor < newRows){
                        ahToAdd += defNum
                        bhToSub += defNum
                    }
                    if(doIt){
                        row.id = this.dtr + index
                        row.index = index
                        if(!this.dtChecks.includes(index))
                            chks.push(index)
                    }
                    nrowsAcctFor++;
                }
            }
            if(chks.length)
                this.dtChecks = [...this.dtChecks, ...chks]
            if(ahToAdd)
                this.aboveHgt.set((this.aboveHgt() + ahToAdd))
            if(bhToSub)
                this.belowHgt.set((this.belowHgt() - bhToSub))
        } else {
            let v = 0
            const ulen = (len-1)
            let ahToSub: number = 0;
            let bhToAdd: number = 0;
            for(var o = ulen; o >= 0; o--){
                const row = this.rows[o]
                const vrow = rows[v]//{index: index, data: item}
                if(vrow && vrow.index !== row.index){
                    const index = vrow.index
                    const doIt = index > -1;
                    if(doIt){
                        for(let k = (colLen-1); k >= 0; k--){
                            const col = cols[k]
                            if(col)
                                this.setCellsOnVertScroll(vrow.data[col], col, row, (k <= lastVisInd))//prepend
                        }
                    }
                    if(nrowsAcctFor < newRows){
                        ahToSub += defNum;
                        bhToAdd += defNum
                    }
                    if(doIt){
                        row.id = this.dtr + index
                        row.index = index
                        if(!this.dtChecks.includes(index))
                            chks.push(index)
                    }
                    nrowsAcctFor++;
                }
                v++
            }
            if(chks.length)
                this.dtChecks = [...this.dtChecks, ...chks]
            if(ahToSub)
                this.aboveHgt.set((this.aboveHgt() - ahToSub))
            if(bhToAdd)
                this.belowHgt.set((this.belowHgt() + bhToAdd))
        }
        this.finishApplyingDomRows(newRows)
    }

    getLastRowBot(): number {
        const els = document.getElementsByClassName("data-table-row")
        return els[els.length-1].getBoundingClientRect()?.bottom || this.dataTableService.tblBot;
    }

    execVertScrollDown(cols: string[], colLen: number, currTop: number) {
        let gap = this.dataTableService.tblBot - this.getLastRowBot();
        this.fixRowContainer(gap)
        timer(0).subscribe( () => {
            let h = 0
            let rows = []
            let canAdd = 0
            const maxRows = this.rows.length
            const doRows = (!this.isScrolling && (gap == 0 || !this.mouseIsDown)) || currTop%this.doRowsMod === 0;
            const bel = this.belowArea.nativeElement
            const bbds = bel.getBoundingClientRect()
            const btop = bbds.top
            const defNum = this.dataTableService.defltRHgtNum
            let z = this.lastElRowIndex + 1
            let bhToSub = 0
            let ahToAdd = 0
            const rowsInGap = Math.ceil(gap/defNum)
            canAdd = z+rowsInGap
            const goTo = Math.min(this.dataTableService.currFilData.length, canAdd)
            for(z; z < goTo; z++){
                const wldBeElTop = btop + (defNum*h);
                const wldBeElBot = wldBeElTop+defNum
                if(wldBeElBot < this.dataTableService.tblTop){
                    ahToAdd += defNum
                    bhToSub += defNum
                } else {
                    if(wldBeElTop <= this.dataTableService.tblBot){
                        const item = this.dataTableService.currFilData[z]
                        const index = this.dataTableService.currMapping[z] || (doRows ? this.dataTableService.findObjIndxInData(item) : -1)
                        if(rows.length < maxRows)
                            rows.push({index: index, data: item, elInd: z})
                    }
                }
                h += 1
            }
            if(bhToSub)
                this.belowHgt.set((this.belowHgt() - bhToSub))
            if(ahToAdd)
                this.aboveHgt.set((this.aboveHgt() + ahToAdd))
            const repl = [...rows].length;//only new rows
            const needsToFill = maxRows-repl;
            if(needsToFill){
                let f = !rows.length ? this.lastElRowIndex : (rows[0].elInd-1);
                let fgoto = f-needsToFill;
                for(f; f > fgoto; f--){
                    const item = this.dataTableService.currFilData[f]
                    const index = this.dataTableService.currMapping[f] || (doRows ? this.dataTableService.findObjIndxInData(item) : -1);
                    rows.unshift({index: index, data: item})
                }
            }
            const vlen = this.dataTableService.visibleCols.length
            const lastVisInd = cols.indexOf(this.dataTableService.visibleCols[(vlen-1)]) + 1
            this.applyToDomRows(rows, cols, colLen, lastVisInd, "down", defNum, repl)
        })
    }

    getFirstRowTop(): number {
        return document.getElementsByClassName("data-table-row")[0]?.getBoundingClientRect().top || this.dataTableService.tblTop;
    }

    execVertScrollUp(cols: string[], colLen: number, currTop: number, force?: boolean) {
        const maxRows = this.rows.length
        let gap = this.getFirstRowTop() - this.dataTableService.tblTop
        this.fixRowContainer(-gap)
        timer(0).subscribe( () => {
            let h = 0
            let rows = []
            const ael = this.aboveArea.nativeElement
            const abds = ael.getBoundingClientRect()
            const rbot = abds.bottom;
            const defNum = this.dataTableService.defltRHgtNum
            let z = (this.lastElRowIndex - maxRows)
            let bhToAdd = 0
            let ahToSub = 0
            const doRows = force || (!this.isScrolling && (gap == 0 || !this.mouseIsDown)) || currTop%this.doRowsMod === 0;
            const rowsInGap = Math.ceil(gap/defNum)
            const min = Math.max(0, (z-rowsInGap))
            for(z; z >= min; z--){
                const wldBeElBot = rbot - (defNum*h);
                const wldBeElTop = wldBeElBot-defNum
                if(wldBeElTop > this.dataTableService.tblBot){
                    bhToAdd += defNum
                    ahToSub += defNum
                } else {
                    if(wldBeElBot > this.dataTableService.tblTop){
                        const item = this.dataTableService.currFilData[z]
                        const index = this.dataTableService.currMapping[z] || (doRows ? this.dataTableService.findObjIndxInData(item) : -1)
                        if(rows.length < maxRows)
                            rows.push({index: index, data: item, elInd: z})
                    }
                }
                h += 1
            }
            if(ahToSub)
                this.aboveHgt.set((this.aboveHgt() - ahToSub))
            if(bhToAdd)
                this.belowHgt.set((this.belowHgt() + bhToAdd))
            const repl = [...rows].length;//only new rows
            const needsToFill = maxRows-repl;
            if(needsToFill){
                let f = (!rows.length ? (this.lastElRowIndex - maxRows) : rows[0].elInd)+1;
                let fgoto = f+needsToFill;
                for(f; f < fgoto; f++){
                    const item = this.dataTableService.currFilData[f]
                    const index = this.dataTableService.currMapping[f] || (doRows ? this.dataTableService.findObjIndxInData(item) : -1);
                    rows.unshift({index: index, data: item})
                }
            }
            const vlen = this.dataTableService.visibleCols.length
            const lastVisInd = cols.indexOf(this.dataTableService.visibleCols[(vlen-1)]) + 1;
            this.applyToDomRows(rows, cols, colLen, lastVisInd, "up", defNum, repl)
        })
    }

    finishApplyingDomRows(newRows: number) {
        this.setRowNumbers()
        this.fixRowContainer(0)
        this.setLastRowIndex()
        this.cleanRowChecks()
    }

    handleValidatedCellEditFocus(cellData: any) {//{type: this.cell.dataType, value: this.cell.rawText}
        this.validatedEditType = cellData.type
        if(this.valEditFocusTo){
            this.valEditFocusTo.unsubscribe()
            this.valEditFocusTo = null
        }
        this.valEditFocusTo = timer(10).subscribe( () => {
            const rel = this.validatedEdit.nativeElement
            let el;
            const elD = <HTMLDivElement>document.querySelector(".relly.edit-input")
            if(!elD)//look for the one that's relly (relative) positioned first
                el = <HTMLInputElement>document.getElementsByClassName("edit-input")[0]
            const cell = document.querySelector("#dataTableRow" + this.dataTableService.currEditIndex + " .data-cell-" + this.common.elifyCol(this.dataTableService.currEditCol))
            if((el || elD) && cell){
                const rbds = rel.getBoundingClientRect()
                const cbds = cell.getBoundingClientRect();
                (el || elD).style.top = (cellData.type === "text" ? (Math.ceil(cbds.bottom-rbds.top) + 1) : (Math.ceil(cbds.top-rbds.top) + 1)) + "px";
                (el || elD).style.left = (Math.ceil(cbds.left-rbds.left) + 1) + "px";
                (el || elD).style.width = (cbds.width-2) + "px";
                (el || elD).style.height = (cbds.height-2) + "px";
                if(el){
                    el.value = cellData.type === "date" ? new Date(cellData.value)?.toISOString().split("T")[0] : cellData.value;
                    timer(0).subscribe( () => { el.focus(); this.dataTableService.lockCellFocus.set(false) })
                } else {
                    this.dataTableService.lockCellFocus.set(false)
                }
                rel.classList.remove("invisible")
                this.fCellDragger.nativeElement.style.left = (Math.ceil(cbds.left-rbds.left) + cbds.width - 4) + "px";
                this.fCellDragger.nativeElement.style.top = (Math.ceil(cbds.bottom-rbds.top) - 4) + "px"
            } else {
                this.dataTableService.lockCellFocus.set(false)
            }
        })
    }

    clearFCellDragger() {
        if(!this.dataTableService.autoScrollOnEdit){
            this.fCellDragger.nativeElement.style.removeProperty("top")
            this.fCellDragger.nativeElement.style.removeProperty("left")
        }
    }

    clearValidatedEdit(e?: any, clearDrag?: boolean) {
        if(this.listenToCellDraggerMouseMove)
            return;
        if((e && e.type === "blur") || (e && e.type === "focus" && e.relatedTarget?.id === "fCellDragger")){
            setTimeout( () => { this.handleCellDraggerInit() })
        } else {
            this.execValClear(clearDrag)
        }
    }

     execValClear(clearDrag?: boolean) {
        this.blurContEd()
        this.dataTableService.currEditIndex = -1
        this.dataTableService.currEditCol = ""
        this.validatedEditType = ""
        this.dataTableService.lockCellFocus.set(false)
        this.validatedEdit.nativeElement.classList.add("invisible")
        if(clearDrag)
            this.clearCellDEdits()
        setTimeout( () => { this.dataTableService.clearAllFocused() })
     }

     handleDraggerMU(e: any) {
        if(e && e.target && e.target.id && e.target.id.startsWith("selEdit"))
            return;
        this.listenToCellDraggerMouseUp = false
        if(this.listenToCellDraggerMouseMove){
            this.listenToCellDraggerMouseMove = false
            this.clearCellDEdits()
        }
    }

    handleDraggerKD(e: any) {
        const row = document.getElementById("dataTableRow" + this.dataTableService.currEditIndex)
        if(row && this.dataTableService.currEditCol){
            let targRow;
            let bds;
            if(e && this.common.isDownKey(e))
                targRow = row.nextElementSibling

            if(e && this.common.isUpKey(e))
                targRow = row.previousElementSibling
            if(targRow){
                bds = targRow.getBoundingClientRect()
                this.listenToCellDraggerMouseMove = true
                const execDragEOnDK = (e: any) => {
                    this.handleCellDraggerEdit(e)
                }
                targRow.addEventListener("mousemove", execDragEOnDK)
                const mouseEvent = new MouseEvent('mousemove', {
                    view: window,
                    bubbles: false,
                    cancelable: false,
                    clientX: bds.right, // X-coordinate relative to the viewport
                    clientY: bds.bottom,  // Y-coordinate relative to the viewport
                });
                targRow.dispatchEvent(mouseEvent)
                targRow.removeEventListener("mousemove", execDragEOnDK)
                setTimeout( () => {this.listenToCellDraggerMouseMove = false})
            }
        }
    }

     clearCellDEdits() {
        this.clearFCellDragger()
        this.dataTableService.clearDCellFcsd()
        this.clearDragEditFlag()
     }

     clearDragEditFlag() {
        this.rows = this.rows.map( r => {
            if(r.editedInDrag)
                r.editedInDrag = false
            return r
        })
     }

     handleCellDraggerInit() {
         const actEl = document.activeElement
         if(actEl && actEl.id === "fCellDragger"){
            this.focusCellDragger()
         } else {
           if(!actEl || (actEl && !/data-cell/g.test(actEl?.className)))
            this.execValClear() 
         }
     }

     focusCellDragger() {
        this.validatedEditType = ""
        this.validatedEdit.nativeElement.classList.add("invisible")
        const cell= document.querySelector("#dataTableRow" + this.dataTableService.currEditIndex + " .data-cell-" + this.common.elifyCol(this.dataTableService.currEditCol))
        if(cell)
            cell.classList.add("dragger-cell-focused")
        this.listenToCellDraggerMouseUp = true
     }

     focusCellDraggerFromMouseDown() {
        this.listenToCellDraggerMouseMove = true
    }

    handleFDragTab(e: any) {
        if(e && this.common.isTabKey(e)){
            const cell = document.getElementsByClassName("dragger-cell-focused")[0]
            if(cell){
                const nxtCell: HTMLElement = <HTMLElement>cell.parentElement?.nextElementSibling?.firstElementChild
                this.dataTableService.autoScrollOnEdit = true;
                if(nxtCell){
                    setTimeout( () => { nxtCell.focus(); this.dataTableService.autoScrollOnEdit = false; })
                } else {
                    const nxtRow = cell.parentElement?.parentElement?.nextElementSibling
                    if(nxtRow){
                        this.dataTableService.scrollBodyForTabbing()
                        const nxtRowCell = <HTMLElement>document.querySelector("#" + nxtRow.id + " .data-cell:not(.col-header-minimized)")
                        if(nxtRowCell)
                            nxtRowCell.focus()
                    }
                }
            }
        }
    }

     settleCellDragger() {
        const els = document.getElementsByClassName("dragger-cell-focused")
        const len = els.length
        const cell = this.scrollDir === "down" ? els[(len-1)] : els[0];
        if(cell){
            const fCellDragger = <HTMLElement>document.getElementsByClassName("focused-cell-dragger")[0]
            const par = fCellDragger?.parentElement
            if(fCellDragger && par){
                const cbds = cell.getBoundingClientRect()
                const rbds = par.getBoundingClientRect()
                fCellDragger.style.left = (Math.ceil(cbds.left-rbds.left) + cbds.width - 4) + "px";
                fCellDragger.style.top = (Math.ceil(cbds.bottom-rbds.top) - 4) + "px";
            }
        }
     }

     handleCellDraggerEdit(e: any) {
        if(e && e.target){
            let dragId: number = -1;
            const targ = e.target
            try{
                if(/dataTableRow/g.test(targ.id)){
                    dragId = parseInt(targ.id.replace("dataTableRow", ""))
                } else {
                    if(/data-cell/g.test(targ.className))
                        dragId = parseInt(targ.getAttribute("data-index").replace("dataTableRow", ""))
                }
                let cell;
                const row = this.rows.find( r => r.index === dragId)
                const els = document.getElementsByClassName("dragger-cell-focused")
                if(dragId > -1 && (row && !row.editedInDrag)){
                    const item = this.dataTableService.mainData[this.dataTableService.currEditIndex]
                    const val = item[this.dataTableService.currEditCol]
                    const currEInd = this.dataTableService.findObjIndxInData(item, this.dataTableService.currFilData)
                    const currDrgInd = this.dataTableService.findObjIndxInData(this.dataTableService.mainData[dragId], this.dataTableService.currFilData)
                    this.scrollDir = currDrgInd > currEInd ? "down" : "up";
                    this.dataTableService.currEditIndex = dragId
                    this.execCellEdit({ column: this.dataTableService.currEditCol, value: val }, true)
                    row.editedInDrag = true
                    cell = document.querySelector("#dataTableRow" + dragId + " .data-cell-" + this.common.elifyCol(this.dataTableService.currEditCol))    
                }
                // if(els.length > 1){
                //     const dir = this.scrollDir === "down" ? 1 : -1;
                //     const toScl = dir*(Math.ceil((e.offsetY || 20))/2)
                //     this.dataTableBody.nativeElement.scrollBy(0, toScl)
                // }
                const fCellDragger = <HTMLElement>document.getElementsByClassName("focused-cell-dragger")[0]
                const par = fCellDragger?.parentElement
                if(cell && fCellDragger && par){
                    const cbds = cell.getBoundingClientRect()
                    const rbds = par.getBoundingClientRect()
                    fCellDragger.style.left = (Math.ceil(cbds.left-rbds.left) + cbds.width - 4) + "px";
                    fCellDragger.style.top = (Math.ceil(cbds.bottom-rbds.top) - 4) + "px";
                }
                if(!cell){
                    const len = els.length
                    if(len){
                        if(e.clientY > this.dataTableService.tblBot){
                            cell = els[(len-1)]
                        }
                        if(e.clientY < this.dataTableService.tblTop){
                            cell = els[0]
                        }
                        if(cell && fCellDragger && par){
                            const cbds = cell.getBoundingClientRect()
                            const rbds = par.getBoundingClientRect()
                            fCellDragger.style.left = (Math.ceil(cbds.left-rbds.left) + cbds.width - 4) + "px";
                            fCellDragger.style.top = (Math.ceil(cbds.bottom-rbds.top) - 4) + "px";
                        }
                    }
                }
            }catch(e){}
        }
    }

    validateRawText(text: string, dataType: string): string {
        if(dataType === "number" && (!text || /[a-zA-Z \/]/g.test(text)))
            return ""
        return text
    }

     execCellEdit(e: any, noBlur?: boolean, forceVal?: any/*from dropdown select, normally a string*/) {//{ column: this.cell.column, value: val }
        if(this.dataTableService.currEditIndex > -1){
            let cfDIdx;
            let valueDidChange: boolean = true;
            const valEl = <HTMLInputElement>document.getElementsByClassName("edit-input")[0]
            let val = forceVal ? forceVal : (valEl ? valEl.value : e.value);
            if(val && !this.validateRawText(val, this.validatedEditType)){
                if(!noBlur)
                    this.clearValidatedEdit(e)
                return;
            }
            if(val && typeof val === "string" && this.validatedEditType === "date")
                val = this.common.coerceDate(val)
            if(val && typeof val === "string" && this.validatedEditType === "number")
                val = /\./g.test(val) ? parseFloat(val) : parseInt(val);
            const realProp: string = this.dataTableService.currEditCol || e.column;
            const nwVal = this.dataTableService.mainData[this.dataTableService.currEditIndex][realProp]
            if(nwVal === val)
                valueDidChange = false;//still do everything, just tell them
            this.dataTableService.mainData[this.dataTableService.currEditIndex][realProp] = val;
            const item = this.dataTableService.mainData[this.dataTableService.currEditIndex]
            if(item){
                cfDIdx = this.dataTableService.findObjIndxInData(item, this.dataTableService.currFilData)
                if(cfDIdx > -1)
                    this.dataTableService.currFilData[cfDIdx][realProp] = val
            }
            let cell;
            const row = this.rows.find( r => r.index === this.dataTableService.currEditIndex)
            if(row){
                cell = row.cells?.find( c => c.column === this.dataTableService.currEditCol || c.column === e.column)
                if(cell)
                    cell.rawText = val
            }
            const dtType = this.dataTableService.figureFilterType(realProp)
            const notNum = (dtType != "number" || /(year|yr|fy)/g.test(realProp.toLocaleLowerCase())) ? true : false
            const useTxt = this.dataTableService.figureCellText(val, notNum);
            const cellEl = <HTMLElement>document.querySelector("#dataTableRow" + this.dataTableService.currEditIndex + " .data-cell-" + this.common.elifyCol(realProp))
            if(cellEl){
                if(useTxt.prop === "textContent")
                    cellEl.textContent = useTxt.value;
                else{
                    cellEl.innerHTML = useTxt.value;
                }
                if(cell){
                    cell.text = useTxt.prop === "textContent" ? useTxt.value : ""
                    if(this.listenToCellDraggerMouseMove)
                        cellEl.classList.add("dragger-cell-focused")
                }
            }
            const rowKey = (this.dataTableService.primaryKey ? this.dataTableService.mainData[this.dataTableService.currEditIndex][this.dataTableService.primaryKey] : 
            this.dataTableService.currEditIndex)
            const edit: CellEdit = {
                value: val,
                column: realProp,
                row: rowKey,
                idType: this.dataTableService.primaryKey ? "key" : "rowId",
                valueChanged: valueDidChange,
            }
            this.cellEdit.emit(edit)
            if(!noBlur)
                this.clearValidatedEdit(e)
        }
    }

      handleSingleColResize(val: any, column?: string) {
        if(val && (this.dataTableService.currColumnEdit || column)){
            const cols = this.getAllColsAtRuntime(null);
            const colLen = cols.length
            const rawCol = column || this.common.replaceUniSep(this.dataTableService.currColumnEdit)
            const thecol = this.columnHeaders.find( c => (c && c.column === rawCol))
            if(thecol){
                thecol.width = (val + "px")
                this.dataTableService.dataFilSrtTracker[thecol.column]["colWidth"] = (val + "px")
            }
            let i = 0
            const toResize = this.rows.filter( r => r.cells?.length)
            const len = toResize.length
            for(i; i < len; i++){
                const ind = toResize[i].index
                const row = this.rows.find( r => r.index === ind)
                if(row){
                    row.cells = row.cells?.map( c => {
                        if(c && c.column === rawCol)
                            c.width = (val + "px")
                        return c
                    })
                }
            }
            setTimeout( () => { 
                const allColW = this.getAllColWidth(colLen)
                this.setDataRowWidthsOnMinimize(allColW)
                this.setRowSelChecksPlacement() 
            })
            this.clearValidatedEdit()
        }
    }

    setHeaderHeight(val: any, force?: boolean) {
            if(val && typeof val === "string")
                val = Math.ceil(parseInt(val))
            const rHgt = force ? val : Math.max(val, parseInt(this.desRowHeight))
            const useHgt = Math.floor(rHgt) + "px";
            const row = this.dataTableHeaders.nativeElement
            row["style"]["height"] = useHgt
            this.columnHeaders.forEach( c => {c.height = useHgt})
            if(this.rowNumbers && this.rowNumHeader)
                this.rowNumHeader.nativeElement.style.height = useHgt;
            setTimeout( () => { this.setRowSelChecksPlacement() })
        }

       setSingleRowHgt(val: any, row?: any, force?: boolean) {
            if(val && typeof val === "string")
                val = Math.ceil(parseInt(val))
            const rHgt = force ? val : Math.max(val, (parseInt(this.desRowHeight) || Math.ceil(row.getBoundingClientRect().height)))
            const useHgt = Math.floor(rHgt) + "px";
            if(force || (typeof row === "string" && this.tblDragService.colDragStartFrmCellTracker.row && this.tblDragService.colDragStartFrmCellTracker.ystart)){
                const drow = this.rows.find( r => r.id === row)
                if(drow){
                    drow.height = useHgt
                    if(this.rowNumbers){
                        const item = this.dataTableService.mainData[drow?.index]
                        if(item){
                            const indx = this.dataTableService.findObjIndxInData(item, this.dataTableService.currFilData) + 1
                            const rNum = this.rowNos.find( r => r.number === indx)
                            if(rNum)
                                rNum.height = useHgt
                        }
                    }                    
                }
            }
            setTimeout( () => { this.setRowSelChecksPlacement() })
            this.clearValidatedEdit()
        }

        checkTabHorizScroll(id: string) {
            const colH = document.getElementById("columnHeader" + id)
            const dtb = this.dataTableBody.nativeElement
            if(colH && dtb){
                let left = (colH.getBoundingClientRect().left-50)
                if(colH){
                    left -= (this.rowNumbers ? 75 : 0)
                    dtb.scrollBy(left, 0)
                }
            }
        }

        handleTheme(co1: string | null, co2: string | null) {
            try{
                let rule1; let rule1a; let rule2; let rule3; let rule4; let rule5; let rule6;
                if(co1){
                    this.dataTableService.themeColor1 = co1
                    rule1 = ".col-header span, .col-header sup, .col-header button .material-icons, " + 
                    ".data-table-footer div, .btn-fil-comp i{color: "+co1+" !important}";
                    rule1a = ".col-header select, .col-header input:not(input[type=file]){box-shadow:0 0 1px 1px "+co1+";" +
                    "-webkit-box-shadow:0 0 1px 1px "+co1+"}";
                }
                if(co2){
                    this.dataTableService.themeColor2 = co2
                    rule2 = ".col-header, .data-table-footer, .btn-fil-comp{background: "+co2+" !important}"
                    const tblbxSh = "0 -1px 3px 1px ";
                    const tblFbxSh = "0 1px 3px -3px ";
                    if(this.dataTableService.mainDataLen){
                        rule2 = ".col-header, .btn-fil-comp{background: "+co2+" !important}"
                        rule3 = ".data-table{ box-shadow: "+tblbxSh + co2+"; -webkit-box-shadow: "+tblbxSh + co2+"; -moz-box-shadow: "+tblbxSh + co2+"}"
                        rule6 = ".data-table-footer{background: "+co2+"; box-shadow: "+tblFbxSh + co2+"; -webkit-box-shadow: "+tblFbxSh + co2+"; -moz-box-shadow: "+tblFbxSh + co2+"}";
                    }
                    rule5 = ".data-cell{ border-bottom: 1px solid "+co2+" !important; border-right: 1px solid "+co2+" !important}"
                }
                if(this.altRowColor)
                    rule4 = ".data-table-row:not(.data-row-selected):nth-of-type(odd){background:"+this.altRowColor+"}"
                if(rule1 || rule1a || rule2 || rule3 || rule4 || rule5 || rule6){
                    const el = document.createElement("style")
                    document.head.appendChild(el)
                    if(rule1)
                        el.sheet?.insertRule(rule1)
                    if(rule1a)
                        el.sheet?.insertRule(rule1a)
                    if(rule2)
                        el.sheet?.insertRule(rule2)
                    if(rule3)
                        el.sheet?.insertRule(rule3)
                    if(rule4)
                        el.sheet?.insertRule(rule4)
                    if(rule5)
                        el.sheet?.insertRule(rule5)
                    if(rule6)
                        el.sheet?.insertRule(rule6)
                }
            }catch(e){}
        }

    renderCurrData(reset: boolean, field?: any): any {//filter val
        const thead = this.dataTableHeaders.nativeElement
        const tbody = this.dataTableBody.nativeElement
        const tbodyX = tbody.scrollLeft
        this.rows = []
        this.aboveHgt.set(0)
        this.belowHgt.set(0)
        this.rowNos = []
        this.dtChecks = []
        this.doRowsMod = 10;
        this.clearValidatedEdit(null, true)
        this.dataTableService.currMapping = {}
        this.horizRest = 0
        tbody.scrollTop = 0
        this.verticalRest = 0
        let didXScrl = false;
        if(reset && !field && thead && tbody){
            thead.style.marginLeft = "0px"
            tbody.scrollLeft = 0
            this.horizRest = 0
        }
        this.lastElRowIndex = 0
        let n = 0
        const defNum = this.dataTableService.defltRHgtNum
        const init = Math.ceil(this.dataTableService.dTblHeight()/defNum)+this.rowElsPad;
        const len = this.dataTableService.currFilData.length;
        if(!len){//always just add 1
            this.allFilSortInfo = this.dataTableService.getAllFilSrtInfo()
            return setTimeout( () => { this.styleEmptyFilDataRow(tbody, tbodyX) })
        }
        if(len >= 500000)
            this.doRowsMod = 15
        const uCols = [...this.columnHeaders]
        const colLen = uCols.length
        const addCell = (text: any, prop: string | null, row: DataRow, indx: number, visible: boolean) => {
            if(prop && row){
                const notNum = (this.dataTableService.figureFilterType(prop) != "number" || /(year|yr|fy)/g.test(prop.toLocaleLowerCase())) ? true : false
                const useTxt = this.dataTableService.figureCellText(text, notNum, this.dataTableService.dataFilSrtTracker[prop]["colCellSymbol"])
                row.cells?.push({
                    column: prop,
                    rawText: text,
                    visible: visible,
                    editable: useTxt.prop === "textContent" ? this.editable : false,
                    dataType: this.dataTableService.figureFilterType(prop),
                    freeze: this.dataTableService.dataFilSrtTracker[prop].freeze,
                    minimized: this.dataTableService.dataFilSrtTracker[prop].minimize,
                    width: this.dataTableService.dataFilSrtTracker[prop].colWidth || this.dataTableService.useColWid,
                    text: useTxt.prop === "textContent" ? useTxt.value : "",
                    html: useTxt.prop !== "textContent" ? useTxt.value : "",
                })
            }

            if(row && prop && row.cells && row.cells.length === 1)
                this.dtChecks.push(indx)
            if(field && field === prop && !didXScrl){
                setTimeout( () => {
                    tbody.scrollLeft = tbodyX
                    if(thead)
                        thead.style.marginLeft = (-tbodyX + "px")
                    this.horizRest = tbodyX
                }, 100)
                didXScrl = true
            }
        }
        this.useRowWid = this.getAllColWidth(colLen) + "px";
        const limit = Math.min(init, len)
        this.maxCols = this.setMaxCols()
        let horizLim = Math.min(this.maxCols, colLen)
        if(field && field !== "topLevelDataFilter"){
            let room = 0
            let offst = 3
            const fhead = document.getElementById("columnHeader" + this.common.elifyCol(field))
            if(fhead){
                const bds = fhead.getBoundingClientRect()
                room = this.dataTableService.tblRight - bds.right
                if(room > 0)
                    offst = Math.ceil(room/bds.width)
            }
            horizLim = Math.max(horizLim, (uCols.map( c => c.column).indexOf(field) + offst))
        }
        let localRows = [];
        for(n; n < limit; n++){
            const item = this.dataTableService.currFilData[n]
            const index = !reset ? this.dataTableService.findObjIndxInData(item) : n
            if(index > -1){
                const row: DataRow = { id: "dataTableRow" + index, index: index, width: this.useRowWid, cells: [], height: this.dataTableService.defltRHgt }
                let k = 0
                for(k; k < colLen; k++){
                    const col = uCols[k]?.column
                    if(col)
                        addCell(item[col], col, row, index, (k <= horizLim))
                }
                localRows.push(row)
                this.dataTableService.currMapping[n] = index
            }
        }
        this.rows = [...localRows]
        this.setLastRowIndex()
        this.allFilSortInfo = this.dataTableService.getAllFilSrtInfo()
        this.dataTableService.mapperWorkerId += 1//a reset but needs to incr so prev don't affect mapping 
        if(len){
            if(len > init){
                let total = 0
                let z = this.lastElRowIndex + 1
                for(z; z < len; z++){
                    total += 1
                    if(reset)
                        this.dataTableService.currMapping[z] = z
                }
                this.belowHgt.set(total*defNum)
                if(!reset){
                    if (typeof Worker !== 'undefined') {
                        // Create a new
                        let worker
                        worker = new Worker(new URL('../worker.worker.ts', import.meta.url));
                        worker.onmessage = ({ data }) => {//{ id: data.id, map: {} }
                            if(this.dataTableService.mapperWorkerId === data.id)
                                this.dataTableService.currMapping = {...data.map}
                        };
                        if(worker)
                            worker.postMessage({id: this.dataTableService.mapperWorkerId, pk: this.dataTableService.primaryKey,  main: this.dataTableService.mainData, curr: this.dataTableService.currFilData});
                    }
                }
            }
            this.dataTableService.setIdealColumnWidth.next(true)
            timer(0).subscribe( () => { this.setRowSelChecksPlacement(); this.setHoldingCheckCls() })
        }
    }

    styleEmptyFilDataRow(tbody: HTMLElement, tbodyX: number) {
        const row = <HTMLElement>document.getElementsByClassName("data-table-row-no-data")[0]
        if(row){
            row.style.width = this.dataTableHeaders.nativeElement.scrollWidth + "px"
            timer(100).subscribe( () => tbody.scrollLeft = tbodyX)
        }
    }

    freezeColCells(col: string) {
        this.rows = this.rows.map( r => {
            r.cells = r.cells?.map( c => {
                if(c && c.column === col)
                    c.freeze = !c.freeze
                return c
            })
            return r
        })
    }

    setTableWidthOnChange() {
        const cols = this.getAllColsAtRuntime(null)
        this.maxCols = this.setMaxCols()
        const colLen = cols.length
        setTimeout( () => { 
            this.setDataRowWidthsOnMinimize(this.getAllColWidth(colLen))
        }, 375)
        this.setHoldingCheckCls()
        this.setColsOnVisScreen()
        setTimeout( () => { this.setColHeaderHgt() })
    }

    setHoldingCheckCls() {
        this.dataTableService.firstCol = this.columnHeaders.filter( c => !c.minimized)[0].column
    }

    setDataRowWidthsOnMinimize(width: number) {
        let i = 0;
        const wid = width + "px"
        const rLen = this.rows.length
        for(i; i < rLen; i++)
            this.rows[i].width = wid
        this.useRowWid = wid;
    }

    clearFilInputs() {
        let i = 0
        const els = document.querySelectorAll(".col-header input")
        const len = els.length
        for(i; i < len; i++){
            const el = <HTMLInputElement>els[i]
            if(el)
                el.value = ""
        }
    }

    resetCurrentData(col?: string) {
        this.topLevelFilter = ""
        this.dataTableService.sortOrder = []
        this.clearSelectedRows()
        this.removeAllFreezeCols()
        this.clearFilInputs()
        this.resetVisCols()
        this.allFilSortInfo = ""
        this.columnOfInterest = ""
        this.dataTableService.setTblBounds()
        this.dataTableService.resetFilSrtTracker()
        this.dataTableService.currFilData = this.dataTableService.mainData.filter( d => { return true })
        this.renderCurrData(true, col)
    }

    resetVisCols() {
        let i = 0
        this.dataTableService.visibleCols = []
        const len = this.columnHeaders.length
        for(i; i < len; i++){
            if(i < this.maxCols)
                this.dataTableService.visibleCols.push(this.columnHeaders[i].column)
        }
    }
  

}
