export default function PanelLoading({ label = "Đang tải dữ liệu" }) {
  return (
    <div className="panel-loading" role="status" aria-label={label} aria-busy="true">
      <span className="panel-loading-heading" aria-hidden="true" />
      {Array.from({ length: 5 }, (_, index) => <span className="panel-loading-row" key={index} aria-hidden="true"><i /><i /><i /></span>)}
    </div>
  );
}
