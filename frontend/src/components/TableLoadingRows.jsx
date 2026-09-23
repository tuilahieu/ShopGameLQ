export default function TableLoadingRows({ columns, rows = 5 }) {
  return Array.from({ length: rows }, (_, index) => (
    <tr key={`loading-${index}`} aria-hidden="true">
      {Array.from({ length: columns }, (_, cell) => (
        <td key={cell}><span className="table-cell-placeholder" /></td>
      ))}
    </tr>
  ));
}
