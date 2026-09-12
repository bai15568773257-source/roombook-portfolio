/* Public, static, read-only preview. No network API is called by this adapter. */
(() => {
  "use strict";

  const READ_ONLY = "閲覧専用デモです。入力内容は保存・送信されません。実在する社員データは使用していません。";
  const API_VERSION = "20260727-api-report-profile-v27";
  const dayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type) => dayParts.find((item) => item.type === type).value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const dayAt = (offset) => {
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  };

  // These records are authored examples, not copies or anonymizations of employees.
  const users = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    name: index === 0 ? "デモ利用者" : `サンプル利用者 ${String.fromCharCode(64 + index)}`,
    email: index === 0 ? "visitor@example.test" : `sample${index}@example.test`,
    department: ["サンプル企画", "サンプル開発", "サンプルサポート"][index % 3],
    role: "user", must_change_password: false, is_active: true, avatar_data_url: null,
  }));
  const rooms = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1, name: `Room ${String.fromCharCode(65 + index)}`, display_order: index + 1,
  }));
  const reservations = [];

  function booking(roomId, offset, start, end, title, ownerId, status = "approved", reason = null) {
    const date = dayAt(offset);
    const owner = users[ownerId - 1];
    const attendees = [users[ownerId % users.length], users[(ownerId + 1) % users.length]];
    reservations.push({
      id: reservations.length + 1, room_id: roomId, room_name: rooms[roomId - 1].name,
      user_id: ownerId, user_name: owner.name, user_email: owner.email,
      start_at: `${date}T${start}:00`, end_at: `${date}T${end}:00`, date,
      start_time: start, end_time: end, purpose: title, title,
      department: owner.department, reserver_name: owner.name,
      participant_count: attendees.length + 1,
      notes: "画面確認用の架空の会議です。実在する人物・組織とは関係ありません。",
      status, request_reason: reason, admin_note: null,
      approval_required: reason !== null, can_delete: false,
      attendees: attendees.map((user) => ({ id: user.id, user_id: user.id, name: user.name, email: user.email })),
    });
  }

  booking(1, 0, "09:00", "10:00", "サンプル：朝の進捗共有", 1);
  booking(2, 0, "10:30", "12:00", "サンプル：企画レビュー", 2);
  booking(3, 0, "13:00", "14:00", "サンプル：仕様の確認", 3);
  booking(1, 0, "14:30", "15:30", "サンプル：チーム定例", 1);
  booking(4, 0, "16:00", "17:00", "サンプル：振り返り", 5);
  booking(5, 0, "17:00", "19:00", "サンプル：承認待ちの申請", 1, "pending", "デモ用：長時間の検討会を申請。" );
  booking(6, 1, "10:00", "11:00", "サンプル：週次ミーティング", 1);
  for (const offset of [-3, -2, -1, 1, 2, 3, 5, 7, 10, 14]) {
    booking(((offset % 6) + 6) % 6 + 1, offset, "13:00", "14:00", "サンプル：プロジェクト相談", ((offset % 5) + 5) % 5 + 1);
  }

  const messages = [{
    id: 1, sender_name: "デモのお知らせ", recipient_user_id: 1,
    recipient_name: users[0].name, title: "一般ユーザーの公開デモへようこそ",
    body: "ログインせずにダッシュボード・予約フォーム・タイムライン・カレンダーをご覧いただけます。表示はすべて架空データです。保存やメール送信は行いません。",
    created_at: `${today}T08:30:00`, is_read: true,
  }];
  const json = (status, body) => new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

  // Deliberately replace fetch without retaining or invoking the native fetch.
  // Unknown reads, cross-origin requests and every mutation fail closed.
  window.fetch = async (input, options = {}) => {
    let requestURL;
    try {
      requestURL = new URL(typeof input === "string" || input instanceof URL ? input : input.url, window.location.href);
    } catch {
      return json(400, { detail: "プレビューで扱えないリクエストです。" });
    }
    if (requestURL.origin !== window.location.origin) {
      return json(403, { detail: "このプレビューは外部サービスへ接続しません。" });
    }
    const path = requestURL.pathname;
    const method = String(options.method || (typeof input === "object" && input.method) || "GET").toUpperCase();
    if (path === "/api/admin" || path.startsWith("/api/admin/")) {
      return json(403, { detail: "一般ユーザー向けプレビューのため、管理者機能は提供していません。" });
    }
    if (method !== "GET") return json(405, { detail: READ_ONLY });
    switch (path) {
      case "/api/auth/me": return json(200, { user: users[0] });
      case "/api/version": return json(200, { version: API_VERSION, demo: true });
      case "/api/health": return json(200, { ok: true, timezone: "Asia/Tokyo", demo: true });
      case "/api/rooms": return json(200, rooms);
      case "/api/users/directory": return json(200, users.map(({ id, name, email }) => ({ id, name, email })));
      case "/api/messages": return json(200, messages);
      case "/api/calendar/holidays": return json(200, []);
      case "/api/reservations": {
        const start = requestURL.searchParams.get("start") || "0000-01-01";
        const end = requestURL.searchParams.get("end") || "9999-12-31";
        return json(200, reservations.filter((item) => item.date >= start && item.date < end));
      }
      default: return json(404, { detail: "このAPIは公開デモでは提供していません。実環境には接続しません。" });
    }
  };

  let noticeTimeout;
  function explainReadOnly() {
    const notice = document.getElementById("portfolio-preview-notice");
    if (!notice) return;
    notice.textContent = READ_ONLY;
    notice.hidden = false;
    clearTimeout(noticeTimeout);
    noticeTimeout = setTimeout(() => { notice.hidden = true; }, 6000);
  }

  // Keep the source app's expected DOM nodes but make account and admin flows
  // unavailable in the generated preview. Its normal user-role guards also apply.
  const hiddenFlows = [
    "loginView", "forcePasswordView", "passwordDialog", "forgotPasswordDialog",
    "logoutConfirmModal", "profileModal", "adminSection", "adminSidebarNav",
    "adminMessageComposer", "adminSentMessageSection", "userEditorModal",
  ];
  for (const id of hiddenFlows) {
    const element = document.getElementById(id);
    if (element) {
      element.hidden = true;
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
      element.querySelectorAll("input, select, textarea, button").forEach((control) => { control.disabled = true; });
    }
  }
  const profileLabel = document.getElementById("profileButton");
  if (profileLabel) {
    profileLabel.setAttribute("aria-label", "架空の一般ユーザー・閲覧専用");
    profileLabel.tabIndex = -1;
  }
  const blockedControls = "#logoutButton, #profileButton, #headerProfileButton, #profilePasswordButton, #openPasswordDialogButton, #openForgotPasswordDialogButton, #confirmLogoutButton, #forceLogoutButton, #reservationSubmitButton, [data-detail-delete], [data-delete-reservation], #confirmReservationDeleteButton";
  document.addEventListener("click", (event) => {
    if (event.target.closest(blockedControls)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      explainReadOnly();
    }
  }, true);
  document.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    explainReadOnly();
  }, true);
})();
