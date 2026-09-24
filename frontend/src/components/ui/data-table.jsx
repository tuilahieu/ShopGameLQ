import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./empty";
import { Skeleton } from "./skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableViewport } from "./table";
import { cn } from "./utils";

function valueFor(column, row) {
  return column.accessor ? column.accessor(row) : row[column.id];
}

function compareValues(left, right) {
  if (left === right) return 0;
  if (left === null || left === undefined) return -1;
  if (right === null || right === undefined) return 1;
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), "vi", { numeric: true, sensitivity: "base" });
}

export function DataTable({
  columns,
  data,
  className,
  caption,
  toolbar,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  getRowId = (row) => row.id,
  loading = false,
  empty,
  rowClassName,
}) {
  const [sort, setSort] = useState({ id: "", direction: "asc" });
  const sortableColumns = useMemo(() => columns.filter((column) => column.sortable), [columns]);
  const sortedData = useMemo(() => {
    if (!sort.id) return data;
    const column = columns.find((item) => item.id === sort.id);
    if (!column) return data;
    return [...data].sort((left, right) => {
      const result = compareValues(valueFor(column, left), valueFor(column, right));
      return sort.direction === "asc" ? result : -result;
    });
  }, [columns, data, sort]);

  const allSelected = data.length > 0 && data.every((row) => selectedIds.has(getRowId(row)));
  const partiallySelected = data.some((row) => selectedIds.has(getRowId(row))) && !allSelected;

  function toggleSort(id) {
    const nextColumn = sortableColumns.find((column) => column.id === id);
    if (!nextColumn) return;
    setSort((current) => ({
      id,
      direction: current.id === id && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function toggleAll(checked) {
    const next = new Set(selectedIds);
    data.forEach((row) => {
      const id = getRowId(row);
      if (checked) next.add(id);
      else next.delete(id);
    });
    onSelectionChange?.(next);
  }

  function toggleRow(row, checked) {
    const next = new Set(selectedIds);
    const id = getRowId(row);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectionChange?.(next);
  }

  return (
    <div className={cn("ui-data-table", className)} aria-busy={loading || undefined}>
      {toolbar && <div className="ui-data-table-toolbar">{toolbar}</div>}
      <TableViewport>
        <Table>
          {caption && <caption className="ui-table-caption">{caption}</caption>}
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="ui-table-selection-cell">
                  <Checkbox checked={allSelected} indeterminate={partiallySelected} onChange={(event) => toggleAll(event.target.checked)} aria-label="Chọn tất cả tài khoản trong trang" />
                </TableHead>
              )}
              {columns.map((column) => {
                const sorted = sort.id === column.id;
                const SortIcon = sorted ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
                const actionColumn = column.id === "actions" || column.id === "action";
                return (
                  <TableHead key={column.id} className={cn(column.headerClassName, actionColumn && "ui-table-actions-column")} aria-sort={sorted ? `${sort.direction}ending` : undefined}>
                    {column.sortable ? (
                      <button type="button" className="ui-table-sort-button" onClick={() => toggleSort(column.id)}>
                        <span>{column.header}</span><SortIcon size={14} aria-hidden="true" />
                      </button>
                    ) : column.header}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && data.length === 0 && Array.from({ length: 6 }, (_, index) => (
              <TableRow key={`loading-${index}`} aria-hidden="true">
                {selectable && <TableCell><Skeleton className="ui-skeleton-checkbox" /></TableCell>}
                {columns.map((column) => <TableCell key={column.id}><Skeleton className="ui-skeleton-line" /></TableCell>)}
              </TableRow>
            ))}
            {!loading && sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="ui-table-empty-cell">
                  {empty || <Empty><EmptyMedia>—</EmptyMedia><EmptyHeader><EmptyTitle>Không có dữ liệu</EmptyTitle><EmptyDescription>Chưa có bản ghi phù hợp để hiển thị.</EmptyDescription></EmptyHeader></Empty>}
                </TableCell>
              </TableRow>
            )}
            {sortedData.map((row) => (
              <TableRow key={getRowId(row)} className={cn(rowClassName?.(row), selectedIds.has(getRowId(row)) && "is-selected")}>
                {selectable && (
                  <TableCell className="ui-table-selection-cell">
                    <Checkbox checked={selectedIds.has(getRowId(row))} onChange={(event) => toggleRow(row, event.target.checked)} aria-label={`Chọn tài khoản #${getRowId(row)}`} />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.id} className={cn(column.cellClassName, (column.id === "actions" || column.id === "action") && "ui-table-actions-column")}>
                    {column.cell ? column.cell(row) : valueFor(column, row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableViewport>
    </div>
  );
}

export function DataTablePagination({ page, totalPages, total, pageSize, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="ui-data-table-pagination">
      <span>Hiển thị tối đa {pageSize} dòng · Tổng <strong>{total}</strong></span>
      <div>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Trang trước">
          <ChevronLeft size={16} aria-hidden="true" /> Trước
        </Button>
        <span aria-live="polite">Trang <strong>{page}</strong> / {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Trang sau">
          Sau <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
