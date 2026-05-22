import { DataCell } from "./data-cell";

export interface DataRow {
    id: string;
    index: number;
    width: string;
    height?: string;
    cells?: DataCell[];
    aboveTable?: boolean;
    editedInDrag?: boolean;
}
