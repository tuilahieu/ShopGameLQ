export default function AppLoader() {
  return (
    <main className="app-loader" role="status" aria-live="polite" aria-label="Đang tải">
      <span className="app-loader-mark" aria-hidden="true"><i /><i /><i /></span>
    </main>
  );
}
