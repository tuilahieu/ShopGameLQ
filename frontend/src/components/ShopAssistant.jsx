import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, MessageCircle, Send, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/api";
import SafeImage from "./SafeImage";
import { resolveMediaUrl } from "../utils/mediaUrl";
import "../shop-assistant.css";

const STARTER = {
  role: "assistant",
  kind: "starter",
  accounts: [],
};
const SUGGESTIONS = ["Tìm acc 200k", "Acc dưới 100k", "Acc đang sale"];
const DEFAULT_AVATAR_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-jXgFWFj2PRcDPCDeQSstvlzW_-DXWC7xVZQYgNsv5-8qgRb8wArhzynL&s=10";
const THREAD_STORAGE_KEY = "shop-assistant-thread";

function readStoredThread() {
  try {
    const value = JSON.parse(localStorage.getItem(THREAD_STORAGE_KEY) || "null");
    return typeof value?.id === "string" && typeof value?.token === "string" ? value : null;
  } catch { return null; }
}

function AssistantAvatar({ name, avatarUrl, small = false }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const src = resolveMediaUrl(avatarUrl);
  const initials = name.split(/\s+/u).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi-VN");
  return (
    <span className={`shop-assistant-avatar${small ? " is-small" : ""}`} aria-hidden="true">
      {failedUrl === src ? <b>{initials}</b> : <img src={src} alt="" width={small ? 28 : 42} height={small ? 28 : 42} loading="eager" onError={() => setFailedUrl(src)} />}
    </span>
  );
}

function AssistantMessageBody({ message, animate, onNavigate, onTextChange }) {
  const [visibleLength, setVisibleLength] = useState(() =>
    animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : message.text.length,
  );

  useEffect(() => {
    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let length = 0;
    let timer;
    const reveal = () => {
      length = Math.min(message.text.length, length + 1 + Math.floor(Math.random() * 3));
      setVisibleLength(length);
      onTextChange();
      if (length < message.text.length) timer = window.setTimeout(reveal, 8 + Math.floor(Math.random() * 17));
    };
    timer = window.setTimeout(reveal, 12);
    return () => window.clearInterval(timer);
  }, [animate, message.text, onTextChange]);

  const complete = visibleLength >= message.text.length;
  return (
    <>
      <p>{message.text.slice(0, visibleLength)}{!complete && <span className="shop-assistant-cursor" aria-hidden="true" />}</p>
      {complete && message.accounts?.length > 0 && (
        <div className="shop-assistant-results">
          {message.accounts.map((account) => (
            <Link to={`/account/${Number(account.id)}`} className="shop-assistant-result" key={account.id} onClick={onNavigate}>
              <SafeImage src={account.image} alt={`Ảnh ${account.title}`} width={72} height={60} loading="lazy" fallbackLabel="Ảnh acc" />
              <span className="shop-assistant-result-copy">
                <strong>{account.title}</strong>
                <small>{account.category}</small>
                <b>{Number(account.price).toLocaleString("vi-VN")}đ</b>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
      {complete && message.link?.href?.startsWith("/") && (
        <Link className="shop-assistant-more" to={message.link.href} onClick={onNavigate}>{message.link.label} <ArrowRight size={15} /></Link>
      )}
    </>
  );
}

export default function ShopAssistant({ profile }) {
  const assistantName = typeof profile?.name === "string" && profile.name.trim() ? profile.name.trim() : "Gia Linh";
  const avatarUrl = typeof profile?.avatar === "string" && profile.avatar.trim() ? profile.avatar.trim() : DEFAULT_AVATAR_URL;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([STARTER]);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [panelMounted, setPanelMounted] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("fallback");
  const [restoring, setRestoring] = useState(() => Boolean(readStoredThread()));
  const messagesRef = useRef(null);
  const rootRef = useRef(null);
  const threadRef = useRef(readStoredThread());
  const openRef = useRef(false);
  const closeTimerRef = useRef(null);
  const closeChat = useCallback(() => {
    openRef.current = false;
    setMessages((current) => current.some((item) => item.animate)
      ? current.map((item) => item.animate ? { ...item, animate: false } : item)
      : current);
    setOpen(false);
    window.clearTimeout(closeTimerRef.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPanelMounted(false);
    else closeTimerRef.current = window.setTimeout(() => setPanelMounted(false), 220);
  }, []);
  const openChat = () => {
    window.clearTimeout(closeTimerRef.current);
    openRef.current = true;
    setPanelMounted(true);
    setOpen(true);
  };
  const displayedMessages = messages.map((message) => message.kind === "starter"
    ? { ...message, text: `Chào bạn nhaa, mình là ${assistantName} đây! Bạn muốn tìm acc Liên Quân tầm bao nhiêu để mình xem giúp nè?` }
    : message);
  const scrollToLatest = useCallback(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    const saved = threadRef.current;
    if (!saved) return undefined;
    let active = true;
    api.get(`/assistant/thread/${encodeURIComponent(saved.id)}`, {
      cache: false,
      headers: { "X-Assistant-Thread-Token": saved.token },
    }).then((response) => {
      if (!active) return;
      const restored = response.data?.data?.messages;
      if (Array.isArray(restored) && restored.length) setMessages(restored);
    }).catch((error) => {
      if (!active || error.response?.status !== 404) return;
      threadRef.current = null;
      localStorage.removeItem(THREAD_STORAGE_KEY);
    }).finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/assistant/status", { cache: false }).then((response) => {
      const status = response.data?.data?.status;
      if (active && ["online", "offline", "fallback"].includes(status)) setAssistantStatus(status);
    }).catch(() => { if (active) setAssistantStatus("offline"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (open) scrollToLatest();
  }, [messages, open, busy, scrollToLatest]);

  useEffect(() => {
    document.body.classList.toggle("shop-assistant-open", panelMounted);
    return () => document.body.classList.remove("shop-assistant-open");
  }, [panelMounted]);

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeChat();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeChat]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) closeChat();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, closeChat]);

  async function send(message) {
    const text = message.trim();
    if (!text || busy || restoring) return;
    setMessages((current) => [...current, { role: "user", text }]);
    setInput("");
    const looksLikeSearch = /(?:acc|nick|tìm|tim|giá|gia|sale)|^\s*\d+(?:[.,]\d+)?\s*(?:k|tr|triệu|nghìn|ngàn|đ)?\s*$/iu.test(text);
    setBusyLabel(looksLikeSearch ? "Mình đang tìm cho bạn đây" : `${assistantName} đang suy nghĩ`);
    setBusy(true);
    try {
      const saved = threadRef.current;
      const response = await api.post("/assistant/chat", {
        message: text,
        ...(saved && { thread_id: saved.id }),
      }, saved ? { headers: { "X-Assistant-Thread-Token": saved.token } } : undefined);
      const answer = response.data?.data;
      if (["online", "offline", "fallback"].includes(answer?.assistant_status)) setAssistantStatus(answer.assistant_status);
      if (answer?.thread_id && answer?.thread_token) {
        threadRef.current = { id: answer.thread_id, token: answer.thread_token };
        localStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(threadRef.current));
      }
      setMessages((current) => [...current, {
        role: "assistant",
        animate: openRef.current,
        text: answer?.text || "Mình chưa hiểu ý bạn lắm á. Bạn nói lại giúp mình xíu nha.",
        accounts: Array.isArray(answer?.accounts)
          ? answer.accounts.filter((account) => Number.isSafeInteger(Number(account?.id)) && Number(account.id) > 0).slice(0, 4)
          : [],
        link: answer?.link,
      }]);
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.code === "THREAD_NOT_FOUND") {
        threadRef.current = null;
        localStorage.removeItem(THREAD_STORAGE_KEY);
      }
      setMessages((current) => [...current, {
        role: "assistant",
        animate: openRef.current,
        text: "Ui, mình đang bận một xíu mất rồi. Bạn xem kho acc trước hoặc nhắn lại sau giúp mình nhá.",
        accounts: [],
        link: { href: "/accounts", label: "Xem kho acc" },
      }]);
    } finally {
      setBusy(false);
      setBusyLabel("");
    }
  }

  return (
    <div ref={rootRef} className={`shop-assistant${open ? " is-open" : panelMounted ? " is-closing" : ""}`}>
      {panelMounted && (
        <section className="shop-assistant-panel" role="dialog" aria-modal="false" aria-labelledby="shop-assistant-title">
          <header className="shop-assistant-header">
            <AssistantAvatar name={assistantName} avatarUrl={avatarUrl} />
            <div className="shop-assistant-identity">
              <strong id="shop-assistant-title">{assistantName}</strong>
              {assistantStatus === "fallback" ? <span>Nhân viên tư vấn</span> : (
                <span className={`shop-assistant-presence is-${assistantStatus}`}>
                  <i aria-hidden="true" />
                  {assistantStatus === "online" ? "Đang hoạt động" : "Đang offline"}
                </span>
              )}
            </div>
            <button type="button" className="shop-assistant-close" onClick={closeChat} aria-label={`Đóng chat với ${assistantName}`}><X size={20} /></button>
          </header>
          <div ref={messagesRef} className="shop-assistant-messages" aria-live="polite" aria-relevant="additions text">
            {displayedMessages.map((message, index) => (
              <div className={`shop-assistant-message is-${message.role}`} key={index}>
                {message.role === "assistant" && <AssistantAvatar name={assistantName} avatarUrl={avatarUrl} small />}
                <div className="shop-assistant-message-content">
                  {message.role === "assistant"
                    ? <AssistantMessageBody message={message} animate={message.animate === true} onNavigate={closeChat} onTextChange={scrollToLatest} />
                    : <p>{message.text}</p>}
                </div>
              </div>
            ))}
            {(busy || restoring) && (
              <div className="shop-assistant-thinking" role="status" aria-live="polite">
                <AssistantAvatar name={assistantName} avatarUrl={avatarUrl} small />
                <div className="shop-assistant-thinking-bubble">
                  <span>{restoring ? "Đang tải cuộc trò chuyện" : busyLabel}</span>
                  <span className="shop-assistant-thinking-dots" aria-hidden="true"><i /><i /><i /></span>
                </div>
              </div>
            )}
          </div>
          <div className="shop-assistant-composer">
            <div className="shop-assistant-suggestions" aria-label="Câu hỏi gợi ý">
              {SUGGESTIONS.map((suggestion) => (
                <button type="button" key={suggestion} onClick={() => send(suggestion)} disabled={busy || restoring}>{suggestion}</button>
              ))}
            </div>
            <form className="shop-assistant-form" autoComplete="off" onSubmit={(event) => { event.preventDefault(); send(input); }}>
              <label className="sr-only" htmlFor="shop-assistant-input">Nhắn tin cho {assistantName}</label>
              <input id="shop-assistant-input" name="shop-assistant-message" value={input} onChange={(event) => setInput(event.target.value)} autoComplete="off" maxLength={500} placeholder={`Nhắn ${assistantName}, ví dụ: acc 200k`} />
              <button type="submit" disabled={busy || restoring || !input.trim()} aria-label="Gửi câu hỏi"><Send size={19} /></button>
            </form>
          </div>
        </section>
      )}
      {!panelMounted && <button type="button" className="shop-assistant-toggle" onClick={openChat} aria-expanded={false} aria-label={`Chat với AI - ${assistantName}`}>
        <MessageCircle size={21} aria-hidden="true" />
        <span>Chat với AI</span>
      </button>}
    </div>
  );
}
