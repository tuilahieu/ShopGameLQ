import { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, CreditCard, Eye, EyeOff, Globe2, KeyRound, LockKeyhole, Save, Settings2, ShieldCheck, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import SafeImage from "../../components/SafeImage";
import { AdminError, AdminField, AdminPageHeader } from "../../components/admin/AdminUi";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import { Textarea } from "../../components/ui/textarea";
import { notifyAdmin } from "../../utils/adminFeedback";
import { importImageUrl, uploadImageFile } from "../../utils/imageUpload";
import { utf8ByteLength } from "../../utils/browserCompat";

const MASKED_SECRET = "••••••••••••••••";
const MAX_LLM_FALLBACK_MODELS = 5;

function parseFallbackModels(value) {
  return value.split(/[\n,]+/u).map((model) => model.trim()).filter(Boolean);
}
const settingNavigation = [
  { id: "storefront", label: "Cửa hàng", description: "Nhận diện & liên hệ", icon: Globe2 },
  { id: "assistant", label: "Trợ lý AI", description: "Chatbot & LLM", icon: Bot },
  { id: "payments", label: "Thanh toán", description: "SePay & hoa hồng", icon: CreditCard },
  { id: "security", label: "Bảo mật", description: "Mật khẩu cấp 2", icon: LockKeyhole },
];

function SettingStatus({ configured, configuredLabel = "Đã cấu hình", emptyLabel = "Chưa cấu hình" }) {
  return <Badge variant={configured ? "success" : "secondary"} className="admin-setting-status"><span className="admin-setting-status-dot" aria-hidden="true" />{configured ? configuredLabel : emptyLabel}</Badge>;
}

function SettingSection({ id, icon: Icon, eyebrow, title, description, status, children, footer }) {
  return (
    <Card id={id} className="admin-setting-section">
      <CardHeader className="admin-setting-section-header">
        <div className="admin-setting-section-icon" aria-hidden="true"><Icon size={20} /></div>
        <div className="admin-setting-section-copy"><span>{eyebrow}</span><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div>
        {status}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

function AdminSettingSkeleton() {
  return (
    <div className="admin-setting-page admin-accounts-page admin-setting-skeleton" aria-busy="true" aria-label="Đang tải cấu hình hệ thống">
      <AdminPageHeader eyebrow="Hệ thống · Admin" title="Cấu hình hệ thống" description="Đang đồng bộ nhận diện cửa hàng, tích hợp và bảo mật…" />
      <div className="admin-setting-overview" aria-hidden="true">{[0, 1, 2, 3].map((item) => <div key={item}><Skeleton /><span><Skeleton /><Skeleton /></span></div>)}</div>
      <div className="admin-settings-layout" aria-hidden="true">
        <aside className="admin-settings-nav"><Skeleton />{[0, 1, 2, 3].map((item) => <Skeleton key={item} />)}</aside>
        <div className="admin-settings-content">{[0, 1, 2].map((item) => <Card key={item} className="admin-setting-section"><CardHeader className="admin-setting-section-header"><Skeleton /><div><Skeleton /><Skeleton /></div></CardHeader><CardContent className="ui-dashboard-loading"><Skeleton className="ui-skeleton-line" /><Skeleton className="ui-skeleton-line" /><Skeleton className="ui-skeleton-line" /></CardContent></Card>)}</div>
      </div>
    </div>
  );
}

function SecretField({ id, label, helper, saved, value, onChange, editing, onEditingChange, visible, onVisibleChange, placeholder, minLength, maxLength, children }) {
  function cancelReplacement() {
    onChange("");
    onVisibleChange(false);
    onEditingChange(false);
  }

  return (
    <AdminField id={id} label={label} helper={helper} className="ui-field-full admin-secret-field">
      {saved && !editing ? (
        <div className="ui-secret-control is-saved">
          <div className="admin-secret-masked-wrap"><KeyRound size={16} aria-hidden="true" /><Input id={id} className="admin-secret-masked" type="text" value={MASKED_SECRET} readOnly aria-label={`${label} đã được lưu và đang được che`} /></div>
          <Button type="button" variant="outline" onClick={() => onEditingChange(true)}>Thay khóa</Button>
        </div>
      ) : (
        <div className="ui-secret-control is-editing">
          <Input id={id} type={visible ? "text" : "password"} autoComplete="off" minLength={minLength} maxLength={maxLength} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
          <Button type="button" variant="outline" size="icon" onClick={() => onVisibleChange(!visible)} aria-label={visible ? `Ẩn ${label}` : `Hiện ${label}`} aria-pressed={visible}>{visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</Button>
          {saved && <Button type="button" variant="ghost" onClick={cancelReplacement}>Hủy</Button>}
        </div>
      )}
      <div className={`admin-secret-state ${saved ? "is-configured" : "is-empty"}`} role="status">
        {saved ? <CheckCircle2 size={15} aria-hidden="true" /> : <KeyRound size={15} aria-hidden="true" />}
        <span>{saved ? (editing ? "Nhập khóa mới rồi lưu để thay thế khóa hiện tại." : "Khóa đã được lưu an toàn và không được gửi lại về trình duyệt.") : "Chưa có khóa. Hãy nhập khóa để kích hoạt kết nối."}</span>
      </div>
      {children}
    </AdminField>
  );
}

function ImageUploadField({ label, fieldKey, value, onChange }) {
  const inputRef = useRef();
  const inputId = `admin-setting-${fieldKey}`;
  const [uploading, setUploading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(api, file);
      onChange(fieldKey, url);
      notifyAdmin("Đã tải ảnh lên", "success");
    } catch {
      notifyAdmin("Không thể tải ảnh lên.", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminField id={inputId} label={label} className="ui-field-full admin-setting-media-field">
      <div className="admin-setting-media-control">
        <div className="ui-image-preview">{value ? <SafeImage src={value} alt={`Xem trước ${label}`} width={214} height={120} fallbackLabel="Ảnh không tải được" /> : <div className="admin-setting-media-empty"><Upload size={18} aria-hidden="true" /><span>Chưa có ảnh</span></div>}</div>
        <div className="admin-setting-media-inputs">
          <Input id={inputId} type="text" inputMode="url" placeholder="Nhập URL ảnh hoặc tải file lên" value={value || ""} onChange={(event) => onChange(fieldKey, event.target.value)} />
          <label className={`ui-upload-trigger${uploading ? " is-disabled" : ""}`} htmlFor={`${inputId}-upload`}><Upload size={14} aria-hidden="true" /> {uploading ? "Đang tải…" : "Chọn ảnh"}<input ref={inputRef} id={`${inputId}-upload`} type="file" accept="image/*" autoComplete="off" onChange={handleFile} disabled={uploading} /></label>
        </div>
      </div>
    </AdminField>
  );
}

export default function AdminSetting() {
  const [activeSettingSection, setActiveSettingSection] = useState("storefront");
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sepaySecretInput, setSepaySecretInput] = useState("");
  const [showSepaySecret, setShowSepaySecret] = useState(false);
  const [editSepaySecret, setEditSepaySecret] = useState(false);
  const [llmKeyInput, setLlmKeyInput] = useState("");
  const [llmFallbackModelsInput, setLlmFallbackModelsInput] = useState("");
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [editLlmKey, setEditLlmKey] = useState(false);
  const [clearLlmKey, setClearLlmKey] = useState(false);
  const [llmConfigDirty, setLlmConfigDirty] = useState(false);
  const [llmTestBusy, setLlmTestBusy] = useState(false);
  const [llmTestResult, setLlmTestResult] = useState(null);
  const [securityForm, setSecurityForm] = useState({ currentPassword: "", oldSecondPassword: "", newSecondPassword: "", confirmPassword: "" });
  const [securityError, setSecurityError] = useState("");
  const [securityBusy, setSecurityBusy] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/admin/setting");
      const settings = res.data.data || {};
      setForm(settings);
      setLlmFallbackModelsInput(Array.isArray(settings.assistant_llm_fallback_models) ? settings.assistant_llm_fallback_models.join("\n") : "");
    }
    catch (error) { setLoadError(error.response?.data?.message || "Không thể tải cấu hình hệ thống."); }
    finally { setLoading(false); }
  }

  async function save() {
    if (saving) return;
    const fallbackModels = parseFallbackModels(llmFallbackModelsInput);
    if (fallbackModels.length > MAX_LLM_FALLBACK_MODELS) {
      notifyAdmin("Chỉ được cấu hình tối đa 5 model dự phòng.", "error");
      return;
    }
    setSaving(true);
    try {
      const settings = { ...form };
      delete settings.sepay_secret;
      delete settings.assistant_llm_api_key;
      delete settings.background;
      settings.assistant_llm_fallback_models = fallbackModels;
      const mediaFields = ["logo", "favicon", "banner", "assistant_avatar"];
      const localizedMedia = await Promise.all(mediaFields.map((field) => importImageUrl(api, settings[field])));
      mediaFields.forEach((field, index) => { settings[field] = localizedMedia[index]; });
      const res = await api.put("/admin/setting", { ...settings, ...(sepaySecretInput.trim() && { sepay_secret: sepaySecretInput.trim() }), ...(!clearLlmKey && llmKeyInput.trim() && { assistant_llm_api_key: llmKeyInput.trim() }), ...(clearLlmKey && { assistant_llm_clear_key: true }) });
      if (res.data?.data) {
        setForm(res.data.data);
        setLlmFallbackModelsInput(Array.isArray(res.data.data.assistant_llm_fallback_models) ? res.data.data.assistant_llm_fallback_models.join("\n") : "");
      }
      setSepaySecretInput(""); setShowSepaySecret(false); setEditSepaySecret(false);
      setLlmKeyInput(""); setShowLlmKey(false); setEditLlmKey(false); setClearLlmKey(false); setLlmConfigDirty(false); setLlmTestResult(null);
      notifyAdmin("Đã lưu cấu hình", "success");
    } catch (error) { notifyAdmin(error.response?.data?.message || "Không thể lưu cấu hình.", "error"); }
    finally { setSaving(false); }
  }

  function set(key, value) { setForm((previous) => ({ ...previous, [key]: value })); }

  async function testLlmConnection() {
    if (llmTestBusy) return;
    const fallbackModels = parseFallbackModels(llmFallbackModelsInput);
    if (fallbackModels.length > MAX_LLM_FALLBACK_MODELS) {
      setLlmTestResult({ success: false, message: "Chỉ được cấu hình tối đa 5 model dự phòng." });
      return;
    }
    setLlmTestBusy(true); setLlmTestResult(null);
    try {
      const res = await api.post("/admin/assistant/test-llm", { assistant_llm_provider: form.assistant_llm_provider || "none", assistant_llm_model: form.assistant_llm_model || "", assistant_llm_fallback_models: fallbackModels, assistant_llm_endpoint: form.assistant_llm_endpoint || "", ...(llmKeyInput.trim() && { assistant_llm_api_key: llmKeyInput.trim() }) });
      setLlmTestResult({ success: true, message: `Model ${res.data.data.model} trả lời: “${res.data.data.reply}” (${res.data.data.latency_ms} ms)` });
    } catch (error) { setLlmTestResult({ success: false, message: error.response?.data?.message || "Không thể kết nối tới model lúc này." }); }
    finally { setLlmTestBusy(false); }
  }

  async function changeSecondPassword(event) {
    event.preventDefault(); setSecurityError("");
    if (securityForm.newSecondPassword !== securityForm.confirmPassword) { setSecurityError("Hai lần nhập mật khẩu cấp 2 mới chưa khớp."); return; }
    if (Array.from(securityForm.newSecondPassword).length < 12 || utf8ByteLength(securityForm.newSecondPassword) > 72) { setSecurityError("Mật khẩu cấp 2 mới cần ít nhất 12 ký tự và tối đa 72 byte."); return; }
    setSecurityBusy(true);
    try {
      await api.post("/auth/admin-security/change", { currentPassword: securityForm.currentPassword, oldSecondPassword: securityForm.oldSecondPassword, newSecondPassword: securityForm.newSecondPassword });
      setSecurityForm({ currentPassword: "", oldSecondPassword: "", newSecondPassword: "", confirmPassword: "" });
      sessionStorage.removeItem("adminSession"); window.dispatchEvent(new Event("admin-session-expired"));
    } catch (error) { setSecurityError(error.response?.data?.message || "Không thể đổi mật khẩu cấp 2."); }
    finally { setSecurityBusy(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (loading || loadError) return undefined;

    const sections = settingNavigation
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length) return undefined;

    let frame = 0;
    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const activationLine = window.innerWidth <= 832 ? 150 : 112;
        let current = sections[0].id;

        sections.forEach((section) => {
          if (section.getBoundingClientRect().top <= activationLine) current = section.id;
        });

        setActiveSettingSection(current);
      });
    };

    const hashSection = window.location.hash.replace("#", "");
    if (settingNavigation.some(({ id }) => id === hashSection)) setActiveSettingSection(hashSection);
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [loading, loadError]);

  if (loading) return <AdminSettingSkeleton />;
  if (loadError) return <div className="admin-setting-page admin-accounts-page"><AdminPageHeader eyebrow="Hệ thống · Admin" title="Cấu hình hệ thống" description="Thiết lập website, thanh toán, bảo mật và trợ lý chatbot." /><AdminError message={loadError} onRetry={load} /></div>;

  const apiBase = new URL(api.defaults.baseURL, window.location.origin);
  const webhookUrl = new URL("payments/sepay/webhook", `${apiBase.href.replace(/\/?$/, "/")}`).href;
  const llmConfigured = Boolean(form.assistant_llm_key_saved && form.assistant_llm_provider !== "none");
  const sepayConfigured = Boolean(form.sepay_configured);
  const fallbackModelCount = parseFallbackModels(llmFallbackModelsInput).length;
  const fallbackModelsInvalid = fallbackModelCount > MAX_LLM_FALLBACK_MODELS;
  const llmTestDisabled = llmTestBusy || fallbackModelsInvalid || clearLlmKey || (!llmKeyInput.trim() && !form.assistant_llm_key_saved) || form.assistant_llm_provider === "none" || (form.assistant_llm_provider === "vilao" && !form.assistant_llm_model?.trim());

  return (
    <div className="admin-setting-page admin-accounts-page">
      <AdminPageHeader eyebrow="Hệ thống · Admin" title="Cấu hình hệ thống" description="Quản lý nhận diện cửa hàng, tích hợp và bảo mật tại một nơi. Khóa bí mật đã lưu luôn được che khỏi trình duyệt." />

      <div className="admin-setting-overview" aria-label="Tổng quan cấu hình">
        <div><Globe2 size={18} aria-hidden="true" /><span><small>Cửa hàng</small><strong>{form.ten_web || "Chưa đặt tên"}</strong></span></div>
        <div><Bot size={18} aria-hidden="true" /><span><small>Trợ lý AI</small><strong>{llmConfigured ? `${form.assistant_llm_provider} · đã kết nối` : "Chưa kết nối"}</strong></span></div>
        <div><CreditCard size={18} aria-hidden="true" /><span><small>Thanh toán SePay</small><strong>{sepayConfigured ? "Đang hoạt động" : "Chưa cấu hình"}</strong></span></div>
        <div><ShieldCheck size={18} aria-hidden="true" /><span><small>Bảo vệ secret</small><strong>Mã hóa · không hiển thị lại</strong></span></div>
      </div>

      <div className="admin-settings-layout">
        <aside className="admin-settings-nav" aria-label="Nhóm cấu hình">
          <div className="admin-settings-nav-heading"><Settings2 size={16} aria-hidden="true" /><span>Nhóm cài đặt</span></div>
          {settingNavigation.map(({ id, label, description, icon: Icon }) => <a key={id} href={`#${id}`} className={activeSettingSection === id ? "is-active" : undefined} aria-current={activeSettingSection === id ? "location" : undefined} onClick={() => setActiveSettingSection(id)}><Icon size={17} aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span></a>)}
          <div className="admin-settings-nav-save">
            <Button type="button" onClick={save} disabled={saving} aria-busy={saving}><Save size={16} aria-hidden="true" />{saving ? "Đang lưu…" : "Lưu thay đổi"}</Button>
          </div>
        </aside>

        <div className="admin-settings-content">
          <SettingSection id="storefront" icon={Globe2} eyebrow="Nhận diện" title="Cửa hàng & liên hệ" description="Các nội dung khách hàng nhìn thấy trên storefront." status={<SettingStatus configured={Boolean(form.ten_web)} configuredLabel="Đang hiển thị" />}>
            <div className="ui-form-grid">
              <AdminField id="admin-setting-site-name" label="Tên website"><Input id="admin-setting-site-name" placeholder="VD: ShopGameLiQi" value={form.ten_web || ""} onChange={(event) => set("ten_web", event.target.value)} /></AdminField>
              <AdminField id="admin-setting-email" label="Email liên hệ"><Input id="admin-setting-email" type="email" placeholder="admin@example.com" value={form.email || ""} onChange={(event) => set("email", event.target.value)} /></AdminField>
              <AdminField id="admin-setting-facebook" label="Facebook Admin"><Input id="admin-setting-facebook" type="url" placeholder="https://facebook.com/..." value={form.fb_admin || ""} onChange={(event) => set("fb_admin", event.target.value)} /></AdminField>
              <AdminField id="admin-setting-phone" label="Số điện thoại / Zalo"><Input id="admin-setting-phone" placeholder="0xxx xxx xxx" value={form.sdt_admin || ""} onChange={(event) => set("sdt_admin", event.target.value)} /></AdminField>
              <div className="admin-setting-media-grid ui-field-full"><ImageUploadField label="Logo website" fieldKey="logo" value={form.logo} onChange={set} /><ImageUploadField label="Favicon" fieldKey="favicon" value={form.favicon} onChange={set} /><ImageUploadField label="Banner trang chủ" fieldKey="banner" value={form.banner} onChange={set} /></div>
              <AdminField id="admin-setting-home-notice" label="Thông báo trang chủ" className="ui-field-full" helper="Nội dung ngắn hiển thị nổi bật với khách hàng."><Textarea id="admin-setting-home-notice" rows={5} placeholder="Nhập nội dung thông báo…" value={form.thongbao || ""} onChange={(event) => set("thongbao", event.target.value)} /></AdminField>
            </div>
          </SettingSection>

          <SettingSection id="assistant" icon={Bot} eyebrow="Tích hợp" title="Trợ lý AI" description="Thiết lập danh tính chatbot và kết nối tới nhà cung cấp LLM." status={<SettingStatus configured={llmConfigured} configuredLabel="Đã kết nối" />}>
            <div className="ui-form-grid">
              <AdminField id="admin-setting-assistant-name" label="Tên chatbot" helper="2–40 ký tự; chỉ dùng chữ, số và dấu cách."><Input id="admin-setting-assistant-name" maxLength={40} placeholder="Gia Linh" value={form.assistant_name || ""} onChange={(event) => set("assistant_name", event.target.value)} /></AdminField>
              <ImageUploadField label="Avatar chatbot" fieldKey="assistant_avatar" value={form.assistant_avatar} onChange={set} />
              <AdminField id="admin-setting-llm-provider" label="Nhà cung cấp LLM"><Select id="admin-setting-llm-provider" value={form.assistant_llm_provider || "none"} onChange={(event) => { setForm((previous) => ({ ...previous, assistant_llm_provider: event.target.value, assistant_llm_model: "" })); setLlmFallbackModelsInput(""); setLlmConfigDirty(true); setLlmTestResult(null); }}><option value="none">Chưa chọn</option><option value="gemini">Gemini</option><option value="vilao">VILAO</option></Select></AdminField>
              <AdminField id="admin-setting-llm-model" label="Mã model" helper="Gemini để trống sẽ dùng model mặc định."><Input id="admin-setting-llm-model" maxLength={120} placeholder={form.assistant_llm_provider === "vilao" ? "Model hoặc alias ViLao" : "Model Gemini"} value={form.assistant_llm_model || ""} onChange={(event) => { set("assistant_llm_model", event.target.value); setLlmConfigDirty(true); setLlmTestResult(null); }} /></AdminField>
              <AdminField id="admin-setting-llm-fallback-models" label="Model dự phòng" className="ui-field-full" helper={`Mỗi dòng một model, tối đa 5. Đang cấu hình ${fallbackModelCount}/5; hệ thống thử từ trên xuống khi model trước lỗi hoặc không trả nội dung.`}><Textarea id="admin-setting-llm-fallback-models" rows={5} maxLength={604} aria-invalid={fallbackModelsInvalid} aria-describedby={fallbackModelsInvalid ? "admin-setting-llm-fallback-models-error" : undefined} placeholder={"model-du-phong-1\nmodel-du-phong-2"} value={llmFallbackModelsInput} onChange={(event) => { setLlmFallbackModelsInput(event.target.value); setLlmConfigDirty(true); setLlmTestResult(null); }} />{fallbackModelsInvalid && <p id="admin-setting-llm-fallback-models-error" className="ui-field-error" role="alert">Xóa bớt {fallbackModelCount - MAX_LLM_FALLBACK_MODELS} model để còn tối đa 5.</p>}</AdminField>
              {form.assistant_llm_provider === "vilao" && <AdminField id="admin-setting-llm-endpoint" label="Endpoint ViLao" className="ui-field-full" helper="Dùng URL endpoint /v1 trong trang API Keys của ViLao."><Input id="admin-setting-llm-endpoint" type="url" maxLength={255} placeholder="https://api.vilao.ai/v1" value={form.assistant_llm_endpoint || ""} onChange={(event) => { set("assistant_llm_endpoint", event.target.value); setLlmConfigDirty(true); setLlmTestResult(null); }} /></AdminField>}
              <SecretField id="admin-setting-llm-key" label="API key LLM" helper="Key mới chỉ được gửi khi bạn lưu hoặc kiểm tra kết nối." saved={Boolean(form.assistant_llm_key_saved)} value={llmKeyInput} onChange={(value) => { setLlmKeyInput(value); setLlmConfigDirty(true); setLlmTestResult(null); }} editing={editLlmKey} onEditingChange={setEditLlmKey} visible={showLlmKey} onVisibleChange={setShowLlmKey} placeholder="Dán API key mới" minLength={16} maxLength={4096}>
                {form.assistant_llm_key_saved && <label className="ui-checkbox-label"><Checkbox checked={clearLlmKey} onChange={(event) => { setClearLlmKey(event.target.checked); setLlmKeyInput(""); setEditLlmKey(false); setLlmConfigDirty(true); setLlmTestResult(null); }} /> Xóa API key hiện tại khi lưu</label>}
              </SecretField>
              <div className="admin-setting-test-row ui-field-full"><div><strong>Kiểm tra kết nối</strong><span>Gửi một lời chào ngắn để xác nhận provider, model và key hoạt động.</span></div><Button type="button" variant="outline" onClick={testLlmConnection} disabled={llmTestDisabled}>{llmTestBusy ? "Đang kiểm tra…" : "Kiểm tra LLM"}</Button></div>
              {llmConfigDirty && <p className="ui-field-helper ui-field-full">Đang kiểm tra bằng dữ liệu trên form. Hãy lưu sau khi kết nối thành công.</p>}
              {llmTestResult && <p role="status" className={`${llmTestResult.success ? "ui-setting-success" : "ui-field-error"} ui-field-full`}>{llmTestResult.message}</p>}
            </div>
          </SettingSection>

          <SettingSection id="payments" icon={CreditCard} eyebrow="Tích hợp" title="Thanh toán & cộng tác viên" description="Quản lý khóa webhook SePay và chính sách hoa hồng." status={<SettingStatus configured={sepayConfigured} configuredLabel="SePay hoạt động" />}>
            <div className="ui-form-grid">
              <SecretField id="admin-setting-sepay-secret" label="Khóa bảo mật webhook SePay" helper="Khóa được mã hóa khi lưu và không bao giờ hiển thị lại." saved={sepayConfigured} value={sepaySecretInput} onChange={setSepaySecretInput} editing={editSepaySecret} onEditingChange={setEditSepaySecret} visible={showSepaySecret} onVisibleChange={setShowSepaySecret} placeholder="Dán khóa HMAC mới từ SePay" minLength={16} maxLength={2048} />
              <AdminField id="admin-setting-ctv-rate" label="Hoa hồng CTV (%)" helper="Phần trăm hoa hồng khi giới thiệu khách mua hàng."><Input id="admin-setting-ctv-rate" type="number" min="0" max="100" placeholder="Ví dụ: 10" value={form.ck_ctv ?? ""} onChange={(event) => set("ck_ctv", Number(event.target.value))} /></AdminField>
              <div className="admin-setting-webhook ui-field-full"><div><span>Webhook nhận giao dịch</span><code>{webhookUrl}</code></div><Link className="ui-setting-link" to="/admin/banks">Cấu hình tài khoản ngân hàng</Link></div>
            </div>
          </SettingSection>

          <SettingSection id="security" icon={LockKeyhole} eyebrow="Tài khoản" title="Bảo mật quản trị viên" description="Đổi mật khẩu cấp 2. Phiên xác minh hiện tại sẽ kết thúc sau khi đổi." status={<Badge variant="outline" className="admin-setting-status"><ShieldCheck size={13} aria-hidden="true" /> Bảo vệ 2 lớp</Badge>} footer={<Button type="submit" form="admin-security-form" disabled={securityBusy}>{securityBusy ? "Đang đổi…" : "Đổi mật khẩu cấp 2"}</Button>}>
            <form id="admin-security-form" onSubmit={changeSecondPassword}><div className="ui-form-grid">
              <AdminField id="security-primary-password" label="Mật khẩu đăng nhập hiện tại" required><Input id="security-primary-password" type="password" autoComplete="off" value={securityForm.currentPassword} onChange={(event) => setSecurityForm({ ...securityForm, currentPassword: event.target.value })} required /></AdminField>
              <AdminField id="security-old-second" label="Mật khẩu cấp 2 hiện tại" required><Input id="security-old-second" type="password" autoComplete="off" value={securityForm.oldSecondPassword} onChange={(event) => setSecurityForm({ ...securityForm, oldSecondPassword: event.target.value })} required /></AdminField>
              <AdminField id="security-new-second" label="Mật khẩu cấp 2 mới" required helper="Tối thiểu 12 ký tự, tối đa 72 byte."><Input id="security-new-second" type="password" autoComplete="off" minLength={12} maxLength={72} value={securityForm.newSecondPassword} onChange={(event) => setSecurityForm({ ...securityForm, newSecondPassword: event.target.value })} required /></AdminField>
              <AdminField id="security-confirm-second" label="Nhập lại mật khẩu cấp 2 mới" required><Input id="security-confirm-second" type="password" autoComplete="off" minLength={12} maxLength={72} value={securityForm.confirmPassword} onChange={(event) => setSecurityForm({ ...securityForm, confirmPassword: event.target.value })} required /></AdminField>
              {securityError && <p className="ui-field-error ui-field-full" role="alert">{securityError}</p>}
            </div></form>
          </SettingSection>
        </div>
      </div>
    </div>
  );
}
