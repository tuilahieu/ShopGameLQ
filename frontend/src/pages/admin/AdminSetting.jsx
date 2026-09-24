import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import SafeImage from "../../components/SafeImage";
import { AdminError, AdminField, AdminPageHeader } from "../../components/admin/AdminUi";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import { Textarea } from "../../components/ui/textarea";
import { notifyAdmin } from "../../utils/adminFeedback";

function ImageUploadField({ label, fieldKey, value, onChange }) {
  const inputRef = useRef();
  const inputId = `admin-setting-${fieldKey}`;
  const [uploading, setUploading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(fieldKey, res.data.data.url);
      notifyAdmin("Đã tải ảnh lên");
    } catch {
      notifyAdmin("Upload thất bại!");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminField id={inputId} label={label} className="ui-field-full">
      <div className="ui-upload-row"><Input id={inputId} type="url" placeholder="Nhập URL hoặc upload file" value={value || ""} onChange={(event) => onChange(fieldKey, event.target.value)} /><label className={`ui-upload-trigger${uploading ? " is-disabled" : ""}`} htmlFor={`${inputId}-upload`}><Upload size={14} aria-hidden="true" /> {uploading ? "Đang tải…" : "Upload"}<input ref={inputRef} id={`${inputId}-upload`} type="file" accept="image/*" onChange={handleFile} disabled={uploading} /></label></div>
      {value && <div className="ui-image-preview"><SafeImage src={value} alt={label} width={214} height={120} fallbackLabel="Ảnh không tải được" /></div>}
    </AdminField>
  );
}

export default function AdminSetting() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [sepaySecretInput, setSepaySecretInput] = useState("");
  const [llmKeyInput, setLlmKeyInput] = useState("");
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [clearLlmKey, setClearLlmKey] = useState(false);
  const [llmConfigDirty, setLlmConfigDirty] = useState(false);
  const [llmTestBusy, setLlmTestBusy] = useState(false);
  const [llmTestResult, setLlmTestResult] = useState(null);
  const [securityForm, setSecurityForm] = useState({ currentPassword: "", oldSecondPassword: "", newSecondPassword: "", confirmPassword: "" });
  const [securityError, setSecurityError] = useState("");
  const [securityBusy, setSecurityBusy] = useState(false);

  async function load() {
    setLoading(true); setLoadError("");
    try { const res = await api.get("/admin/setting"); setForm(res.data.data || {}); } catch (error) { setLoadError(error.response?.data?.message || "Không thể tải cấu hình hệ thống."); } finally { setLoading(false); }
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const settings = { ...form };
      delete settings.sepay_secret;
      delete settings.assistant_llm_api_key;
      const res = await api.put("/admin/setting", { ...settings, ...(sepaySecretInput.trim() && { sepay_secret: sepaySecretInput.trim() }), ...(!clearLlmKey && llmKeyInput.trim() && { assistant_llm_api_key: llmKeyInput.trim() }), ...(clearLlmKey && { assistant_llm_clear_key: true }) });
      if (res.data?.data) setForm(res.data.data);
      setSepaySecretInput(""); setShowSecret(false); setLlmKeyInput(""); setShowLlmKey(false); setClearLlmKey(false); setLlmConfigDirty(false); setLlmTestResult(null);
      notifyAdmin("Đã lưu cấu hình thành công!");
    } catch (error) { notifyAdmin(error.response?.data?.message || "Lưu thất bại, vui lòng thử lại."); } finally { setSaving(false); }
  }

  function set(key, value) { setForm((previous) => ({ ...previous, [key]: value })); }

  async function testLlmConnection() {
    if (llmTestBusy) return;
    setLlmTestBusy(true); setLlmTestResult(null);
    try { const res = await api.post("/admin/assistant/test-llm", { assistant_llm_provider: form.assistant_llm_provider || "none", assistant_llm_model: form.assistant_llm_model || "", assistant_llm_endpoint: form.assistant_llm_endpoint || "", ...(llmKeyInput.trim() && { assistant_llm_api_key: llmKeyInput.trim() }) }); setLlmTestResult({ success: true, message: `Model ${res.data.data.model} trả lời: “${res.data.data.reply}” (${res.data.data.latency_ms} ms)` }); } catch (error) { setLlmTestResult({ success: false, message: error.response?.data?.message || "Không thể kết nối tới model lúc này." }); } finally { setLlmTestBusy(false); }
  }

  async function changeSecondPassword(event) {
    event.preventDefault(); setSecurityError("");
    if (securityForm.newSecondPassword !== securityForm.confirmPassword) return setSecurityError("Hai lần nhập mật khẩu cấp 2 mới chưa khớp.");
    if (Array.from(securityForm.newSecondPassword).length < 12 || new TextEncoder().encode(securityForm.newSecondPassword).length > 72) return setSecurityError("Mật khẩu cấp 2 mới cần ít nhất 12 ký tự và tối đa 72 byte.");
    setSecurityBusy(true);
    try { await api.post("/auth/admin-security/change", { currentPassword: securityForm.currentPassword, oldSecondPassword: securityForm.oldSecondPassword, newSecondPassword: securityForm.newSecondPassword }); setSecurityForm({ currentPassword: "", oldSecondPassword: "", newSecondPassword: "", confirmPassword: "" }); sessionStorage.removeItem("adminSession"); window.dispatchEvent(new Event("admin-session-expired")); } catch (error) { setSecurityError(error.response?.data?.message || "Không thể đổi mật khẩu cấp 2."); } finally { setSecurityBusy(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Card><CardHeader><CardTitle>Đang tải cấu hình hệ thống</CardTitle><CardDescription>Đang đồng bộ thiết lập website và trợ lý.</CardDescription></CardHeader><CardContent className="ui-dashboard-loading"><Skeleton className="ui-skeleton-line" /><Skeleton className="ui-skeleton-line" /><Skeleton className="ui-skeleton-line" /></CardContent></Card>;
  if (loadError) return <div className="admin-setting-page admin-accounts-page"><AdminPageHeader eyebrow="Hệ thống · Admin" title="Cấu hình hệ thống" description="Thiết lập website, thanh toán, bảo mật và trợ lý chatbot." /><AdminError message={loadError} onRetry={load} /></div>;

  const apiBase = new URL(api.defaults.baseURL, window.location.origin);
  const webhookUrl = new URL("payments/sepay/webhook", `${apiBase.href.replace(/\/?$/, "/")}`).href;
  const llmTestDisabled = llmTestBusy || clearLlmKey || (!llmKeyInput.trim() && !form.assistant_llm_key_saved) || form.assistant_llm_provider === "none" || (form.assistant_llm_provider === "vilao" && !form.assistant_llm_model?.trim());

  return (
    <div className="admin-setting-page admin-accounts-page">
      <AdminPageHeader eyebrow="Hệ thống · Admin" title="Cấu hình hệ thống" description="Thiết lập website, thanh toán, bảo mật và trợ lý chatbot trong một trang duy nhất." actions={<Button size="lg" onClick={save} disabled={saving} aria-busy={saving}>{saving ? "Đang lưu…" : "Lưu toàn bộ cấu hình"}</Button>} />

      <Card><CardHeader><CardTitle>Bảo mật quản trị viên</CardTitle><CardDescription>Đổi mật khẩu cấp 2. Sau khi đổi, bạn cần xác minh lại để tiếp tục quản trị.</CardDescription></CardHeader><form onSubmit={changeSecondPassword}><CardContent><div className="ui-form-grid"><AdminField id="security-primary-password" label="Mật khẩu đăng nhập hiện tại" required><Input id="security-primary-password" type="password" autoComplete="current-password" value={securityForm.currentPassword} onChange={(event) => setSecurityForm({ ...securityForm, currentPassword: event.target.value })} required /></AdminField><AdminField id="security-old-second" label="Mật khẩu cấp 2 hiện tại" required><Input id="security-old-second" type="password" autoComplete="off" value={securityForm.oldSecondPassword} onChange={(event) => setSecurityForm({ ...securityForm, oldSecondPassword: event.target.value })} required /></AdminField><AdminField id="security-new-second" label="Mật khẩu cấp 2 mới" required helper="Tối thiểu 12 ký tự, tối đa 72 byte."><Input id="security-new-second" type="password" autoComplete="new-password" minLength={12} maxLength={72} value={securityForm.newSecondPassword} onChange={(event) => setSecurityForm({ ...securityForm, newSecondPassword: event.target.value })} required /></AdminField><AdminField id="security-confirm-second" label="Nhập lại mật khẩu cấp 2 mới" required><Input id="security-confirm-second" type="password" autoComplete="new-password" minLength={12} maxLength={72} value={securityForm.confirmPassword} onChange={(event) => setSecurityForm({ ...securityForm, confirmPassword: event.target.value })} required /></AdminField>{securityError && <p className="ui-field-error ui-field-full" role="alert">{securityError}</p>}</div></CardContent><CardFooter><Button type="submit" disabled={securityBusy}>{securityBusy ? "Đang đổi…" : "Đổi mật khẩu cấp 2"}</Button></CardFooter></form></Card>

      <Card><CardHeader><CardTitle>Thông tin Website</CardTitle><CardDescription>Thông tin nhận diện và nội dung hiển thị trên storefront.</CardDescription></CardHeader><CardContent><div className="ui-form-grid"><AdminField id="admin-setting-site-name" label="Tên Website"><Input id="admin-setting-site-name" placeholder="VD: ShopGameLiQi" value={form.ten_web || ""} onChange={(event) => set("ten_web", event.target.value)} /></AdminField><AdminField id="admin-setting-email" label="Email liên hệ"><Input id="admin-setting-email" type="email" placeholder="admin@example.com" value={form.email || ""} onChange={(event) => set("email", event.target.value)} /></AdminField><AdminField id="admin-setting-facebook" label="Facebook Admin"><Input id="admin-setting-facebook" type="url" placeholder="https://facebook.com/..." value={form.fb_admin || ""} onChange={(event) => set("fb_admin", event.target.value)} /></AdminField><AdminField id="admin-setting-phone" label="Số điện thoại / Zalo"><Input id="admin-setting-phone" placeholder="0xxx xxx xxx" value={form.sdt_admin || ""} onChange={(event) => set("sdt_admin", event.target.value)} /></AdminField><ImageUploadField label="Logo Website" fieldKey="logo" value={form.logo} onChange={set} /><ImageUploadField label="Favicon (icon tab trình duyệt)" fieldKey="favicon" value={form.favicon} onChange={set} /><ImageUploadField label="Ảnh Banner trang chủ" fieldKey="banner" value={form.banner} onChange={set} /><ImageUploadField label="Ảnh Background (nền website)" fieldKey="background" value={form.background} onChange={set} /><AdminField id="admin-setting-home-notice" label="Thông báo hiển thị trên trang chủ" className="ui-field-full"><Textarea id="admin-setting-home-notice" rows={6} placeholder="Nhập nội dung thông báo…" value={form.thongbao || ""} onChange={(event) => set("thongbao", event.target.value)} /></AdminField></div></CardContent></Card>

      <Card><CardHeader><CardTitle>Nhân viên tư vấn chatbot</CardTitle><CardDescription>Tên, avatar và cấu hình LLM được dùng trong khung chat hỗ trợ.</CardDescription></CardHeader><CardContent><div className="ui-form-grid"><AdminField id="admin-setting-assistant-name" label="Tên chatbot" helper="2–40 ký tự; chỉ dùng chữ, số và dấu cách."><Input id="admin-setting-assistant-name" maxLength={40} placeholder="Gia Linh" value={form.assistant_name || ""} onChange={(event) => set("assistant_name", event.target.value)} /></AdminField><ImageUploadField label="Avatar chatbot" fieldKey="assistant_avatar" value={form.assistant_avatar} onChange={set} /><AdminField id="admin-setting-llm-provider" label="Nhà cung cấp LLM"><Select id="admin-setting-llm-provider" value={form.assistant_llm_provider || "none"} onChange={(event) => { setForm((prev) => ({ ...prev, assistant_llm_provider: event.target.value, assistant_llm_model: "" })); setLlmConfigDirty(true); setLlmTestResult(null); }}><option value="none">Chưa chọn</option><option value="gemini">Gemini</option><option value="vilao">VILAO</option></Select></AdminField><AdminField id="admin-setting-llm-model" label="Mã model" helper="Gemini để trống sẽ dùng Flash-Lite."><Input id="admin-setting-llm-model" maxLength={120} placeholder={form.assistant_llm_provider === "vilao" ? "Model hoặc alias ViLao" : "gemini-3.5-flash-lite"} value={form.assistant_llm_model || ""} onChange={(event) => { set("assistant_llm_model", event.target.value); setLlmConfigDirty(true); setLlmTestResult(null); }} /></AdminField>{form.assistant_llm_provider === "vilao" && <AdminField id="admin-setting-llm-endpoint" label="Endpoint ViLao" className="ui-field-full" helper="Dùng URL endpoint /v1 trong trang API Keys của ViLao."><Input id="admin-setting-llm-endpoint" type="url" maxLength={255} placeholder="https://api.vilao.ai/v1" value={form.assistant_llm_endpoint || ""} onChange={(event) => { set("assistant_llm_endpoint", event.target.value); setLlmConfigDirty(true); setLlmTestResult(null); }} /></AdminField>}
        <AdminField id="admin-setting-llm-key" label="API key LLM" helper="Key chỉ được dùng cho request kiểm tra và lưu bảo mật."><div className="ui-secret-control"><Input id="admin-setting-llm-key" type={showLlmKey ? "text" : "password"} autoComplete="new-password" maxLength={4096} placeholder={form.assistant_llm_key_saved ? "Để trống nếu không đổi key" : "Nhập API key"} value={llmKeyInput} onChange={(event) => { setLlmKeyInput(event.target.value); setLlmConfigDirty(true); setLlmTestResult(null); }} disabled={clearLlmKey} /><Button type="button" variant="outline" size="icon" onClick={() => setShowLlmKey((value) => !value)} aria-label={showLlmKey ? "Ẩn API key LLM" : "Hiện API key LLM"} aria-pressed={showLlmKey}>{showLlmKey ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</Button></div><p className="ui-setting-note" role="status">{llmKeyInput.trim() ? "API key mới đang chờ lưu." : form.assistant_llm_key_saved ? "Đã lưu API key mã hóa." : "Chưa có API key."}</p>{form.assistant_llm_key_saved && <label className="ui-checkbox-label"><Checkbox checked={clearLlmKey} onChange={(event) => { setClearLlmKey(event.target.checked); setLlmKeyInput(""); setLlmConfigDirty(true); setLlmTestResult(null); }} /> Xóa API key hiện tại khi lưu</label>}</AdminField>
        <div className="ui-field ui-field-full"><Button type="button" onClick={testLlmConnection} disabled={llmTestDisabled}>{llmTestBusy ? "Đang gửi hello…" : "Kiểm tra API key với model"}</Button>{llmConfigDirty && <p className="ui-field-helper">Đang dùng cấu hình trong form để kiểm tra; bấm Lưu sau khi kiểm tra thành công.</p>}{llmTestResult && <p role="status" className={llmTestResult.success ? "ui-setting-success" : "ui-field-error"}>{llmTestResult.message}</p>}</div>
      </div></CardContent></Card>

      <Card><CardHeader><CardTitle>Thanh toán & Cộng tác viên</CardTitle><CardDescription>Thiết lập webhook SePay và tỷ lệ hoa hồng cho cộng tác viên.</CardDescription></CardHeader><CardContent><div className="ui-form-grid"><AdminField id="admin-setting-sepay-secret" label="Khóa bảo mật webhook SePay" helper={`Khóa chỉ được gửi khi lưu và không hiển thị lại. Webhook: ${webhookUrl}`}><div className="ui-secret-control"><Input id="admin-setting-sepay-secret" type={showSecret ? "text" : "password"} autoComplete="new-password" minLength={16} placeholder={form.sepay_secret_saved ? "Để trống nếu không đổi khóa" : "Dán khóa HMAC từ SePay"} value={sepaySecretInput} onChange={(event) => setSepaySecretInput(event.target.value)} /><Button type="button" variant="outline" size="icon" onClick={() => setShowSecret((value) => !value)} aria-label={showSecret ? "Ẩn khóa bí mật SePay" : "Hiện khóa bí mật SePay"} aria-pressed={showSecret}>{showSecret ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</Button></div><p className="ui-setting-note" role="status">{form.sepay_configured ? "Nạp tự động đã được cấu hình." : "Chưa có khóa SePay. Nạp tự động đang tắt."}</p><Link className="ui-setting-link" to="/admin/banks">Cấu hình tài khoản ngân hàng nhận tiền</Link></AdminField><AdminField id="admin-setting-ctv-rate" label="Hoa hồng CTV (%)" helper="Phần trăm hoa hồng khi giới thiệu khách mua hàng."><Input id="admin-setting-ctv-rate" type="number" min="0" max="100" placeholder="Ví dụ: 10" value={form.ck_ctv ?? ""} onChange={(event) => set("ck_ctv", Number(event.target.value))} /></AdminField></div></CardContent></Card>
    </div>
  );
}
