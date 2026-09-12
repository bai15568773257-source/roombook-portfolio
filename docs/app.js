const STANDARD_RESERVATION_MINUTES = 90;
const MIN_RESERVATION_MINUTES = 30;
const MAX_REQUEST_MINUTES = 600;
const MAX_AVATAR_UPLOAD_BYTES = 5 * 1024 * 1024;
const AVATAR_RENDER_SIZE = 512;
const AVATAR_CONTENT_RATIO = 0.9;
const MAX_AVATAR_DATA_URL_LENGTH = 380_000;
const BUSINESS_START_TIME = "09:00";
const BUSINESS_END_TIME = "19:00";
const EXPECTED_API_VERSION = "20260727-api-report-profile-v27";
const PROFILE_API_UNAVAILABLE_VERSIONS = new Set([
  "20260727-modern-dark-user-delete-v21",
  "20260727-user-delete-theme-v21",
]);
const BUSINESS_DAY_MINUTES = timeToMinutes(BUSINESS_END_TIME) - timeToMinutes(BUSINESS_START_TIME);

const ROOM_COLORS = {
  "Room A": "#2563eb",
  "Room B": "#db2777",
  "Room C": "#f97316",
  "Room D": "#ffffff",
  "Room E": "#16a34a",
  "Room F": "#6b7280",
};

const DEFAULT_JAPAN_HOLIDAYS = {
  "2026-01-01": "元日",
  "2026-01-12": "成人の日",
  "2026-02-11": "建国記念の日",
  "2026-02-23": "天皇誕生日",
  "2026-03-20": "春分の日",
  "2026-04-29": "昭和の日",
  "2026-05-03": "憲法記念日",
  "2026-05-04": "みどりの日",
  "2026-05-05": "こどもの日",
  "2026-05-06": "休日",
  "2026-07-20": "海の日",
  "2026-08-11": "山の日",
  "2026-09-21": "敬老の日",
  "2026-09-22": "休日",
  "2026-09-23": "秋分の日",
  "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日",
  "2026-11-23": "勤労感謝の日",
  "2027-01-01": "元日",
  "2027-01-11": "成人の日",
  "2027-02-11": "建国記念の日",
  "2027-02-23": "天皇誕生日",
  "2027-03-21": "春分の日",
  "2027-03-22": "休日",
  "2027-04-29": "昭和の日",
  "2027-05-03": "憲法記念日",
  "2027-05-04": "みどりの日",
  "2027-05-05": "こどもの日",
  "2027-07-19": "海の日",
  "2027-08-11": "山の日",
  "2027-09-20": "敬老の日",
  "2027-09-23": "秋分の日",
  "2027-10-11": "スポーツの日",
  "2027-11-03": "文化の日",
  "2027-11-23": "勤労感謝の日",
};

const STATUS_LABELS = {
  approved: "承認済み",
  pending: "承認待ち",
  rejected: "却下",
  ended: "終了",
};

const state = {
  user: null,
  rooms: [],
  users: [],
  directoryUsers: [],
  reservations: [],
  calendarReservations: [],
  adminReservations: [],
  auditLogs: [],
  messages: [],
  sentMessages: [],
  apiVersion: "",
  selectedAttendeeIds: new Set(),
  holidays: { ...DEFAULT_JAPAN_HOLIDAYS },
  viewMode: "day",
  adminView: "overview",
  adminReservationFilter: "all",
  auditFilter: "all",
  auditSearch: "",
  userSearch: "",
  calendarRoomFilter: "all",
  editingUserId: null,
  deletingUserId: null,
  reservationDeleteRequest: null,
  profileAvatarDataUrl: null,
  selectedDate: today(),
  calendarMonth: `${today().slice(0, 7)}-01`,
};

const els = {
  loginView: document.querySelector("#loginView"),
  themeMenuButton: document.querySelector("#themeMenuButton"),
  themeMenu: document.querySelector("#themeMenu"),
  themeMenuIcon: document.querySelector("#themeMenuIcon"),
  themeMenuLabel: document.querySelector("#themeMenuLabel"),
  themeSystemButton: document.querySelector("#themeSystemButton"),
  themeSystemDetail: document.querySelector("#themeSystemDetail"),
  themeModeButtons: [...document.querySelectorAll("[data-theme-mode]")],
  forcePasswordView: document.querySelector("#forcePasswordView"),
  appView: document.querySelector("#appView"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  forceUserEmail: document.querySelector("#forceUserEmail"),
  forcePasswordForm: document.querySelector("#forcePasswordForm"),
  forceNewPasswordInput: document.querySelector("#forceNewPasswordInput"),
  forceConfirmPasswordInput: document.querySelector("#forceConfirmPasswordInput"),
  forcePasswordMessage: document.querySelector("#forcePasswordMessage"),
  forceLogoutButton: document.querySelector("#forceLogoutButton"),
  logoutButton: document.querySelector("#logoutButton"),
  profileButton: document.querySelector("#profileButton"),
  headerProfileButton: document.querySelector("#headerProfileButton"),
  currentUserAvatar: document.querySelector("#currentUserAvatar"),
  headerProfileAvatar: document.querySelector("#headerProfileAvatar"),
  currentUserName: document.querySelector("#currentUserName"),
  currentUserEmail: document.querySelector("#currentUserEmail"),
  messageCenterButton: document.querySelector("#messageCenterButton"),
  messageUnreadBadge: document.querySelector("#messageUnreadBadge"),
  messageDrawer: document.querySelector("#messageDrawer"),
  messageDrawerBackdrop: document.querySelector("#messageDrawerBackdrop"),
  closeMessageDrawerButton: document.querySelector("#closeMessageDrawerButton"),
  messageDrawerSummary: document.querySelector("#messageDrawerSummary"),
  messageInboxCount: document.querySelector("#messageInboxCount"),
  messageInboxList: document.querySelector("#messageInboxList"),
  markAllMessagesReadButton: document.querySelector("#markAllMessagesReadButton"),
  adminMessageComposer: document.querySelector("#adminMessageComposer"),
  adminMessageForm: document.querySelector("#adminMessageForm"),
  messageRecipientSelect: document.querySelector("#messageRecipientSelect"),
  messageTitleInput: document.querySelector("#messageTitleInput"),
  messageBodyInput: document.querySelector("#messageBodyInput"),
  adminMessageFormMessage: document.querySelector("#adminMessageFormMessage"),
  sendAdminMessageButton: document.querySelector("#sendAdminMessageButton"),
  adminSentMessageSection: document.querySelector("#adminSentMessageSection"),
  adminSentMessageList: document.querySelector("#adminSentMessageList"),
  profileModal: document.querySelector("#profileModal"),
  closeProfileButton: document.querySelector("#closeProfileButton"),
  profileDialogAvatar: document.querySelector("#profileDialogAvatar"),
  profileAvatarButton: document.querySelector("#profileAvatarButton"),
  profileAvatarInput: document.querySelector("#profileAvatarInput"),
  profileAvatarSelectButton: document.querySelector("#profileAvatarSelectButton"),
  profileAvatarRemoveButton: document.querySelector("#profileAvatarRemoveButton"),
  profileForm: document.querySelector("#profileForm"),
  profileNameInput: document.querySelector("#profileNameInput"),
  profileEmailInput: document.querySelector("#profileEmailInput"),
  profileDepartmentInput: document.querySelector("#profileDepartmentInput"),
  profileRoleInput: document.querySelector("#profileRoleInput"),
  profileMessage: document.querySelector("#profileMessage"),
  profilePasswordButton: document.querySelector("#profilePasswordButton"),
  profileSubmitButton: document.querySelector("#profileSubmitButton"),
  logoutConfirmModal: document.querySelector("#logoutConfirmModal"),
  closeLogoutConfirmButton: document.querySelector("#closeLogoutConfirmButton"),
  cancelLogoutButton: document.querySelector("#cancelLogoutButton"),
  confirmLogoutButton: document.querySelector("#confirmLogoutButton"),
  pageTitle: document.querySelector("#pageTitle"),
  appPageDate: document.querySelector("#appPageDate"),
  dashboardNavButton: document.querySelector("#dashboardNavButton"),
  quickReservationButton: document.querySelector("#quickReservationButton"),
  dashboardSection: document.querySelector("#dashboardSection"),
  dashboardSummary: document.querySelector("#dashboardSummary"),
  dashboardFloorOverview: document.querySelector("#dashboardFloorOverview"),
  dashboardTodayAgenda: document.querySelector("#dashboardTodayAgenda"),
  dashboardAgendaTitle: document.querySelector("#dashboardAgendaTitle"),
  dashboardAgendaCaption: document.querySelector("#dashboardAgendaCaption"),
  dashboardPendingPanel: document.querySelector("#dashboardPendingPanel"),
  dashboardPendingTitle: document.querySelector("#dashboardPendingTitle"),
  dashboardPendingCaption: document.querySelector("#dashboardPendingCaption"),
  dashboardPendingList: document.querySelector("#dashboardPendingList"),
  adminSidebarNav: document.querySelector("#adminSidebarNav"),
  sidebarPendingBadge: document.querySelector("#sidebarPendingBadge"),
  sidebarAdminButtons: document.querySelectorAll("[data-admin-side-view]"),
  reservationAnchorButtons: document.querySelectorAll("[data-reservation-anchor]"),
  selectedDateLabel: document.querySelector("#selectedDateLabel"),
  titleInput: document.querySelector("#titleInput"),
  departmentInput: document.querySelector("#departmentInput"),
  reserverNameInput: document.querySelector("#reserverNameInput"),
  roomSelect: document.querySelector("#roomSelect"),
  roomChoiceGrid: document.querySelector("#roomChoiceGrid"),
  reservationAvailabilityCaption: document.querySelector("#reservationAvailabilityCaption"),
  reservationAvailabilityList: document.querySelector("#reservationAvailabilityList"),
  dateInput: document.querySelector("#dateInput"),
  calendarHint: document.querySelector("#calendarHint"),
  startTimeSelect: document.querySelector("#startTimeSelect"),
  endTimeSelect: document.querySelector("#endTimeSelect"),
  participantCountInput: document.querySelector("#participantCountInput"),
  attendeeSearchInput: document.querySelector("#attendeeSearchInput"),
  selectedAttendeeChips: document.querySelector("#selectedAttendeeChips"),
  attendeeList: document.querySelector("#attendeeList"),
  attendeeCountText: document.querySelector("#attendeeCountText"),
  recurrenceSelect: document.querySelector("#recurrenceSelect"),
  recurrenceCountSelect: document.querySelector("#recurrenceCountSelect"),
  recurrenceHint: document.querySelector("#recurrenceHint"),
  notesInput: document.querySelector("#notesInput"),
  requestReasonField: document.querySelector("#requestReasonField"),
  approvalStatusText: document.querySelector("#approvalStatusText"),
  specialRequestToggle: document.querySelector("#specialRequestToggle"),
  specialRequestDetails: document.querySelector("#specialRequestDetails"),
  specialEndTimeField: document.querySelector("#specialEndTimeField"),
  specialEndTimeSelect: document.querySelector("#specialEndTimeSelect"),
  requestSummary: document.querySelector("#requestSummary"),
  requestConfirmInput: document.querySelector("#requestConfirmInput"),
  requestReasonInput: document.querySelector("#requestReasonInput"),
  durationHint: document.querySelector("#durationHint"),
  reservationForm: document.querySelector("#reservationForm"),
  reservationSubmitButton: document.querySelector("#reservationSubmitButton"),
  reservationLiveSummary: document.querySelector("#reservationLiveSummary"),
  passwordForm: document.querySelector("#passwordForm"),
  passwordDialog: document.querySelector("#passwordDialog"),
  openPasswordDialogButton: document.querySelector("#openPasswordDialogButton"),
  closePasswordDialogButton: document.querySelector("#closePasswordDialogButton"),
  passwordEmailInput: document.querySelector("#passwordEmailInput"),
  currentPasswordInput: document.querySelector("#currentPasswordInput"),
  newPasswordInput: document.querySelector("#newPasswordInput"),
  confirmPasswordInput: document.querySelector("#confirmPasswordInput"),
  passwordMessage: document.querySelector("#passwordMessage"),
  forgotPasswordForm: document.querySelector("#forgotPasswordForm"),
  forgotPasswordDialog: document.querySelector("#forgotPasswordDialog"),
  openForgotPasswordDialogButton: document.querySelector("#openForgotPasswordDialogButton"),
  closeForgotPasswordDialogButton: document.querySelector("#closeForgotPasswordDialogButton"),
  forgotEmailInput: document.querySelector("#forgotEmailInput"),
  forgotSendCodeButton: document.querySelector("#forgotSendCodeButton"),
  resetCodeInput: document.querySelector("#resetCodeInput"),
  resetNewPasswordInput: document.querySelector("#resetNewPasswordInput"),
  resetConfirmPasswordInput: document.querySelector("#resetConfirmPasswordInput"),
  forgotPasswordMessage: document.querySelector("#forgotPasswordMessage"),
  reservationMessage: document.querySelector("#reservationMessage"),
  schedule: document.querySelector("#schedule"),
  specialRequestStatus: document.querySelector("#specialRequestStatus"),
  floorOverview: document.querySelector("#floorOverview"),
  todayAgenda: document.querySelector("#todayAgenda"),
  userNotifications: document.querySelector("#userNotifications"),
  periodLabel: document.querySelector("#periodLabel"),
  todayButton: document.querySelector("#todayButton"),
  weekButton: document.querySelector("#weekButton"),
  timelineNavButton: document.querySelector("#timelineNavButton"),
  calendarNavButton: document.querySelector("#calendarNavButton"),
  reservationTabButton: document.querySelector("#reservationTabButton"),
  reservationSection: document.querySelector("#reservationSection"),
  timelineSection: document.querySelector("#timelineSection"),
  timelineViewDate: document.querySelector("#timelineViewDate"),
  timelineViewSchedule: document.querySelector("#timelineViewSchedule"),
  timelineTodayButton: document.querySelector("#timelineTodayButton"),
  timelinePrevButton: document.querySelector("#timelinePrevButton"),
  timelineNextButton: document.querySelector("#timelineNextButton"),
  calendarSection: document.querySelector("#calendarSection"),
  calendarMonthLabel: document.querySelector("#calendarMonthLabel"),
  calendarRoomFilters: document.querySelector("#calendarRoomFilters"),
  calendarMonthGrid: document.querySelector("#calendarMonthGrid"),
  calendarSelectedDateLabel: document.querySelector("#calendarSelectedDateLabel"),
  calendarSelectedDateCount: document.querySelector("#calendarSelectedDateCount"),
  calendarSelectedAgenda: document.querySelector("#calendarSelectedAgenda"),
  calendarTodayButton: document.querySelector("#calendarTodayButton"),
  calendarPrevButton: document.querySelector("#calendarPrevButton"),
  calendarNextButton: document.querySelector("#calendarNextButton"),
  adminTabButton: document.querySelector("#adminTabButton"),
  adminSection: document.querySelector("#adminSection"),
  adminMenuButtons: document.querySelectorAll("[data-admin-view]"),
  adminPanelViews: document.querySelectorAll("[data-admin-panel]"),
  adminNavPendingCount: document.querySelector("#adminNavPendingCount"),
  adminNavReservationCount: document.querySelector("#adminNavReservationCount"),
  adminNavUserCount: document.querySelector("#adminNavUserCount"),
  adminSummary: document.querySelector("#adminSummary"),
  adminFloorOverview: document.querySelector("#adminFloorOverview"),
  adminTodayAgenda: document.querySelector("#adminTodayAgenda"),
  mailTestButton: document.querySelector("#mailTestButton"),
  mailTestMessage: document.querySelector("#mailTestMessage"),
  reportDateInput: document.querySelector("#reportDateInput"),
  dailyReportButton: document.querySelector("#dailyReportButton"),
  weeklyReportButton: document.querySelector("#weeklyReportButton"),
  reportMessage: document.querySelector("#reportMessage"),
  pendingTableBody: document.querySelector("#pendingTableBody"),
  pendingApprovalCount: document.querySelector("#pendingApprovalCount"),
  approvalAlertTitle: document.querySelector("#approvalAlertTitle"),
  approvalAlertText: document.querySelector("#approvalAlertText"),
  reviewedApprovalCount: document.querySelector("#reviewedApprovalCount"),
  reviewedApprovalList: document.querySelector("#reviewedApprovalList"),
  adminReservationTableBody: document.querySelector("#adminReservationTableBody"),
  adminApprovalMessage: document.querySelector("#adminApprovalMessage"),
  adminReservationSearchInput: document.querySelector("#adminReservationSearchInput"),
  adminReservationFilterButtons: document.querySelectorAll("[data-admin-reservation-filter]"),
  adminReservationReportButton: document.querySelector("#adminReservationReportButton"),
  adminReservationCount: document.querySelector("#adminReservationCount"),
  auditTableBody: document.querySelector("#auditTableBody"),
  auditSearchInput: document.querySelector("#auditSearchInput"),
  auditFilterButtons: document.querySelectorAll("[data-audit-filter]"),
  auditResultCount: document.querySelector("#auditResultCount"),
  adminReservationMessage: document.querySelector("#adminReservationMessage"),
  userForm: document.querySelector("#userForm"),
  userNameInput: document.querySelector("#userNameInput"),
  userEmailInput: document.querySelector("#userEmailInput"),
  userDepartmentInput: document.querySelector("#userDepartmentInput"),
  userPasswordInput: document.querySelector("#userPasswordInput"),
  userRoleSelect: document.querySelector("#userRoleSelect"),
  userMessage: document.querySelector("#userMessage"),
  userSearchInput: document.querySelector("#userSearchInput"),
  userListCount: document.querySelector("#userListCount"),
  userTableBody: document.querySelector("#userTableBody"),
  openUserCreateDialogButton: document.querySelector("#openUserCreateDialogButton"),
  userEditorModal: document.querySelector("#userEditorModal"),
  closeUserEditorButton: document.querySelector("#closeUserEditorButton"),
  cancelUserEditorButton: document.querySelector("#cancelUserEditorButton"),
  userEditorTitle: document.querySelector("#userEditorTitle"),
  userEditorSubtitle: document.querySelector("#userEditorSubtitle"),
  userPasswordLabel: document.querySelector("#userPasswordLabel"),
  userEditorSubmitButton: document.querySelector("#userEditorSubmitButton"),
  userEditorStatusActions: document.querySelector("#userEditorStatusActions"),
  toggleUserStatusButton: document.querySelector("#toggleUserStatusButton"),
  userEditorDeleteActions: document.querySelector("#userEditorDeleteActions"),
  userDeleteHelp: document.querySelector("#userDeleteHelp"),
  openUserDeleteConfirmButton: document.querySelector("#openUserDeleteConfirmButton"),
  userDeleteConfirmModal: document.querySelector("#userDeleteConfirmModal"),
  closeUserDeleteConfirmButton: document.querySelector("#closeUserDeleteConfirmButton"),
  cancelUserDeleteButton: document.querySelector("#cancelUserDeleteButton"),
  confirmUserDeleteButton: document.querySelector("#confirmUserDeleteButton"),
  userDeleteConfirmText: document.querySelector("#userDeleteConfirmText"),
  reservationModal: document.querySelector("#reservationModal"),
  reservationDetailTitle: document.querySelector("#reservationDetailTitle"),
  reservationDetailSubtitle: document.querySelector("#reservationDetailSubtitle"),
  reservationDetailBody: document.querySelector("#reservationDetailBody"),
  reservationDetailActions: document.querySelector("#reservationDetailActions"),
  reservationDeleteConfirmModal: document.querySelector("#reservationDeleteConfirmModal"),
  closeReservationDeleteConfirmButton: document.querySelector("#closeReservationDeleteConfirmButton"),
  cancelReservationDeleteButton: document.querySelector("#cancelReservationDeleteButton"),
  confirmReservationDeleteButton: document.querySelector("#confirmReservationDeleteButton"),
  reservationDeleteConfirmKicker: document.querySelector("#reservationDeleteConfirmKicker"),
  reservationDeleteConfirmTitle: document.querySelector("#reservationDeleteConfirmTitle"),
  reservationDeleteConfirmDescription: document.querySelector("#reservationDeleteConfirmDescription"),
  reservationDeleteBookingTitle: document.querySelector("#reservationDeleteBookingTitle"),
  reservationDeleteBookingMeta: document.querySelector("#reservationDeleteBookingMeta"),
  reservationDeleteBookingOwner: document.querySelector("#reservationDeleteBookingOwner"),
  reservationDeleteConfirmMessage: document.querySelector("#reservationDeleteConfirmMessage"),
};

function today() {
  const parts = tokyoDateTimeParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function tokyoDateTimeParts() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("ja-JP-u-ca-gregory", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  return parts;
}

function currentTokyoMinutes() {
  const parts = tokyoDateTimeParts();
  return Number(parts.hour) * 60 + Number(parts.minute);
}

function nextReservableStartMinutes(dateString) {
  if (normalizeDate(dateString) !== today()) {
    return timeToMinutes(BUSINESS_START_TIME);
  }
  const nextSlot = Math.floor(currentTokyoMinutes() / 30 + 1) * 30;
  return Math.max(timeToMinutes(BUSINESS_START_TIME), nextSlot);
}

function isPastStartSelection(dateString, startTime) {
  if (normalizeDate(dateString) !== today()) return false;
  return timeToMinutes(startTime) < nextReservableStartMinutes(dateString);
}

function dateParts(dateString) {
  const [year, month, day] = normalizeDate(dateString).split("-").map(Number);
  return { year, month, day };
}

function normalizeDate(dateString) {
  return String(dateString || "").replaceAll("/", "-");
}

function addDays(dateString, days) {
  const { year, month, day } = dateParts(dateString);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calendarMonthStart(dateString) {
  const { year, month } = dateParts(dateString);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function addMonths(monthStart, amount) {
  const { year, month } = dateParts(monthStart);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function daysInMonth(monthStart) {
  const { year, month } = dateParts(monthStart);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatDateJa(dateString) {
  if (window.MEETING_I18N) return window.MEETING_I18N.formatDate(dateString, "short");
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${normalizeDate(dateString)}T00:00:00+09:00`));
}

function formatMonthLabel(dateString) {
  if (window.MEETING_I18N) return window.MEETING_I18N.formatDate(dateString, "month");
  const { year, month } = dateParts(dateString);
  return `${year}年${month}月`;
}

function formatFullDate(dateString) {
  if (window.MEETING_I18N) return window.MEETING_I18N.formatDate(dateString, "full");
  const { year } = dateParts(dateString);
  return `${year}年${formatDateJa(dateString)}`;
}

function localizedBookingCount(count) {
  const language = window.MEETING_I18N?.language || "ja";
  if (language === "zh") return `${count}条预约`;
  if (language === "en") return `${count} booking${Number(count) === 1 ? "" : "s"}`;
  return `${count}件の予約`;
}

function localizedPeopleCount(count) {
  const language = window.MEETING_I18N?.language || "ja";
  if (language === "zh") return `${count}人`;
  if (language === "en") return `${count} people`;
  return `${count}名`;
}

function userInitials(name, email = "") {
  const label = String(name || email || "?").trim();
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((word) => /^[A-Za-z]/.test(word))) {
    return words.slice(0, 2).map((word) => word[0].toUpperCase()).join("");
  }
  return Array.from(label)[0]?.toUpperCase() || "?";
}

function safeAvatarDataUrl(value) {
  const dataUrl = String(value || "");
  return /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUrl) ? dataUrl : "";
}

function setAvatarVisual(element, user, overrideDataUrl) {
  if (!element) return;
  const dataUrl = safeAvatarDataUrl(overrideDataUrl === undefined ? user?.avatar_data_url : overrideDataUrl);
  element.replaceChildren();
  element.style.overflow = "hidden";
  element.style.removeProperty("background-image");
  element.classList.toggle("has-image", Boolean(dataUrl));
  if (dataUrl) {
    const image = document.createElement("img");
    image.src = dataUrl;
    image.alt = "";
    image.decoding = "async";
    image.dataset.avatarImage = "";
    Object.assign(image.style, {
      display: "block",
      width: "100%",
      height: "100%",
      maxWidth: "100%",
      maxHeight: "100%",
      borderRadius: "inherit",
      objectFit: "cover",
      objectPosition: "center",
    });
    element.append(image);
  } else {
    element.textContent = userInitials(user?.name, user?.email);
  }
}

function avatarMarkup(user) {
  const dataUrl = safeAvatarDataUrl(user?.avatar_data_url);
  if (dataUrl) {
    return `<img src="${escapeHtml(dataUrl)}" alt="" data-avatar-image style="display:block;width:100%;height:100%;max-width:100%;max-height:100%;border-radius:inherit;object-fit:cover;object-position:center" />`;
  }
  return escapeHtml(userInitials(user?.name, user?.email));
}

function dayOfWeek(dateString) {
  const { year, month, day } = dateParts(dateString);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function holidayName(dateString) {
  return state.holidays[normalizeDate(dateString)] || "";
}

function closedDayLabel(dateString) {
  const holiday = holidayName(dateString);
  if (holiday) return holiday;
  const day = dayOfWeek(dateString);
  if (day === 0) return "日曜日";
  if (day === 6) return "土曜日";
  return "";
}

function isClosedDate(dateString) {
  return Boolean(closedDayLabel(dateString));
}

function durationMinutes(startTime, endTime) {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

function normalizedStatus(status) {
  const value = String(status || "approved").trim().toLowerCase();
  const aliases = {
    承認済み: "approved",
    承認待ち: "pending",
    却下: "rejected",
  };
  return aliases[value] || (STATUS_LABELS[value] ? value : "pending");
}

function isApprovedReservation(reservation) {
  return normalizedStatus(reservation.status) === "approved";
}

function isSpecialReservation(reservation) {
  return Boolean(reservation.approval_required || reservation.request_reason) ||
    durationMinutes(reservation.start_time, reservation.end_time) > STANDARD_RESERVATION_MINUTES;
}

function timeToMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function buildTimeOptions() {
  const options = [];
  for (let minutes = timeToMinutes(BUSINESS_START_TIME); minutes <= timeToMinutes(BUSINESS_END_TIME); minutes += 30) {
    options.push(minutesToTime(minutes));
  }
  return options;
}

function fillTimeSelects() {
  updateStartTimeOptions(BUSINESS_START_TIME);
}

function updateStartTimeOptions(preferredValue = els.startTimeSelect.value) {
  const selectedDate = els.dateInput.value || state.selectedDate || today();
  const minStartMinutes = nextReservableStartMinutes(selectedDate);
  const startOptions = buildTimeOptions().filter(
    (time) => time < BUSINESS_END_TIME && timeToMinutes(time) >= minStartMinutes,
  );

  els.startTimeSelect.innerHTML = startOptions.map((time) => `<option value="${time}">${time}</option>`).join("");

  if (!startOptions.length) {
    els.startTimeSelect.disabled = true;
    els.endTimeSelect.disabled = true;
    els.endTimeSelect.innerHTML = "";
    els.specialRequestToggle.checked = false;
    els.specialRequestToggle.disabled = true;
    els.specialRequestDetails.hidden = true;
    els.durationHint.textContent = "本日の予約可能時間は終了しました。翌営業日以降を選択してください。";
    els.durationHint.className = "calendar-hint warn";
    return;
  }

  els.startTimeSelect.disabled = false;
  els.endTimeSelect.disabled = false;
  els.startTimeSelect.value = startOptions.includes(preferredValue) ? preferredValue : startOptions[0];
  updateEndTimeOptions();
}

function updateEndTimeOptions(preferredValue = els.endTimeSelect.value) {
  const startTime = els.startTimeSelect.value || BUSINESS_START_TIME;
  if (!startTime) return;
  const startMinutes = timeToMinutes(startTime);
  const endOptions = buildTimeOptions().filter((time) => {
    const minutes = durationMinutes(startTime, time);
    return (
      minutes >= MIN_RESERVATION_MINUTES &&
      minutes <= STANDARD_RESERVATION_MINUTES &&
      timeToMinutes(time) <= timeToMinutes(BUSINESS_END_TIME)
    );
  });

  els.endTimeSelect.innerHTML = endOptions
    .map((time) => `<option value="${time}">${time}</option>`)
    .join("");

  if (endOptions.includes(preferredValue) && timeToMinutes(preferredValue) > startMinutes) {
    els.endTimeSelect.value = preferredValue;
    return;
  }

  const defaultEnd = minutesToTime(Math.min(startMinutes + 60, timeToMinutes(BUSINESS_END_TIME)));
  els.endTimeSelect.value = endOptions.includes(defaultEnd) ? defaultEnd : endOptions[0] || BUSINESS_END_TIME;
  updateSpecialEndTimeOptions();
}

function updateSpecialEndTimeOptions(preferredValue = els.specialEndTimeSelect.value) {
  const startTime = els.startTimeSelect.value || BUSINESS_START_TIME;
  if (!startTime) return;
  const endOptions = buildTimeOptions().filter((time) => {
    const minutes = durationMinutes(startTime, time);
    return minutes > STANDARD_RESERVATION_MINUTES && timeToMinutes(time) <= timeToMinutes(BUSINESS_END_TIME);
  });

  els.specialEndTimeSelect.innerHTML = endOptions
    .map((time) => {
      const minutes = durationMinutes(startTime, time);
      return `<option value="${time}">${time}（${minutes}分）</option>`;
    })
    .join("");

  if (!endOptions.length) {
    els.specialRequestToggle.checked = false;
    els.specialRequestToggle.disabled = true;
    els.specialRequestDetails.hidden = true;
    els.approvalStatusText.textContent = "特別申請：不可";
    els.requestSummary.textContent = "この開始時刻では90分を超える申請時間を選択できません。";
    return;
  }

  els.specialRequestToggle.disabled = false;
  els.specialEndTimeSelect.value = endOptions.includes(preferredValue) ? preferredValue : endOptions[0];
}

async function api(path, options = {}) {
  const { headers = {}, ...fetchOptions } = options;
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (response.status === 401) {
    showLogin();
    throw new Error("unauthorized");
  }

  const data = await response.json().catch(() => ({}));
  if (response.status === 403 && data?.detail === "初期パスワードの変更が必要です。" && state.user) {
    showForcePassword();
    throw new Error(data.detail);
  }
  if (!response.ok) {
    const error = new Error(apiErrorMessage(data));
    error.status = response.status;
    throw error;
  }
  return data;
}

function apiErrorMessage(data) {
  const detail = data?.detail;

  if (!detail) {
    return "処理に失敗しました。入力内容を確認してください。";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        const field = Array.isArray(item?.loc) ? item.loc.filter((part) => part !== "body").join(".") : "";
        const message = item?.msg || item?.message || "";
        return [field, message].filter(Boolean).join("：");
      })
      .filter(Boolean);
    return messages.length ? messages.join(" / ") : "入力内容を確認してください。";
  }

  if (typeof detail === "object") {
    return detail.message || detail.msg || "入力内容を確認してください。";
  }

  return String(detail);
}

function showLogin(message = "") {
  state.user = null;
  state.messages = [];
  state.sentMessages = [];
  els.appView.hidden = true;
  els.forcePasswordView.hidden = true;
  els.loginView.hidden = false;
  if (message) {
    showLoginError(message);
  }
}

function showForcePassword() {
  els.loginView.hidden = true;
  els.appView.hidden = true;
  els.forcePasswordView.hidden = false;
  els.forceUserEmail.textContent = state.user?.email || "";
  clearMessage(els.forcePasswordMessage);
  els.forceNewPasswordInput.focus();
}

function showApp() {
  els.loginView.hidden = true;
  els.forcePasswordView.hidden = true;
  els.appView.hidden = false;
  els.currentUserName.textContent = state.user.name;
  els.currentUserEmail.textContent = `${state.user.email} / ${state.user.role}`;
  setAvatarVisual(els.currentUserAvatar, state.user);
  setAvatarVisual(els.headerProfileAvatar, state.user);
  setAvatarVisual(els.profileDialogAvatar, state.user);
  const isAdmin = state.user.role === "admin";
  els.adminTabButton.hidden = !isAdmin;
  if (els.adminSidebarNav) {
    els.adminSidebarNav.hidden = !isAdmin;
  }
  els.adminMessageComposer.hidden = !isAdmin;
  els.adminSentMessageSection.hidden = !isAdmin;
}

function showLoginError(message) {
  els.loginError.textContent = message;
  els.loginError.hidden = false;
}

function clearLoginError() {
  els.loginError.textContent = "";
  els.loginError.hidden = true;
}

function showMessage(element, message, type = "ok") {
  element.textContent = typeof message === "string" ? message : apiErrorMessage({ detail: message });
  element.className = `form-message ${type}`;
  element.hidden = false;
}

function clearMessage(element) {
  element.textContent = "";
  element.hidden = true;
}

const THEME_STORAGE_KEY = "meeting-theme-mode";
const THEME_LABELS = { light: "ライト", dark: "ダーク", system: "自動" };
const THEME_ICONS = {
  light: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5"/><path d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.45 5.45l1.4 1.4M17.15 17.15l1.4 1.4M18.55 5.45l-1.4 1.4M6.85 17.15l-1.4 1.4"/></svg>',
  dark: '<svg viewBox="0 0 24 24"><path d="M20 15.25A8 8 0 0 1 8.75 4a8 8 0 1 0 11.25 11.25Z"/></svg>',
  system: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z"/></svg>',
};

function savedThemeMode() {
  try {
    const mode = window.localStorage.getItem(THEME_STORAGE_KEY);
    return ["light", "dark", "system"].includes(mode) ? mode : "system";
  } catch (_) {
    return "system";
  }
}

function isDarkTheme(mode) {
  return mode === "dark" || (
    mode === "system"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function closeThemeMenu() {
  if (!els.themeMenu) return;
  els.themeMenu.hidden = true;
  els.themeMenuButton?.setAttribute("aria-expanded", "false");
}

function applyThemeMode(mode, { persist = true } = {}) {
  const selectedMode = ["light", "dark", "system"].includes(mode) ? mode : "system";
  const dark = isDarkTheme(selectedMode);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.themeMode = selectedMode;
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document.querySelector("#themeColorMeta")?.setAttribute("content", dark ? "#0c121d" : "#ffffff");

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, selectedMode);
    } catch (_) {
      // A blocked localStorage should not prevent the system from being used.
    }
  }

  const effectiveMode = dark ? THEME_LABELS.dark : THEME_LABELS.light;
  const visibleLabel = selectedMode === "system"
    ? `${THEME_LABELS.system}・${effectiveMode}`
    : THEME_LABELS[selectedMode];
  if (els.themeMenuIcon) els.themeMenuIcon.innerHTML = THEME_ICONS[selectedMode];
  if (els.themeMenuLabel) els.themeMenuLabel.textContent = visibleLabel;
  if (els.themeSystemDetail) els.themeSystemDetail.textContent = `端末設定に合わせる（現在：${effectiveMode}）`;
  if (els.themeSystemButton) {
    els.themeSystemButton.setAttribute("aria-label", `自動：端末設定に合わせる。現在は${effectiveMode}`);
  }
  if (els.themeMenuButton) {
    els.themeMenuButton.title = `${THEME_LABELS[selectedMode]}（現在：${effectiveMode}）`;
    els.themeMenuButton.setAttribute("aria-label", `表示モード：${visibleLabel}。変更する`);
  }
  els.themeModeButtons.forEach((button) => {
    const active = button.dataset.themeMode === selectedMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-checked", String(active));
  });
}

function initThemeSwitcher() {
  applyThemeMode(savedThemeMode(), { persist: false });

  els.themeMenuButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    const opening = els.themeMenu?.hidden;
    if (!els.themeMenu) return;
    els.themeMenu.hidden = !opening;
    els.themeMenuButton.setAttribute("aria-expanded", String(opening));
    if (opening) els.themeModeButtons.find((button) => button.classList.contains("is-active"))?.focus();
  });

  els.themeMenu?.addEventListener("click", (event) => event.stopPropagation());

  els.themeModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.themeMode;
      applyThemeMode(mode);
      closeThemeMenu();
      const effectiveMode = document.documentElement.dataset.theme === "dark" ? THEME_LABELS.dark : THEME_LABELS.light;
      const suffix = mode === "system" ? `（現在：${effectiveMode}）` : "";
      showToast(`表示モードを「${THEME_LABELS[mode]}」に変更しました。${suffix}`);
    });
  });

  document.addEventListener("click", () => {
    if (!els.themeMenu?.hidden) closeThemeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.themeMenu?.hidden) {
      closeThemeMenu();
      els.themeMenuButton?.focus();
    }
  });

  if (typeof window.matchMedia === "function") {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", () => {
        if (savedThemeMode() === "system") applyThemeMode("system", { persist: false });
      });
    }
  }
}

function showToast(message, type = "ok") {
  let toast = document.querySelector("#appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `app-toast ${type}`;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 3600);
}

async function loadApiVersion() {
  try {
    const result = await api("/api/version");
    state.apiVersion = String(result?.version || "");
    if (state.apiVersion && state.apiVersion !== EXPECTED_API_VERSION) {
      const features = profileApiUnavailable() ? "プロフィール画像とCSVレポート" : "CSVレポートの安定化機能";
      showToast(apiUpdateMessage(features), "info");
    }
  } catch {
    state.apiVersion = "";
  }
}

function apiUpdateMessage(feature) {
  const version = state.apiVersion ? `（現在：${state.apiVersion}）` : "";
  return `${feature}を利用するにはAPIコンテナの更新が必要です${version}。最新版で再ビルドしてください。`;
}

function profileApiUnavailable() {
  return PROFILE_API_UNAVAILABLE_VERSIONS.has(state.apiVersion);
}

function renderMessageRecipientOptions() {
  if (!els.messageRecipientSelect) return;
  const selected = els.messageRecipientSelect.value;
  const users = [...state.directoryUsers].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, "ja"));
  els.messageRecipientSelect.innerHTML = [
    `<option value="">全ユーザー</option>`,
    ...users.map((user) => `<option value="${user.id}">${escapeHtml(user.name)}（${escapeHtml(user.email)}）</option>`),
  ].join("");
  if ([...els.messageRecipientSelect.options].some((option) => option.value === selected)) {
    els.messageRecipientSelect.value = selected;
  }
}

function renderMessageCenter() {
  const unreadCount = state.messages.filter((message) => !message.is_read).length;
  els.messageUnreadBadge.hidden = unreadCount === 0;
  els.messageUnreadBadge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
  els.messageCenterButton.classList.toggle("has-unread", unreadCount > 0);
  els.messageDrawerSummary.textContent = unreadCount
    ? `${unreadCount}件の未読メッセージがあります。`
    : "新しい未読メッセージはありません。";
  els.messageInboxCount.textContent = `${state.messages.length}件`;
  els.markAllMessagesReadButton.disabled = unreadCount === 0;

  if (!state.messages.length) {
    els.messageInboxList.innerHTML = `
      <div class="message-empty-state">
        <span aria-hidden="true">✓</span>
        <strong>メッセージはありません</strong>
        <p>管理者からのお知らせが届くと、ここに表示されます。</p>
      </div>
    `;
  } else {
    els.messageInboxList.innerHTML = state.messages
      .map(
        (message) => `
          <button class="message-card${message.is_read ? "" : " is-unread"}" type="button" data-message-id="${message.id}">
            <span class="message-card-indicator" aria-hidden="true"></span>
            <span class="message-card-content">
              <span class="message-card-topline">
                <strong>${escapeHtml(message.title)}</strong>
                <time>${escapeHtml(formatAuditTime(message.created_at))}</time>
              </span>
              <span class="message-card-body">${escapeHtml(message.body)}</span>
              <span class="message-card-meta">${escapeHtml(message.sender_name)} ・ ${message.recipient_user_id ? "個別" : "全員宛"}</span>
            </span>
          </button>
        `,
      )
      .join("");
  }

  if (state.user?.role === "admin") {
    els.adminSentMessageList.innerHTML = state.sentMessages.length
      ? state.sentMessages
          .map(
            (message) => `
              <article class="message-card sent-message-card">
                <span class="message-card-indicator" aria-hidden="true"></span>
                <span class="message-card-content">
                  <span class="message-card-topline">
                    <strong>${escapeHtml(message.title)}</strong>
                    <time>${escapeHtml(formatAuditTime(message.created_at))}</time>
                  </span>
                  <span class="message-card-body">${escapeHtml(message.body)}</span>
                  <span class="message-card-meta">送信先：${escapeHtml(message.recipient_name)}</span>
                </span>
              </article>
            `,
          )
          .join("")
      : `<p class="message-list-empty">送信履歴はまだありません。</p>`;
  }
}

async function loadMessages() {
  state.messages = await api("/api/messages");
  if (state.user?.role === "admin") {
    state.sentMessages = await api("/api/admin/messages");
  } else {
    state.sentMessages = [];
  }
  renderMessageRecipientOptions();
  renderMessageCenter();
}

async function openMessageDrawer() {
  els.messageDrawer.hidden = false;
  els.messageDrawerBackdrop.hidden = false;
  els.messageCenterButton.setAttribute("aria-expanded", "true");
  document.body.classList.add("message-drawer-open");
  try {
    await loadMessages();
  } catch (error) {
    els.messageInboxList.innerHTML = `<p class="message-list-error">${escapeHtml(error.message)}</p>`;
  }
  els.closeMessageDrawerButton.focus();
}

function closeMessageDrawer() {
  els.messageDrawer.hidden = true;
  els.messageDrawerBackdrop.hidden = true;
  els.messageCenterButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("message-drawer-open");
}

async function markMessageRead(messageId) {
  const message = state.messages.find((item) => item.id === messageId);
  if (!message || message.is_read) return;
  message.is_read = true;
  renderMessageCenter();
  try {
    await api(`/api/messages/${messageId}/read`, { method: "POST" });
  } catch (error) {
    message.is_read = false;
    renderMessageCenter();
    showToast(error.message, "warn");
  }
}

async function markAllMessagesRead() {
  if (!state.messages.some((message) => !message.is_read)) return;
  try {
    await api("/api/messages/read-all", { method: "POST" });
    state.messages.forEach((message) => { message.is_read = true; });
    renderMessageCenter();
    showToast("すべてのメッセージを既読にしました。");
  } catch (error) {
    showToast(error.message, "warn");
  }
}

async function sendAdminMessage(event) {
  event.preventDefault();
  clearMessage(els.adminMessageFormMessage);
  els.sendAdminMessageButton.disabled = true;
  try {
    const recipientValue = els.messageRecipientSelect.value;
    await api("/api/admin/messages", {
      method: "POST",
      body: JSON.stringify({
        recipient_user_id: recipientValue ? Number(recipientValue) : null,
        title: els.messageTitleInput.value.trim(),
        body: els.messageBodyInput.value.trim(),
      }),
    });
    els.adminMessageForm.reset();
    showMessage(els.adminMessageFormMessage, "メッセージを送信しました。", "ok");
    await loadMessages();
  } catch (error) {
    showMessage(els.adminMessageFormMessage, error.message, "warn");
  } finally {
    els.sendAdminMessageButton.disabled = false;
  }
}

function syncProfileAvatarPreview() {
  setAvatarVisual(els.profileDialogAvatar, state.user, state.profileAvatarDataUrl);
  els.profileAvatarRemoveButton.hidden = !safeAvatarDataUrl(state.profileAvatarDataUrl);
}

function loadAvatarImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像を読み取れませんでした。別の画像を選択してください。"));
    };
    image.src = objectUrl;
  });
}

async function createAvatarDataUrl(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("JPEG、PNG、WebP の画像を選択してください。");
  }
  if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
    throw new Error("画像は5MB以下のファイルを選択してください。");
  }

  const image = await loadAvatarImage(file);
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("画像サイズを確認できませんでした。");
  }

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_RENDER_SIZE;
  canvas.height = AVATAR_RENDER_SIZE;
  const context = canvas.getContext("2d");
  const contentSize = AVATAR_RENDER_SIZE * AVATAR_CONTENT_RATIO;
  const scale = Math.min(contentSize / image.naturalWidth, contentSize / image.naturalHeight);
  const renderWidth = Math.max(1, image.naturalWidth * scale);
  const renderHeight = Math.max(1, image.naturalHeight * scale);
  const renderX = (AVATAR_RENDER_SIZE - renderWidth) / 2;
  const renderY = (AVATAR_RENDER_SIZE - renderHeight) / 2;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, AVATAR_RENDER_SIZE, AVATAR_RENDER_SIZE);
  context.drawImage(
    image,
    renderX,
    renderY,
    renderWidth,
    renderHeight,
  );

  let dataUrl = canvas.toDataURL("image/webp", 0.92);
  if (!dataUrl.startsWith("data:image/webp")) {
    dataUrl = canvas.toDataURL("image/png");
  }
  if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH && dataUrl.startsWith("data:image/webp")) {
    dataUrl = canvas.toDataURL("image/webp", 0.78);
  }
  if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
    throw new Error("画像データが大きすぎます。別の画像を選択してください。");
  }
  return dataUrl;
}

async function selectProfileAvatar(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  clearMessage(els.profileMessage);
  els.profileAvatarSelectButton.disabled = true;
  els.profileAvatarButton.disabled = true;
  try {
    state.profileAvatarDataUrl = await createAvatarDataUrl(file);
    syncProfileAvatarPreview();
    showMessage(els.profileMessage, "画像を選択しました。「設定を保存」で反映されます。", "ok");
  } catch (error) {
    showMessage(els.profileMessage, error.message, "warn");
  } finally {
    event.target.value = "";
    els.profileAvatarSelectButton.disabled = false;
    els.profileAvatarButton.disabled = false;
  }
}

function openProfile() {
  const user = state.user;
  if (!user) return;
  clearMessage(els.profileMessage);
  els.profileNameInput.value = user.name || "";
  els.profileEmailInput.value = user.email || "";
  els.profileDepartmentInput.value = user.department || "";
  els.profileRoleInput.value = user.role === "admin" ? "管理者" : "一般ユーザー";
  state.profileAvatarDataUrl = safeAvatarDataUrl(user.avatar_data_url) || null;
  syncProfileAvatarPreview();
  const profileUnavailable = profileApiUnavailable();
  els.profileNameInput.readOnly = profileUnavailable;
  els.profileDepartmentInput.readOnly = profileUnavailable;
  els.profileAvatarButton.disabled = profileUnavailable;
  els.profileAvatarSelectButton.disabled = profileUnavailable;
  els.profileAvatarRemoveButton.disabled = profileUnavailable;
  els.profileSubmitButton.disabled = profileUnavailable;
  if (profileUnavailable) {
    showMessage(
      els.profileMessage,
      apiUpdateMessage("プロフィール画像の保存"),
      "info",
    );
  }
  els.profileModal.hidden = false;
  els.profileNameInput.focus();
}

function closeProfile() {
  els.profileAvatarInput.value = "";
  els.profileModal.hidden = true;
}

async function saveProfile(event) {
  event.preventDefault();
  clearMessage(els.profileMessage);
  els.profileSubmitButton.disabled = true;
  try {
    const result = await api("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({
        name: els.profileNameInput.value.trim(),
        department: els.profileDepartmentInput.value.trim(),
        avatar_data_url: state.profileAvatarDataUrl,
      }),
    });
    state.user = result.user;
    showApp();
    els.reserverNameInput.value = state.user.name || "";
    closeProfile();
    showToast("プロフィールを更新しました。");
  } catch (error) {
    const message = error.status === 404
      ? apiUpdateMessage("プロフィール画像の保存")
      : error.message;
    showMessage(els.profileMessage, message, "warn");
  } finally {
    els.profileSubmitButton.disabled = false;
  }
}

function openLogoutConfirm() {
  els.logoutConfirmModal.hidden = false;
  els.cancelLogoutButton.focus();
}

function closeLogoutConfirm() {
  els.logoutConfirmModal.hidden = true;
}

async function confirmLogout() {
  els.confirmLogoutButton.disabled = true;
  await api("/api/auth/logout", { method: "POST" }).catch(() => {});
  els.confirmLogoutButton.disabled = false;
  closeLogoutConfirm();
  closeMessageDrawer();
  showLogin();
}

function refreshLocalizedInterface(event) {
  applyThemeMode(savedThemeMode(), { persist: false });
  if (state.user) {
    renderMessageCenter();
    if (!els.dashboardSection.hidden) {
      setPageHeading("ダッシュボード", today());
      renderDashboard();
    } else if (!els.reservationSection.hidden) {
      setPageHeading("新規予約", state.selectedDate);
      renderRoomChoiceGrid();
      renderReservationAvailability();
      updateReservationLiveSummary();
      updateDurationPolicy();
    } else if (!els.timelineSection.hidden) {
      setPageHeading("タイムライン", state.selectedDate);
      renderTimelinePage();
    } else if (!els.calendarSection.hidden) {
      setPageHeading("カレンダー", state.selectedDate);
      renderCalendarPage();
    } else if (!els.adminSection.hidden) {
      setPageHeading(adminPageTitle(state.adminView), today());
      renderAdminSummary();
      renderPendingApprovals();
      renderAdminReservations();
      renderAuditLogs();
      renderUsers();
    }
  }
  window.requestAnimationFrame(() => window.MEETING_I18N?.translateDocument());
  if (event?.detail?.announce) {
    showToast(window.MEETING_I18N?.languageChangedMessage || "表示言語を変更しました。", "info");
  }
}

window.addEventListener("meeting:languagechange", refreshLocalizedInterface);
window.MEETING_I18N?.init();
initThemeSwitcher();

async function loadMe() {
  try {
    const data = await api("/api/auth/me");
    state.user = data.user;
    if (state.user.must_change_password) {
      showForcePassword();
      return;
    }
    showApp();
    await loadInitialData();
  } catch {
    showLogin();
  }
}

async function loadInitialData() {
  const currentYear = Number(today().slice(0, 4));
  await loadApiVersion();
  await loadHolidayYears([currentYear, currentYear + 1]);
  state.rooms = await api("/api/rooms");
  state.directoryUsers = await api("/api/users/directory");
  els.roomSelect.innerHTML = state.rooms.map((room) => `<option value="${room.id}">${room.name}</option>`).join("");
  renderRoomChoiceGrid();
  els.dateInput.value = state.selectedDate;
  els.participantCountInput.value = "1";
  els.reserverNameInput.value = state.user.name || "";
  if (els.reportDateInput) {
    els.reportDateInput.value = state.selectedDate;
  }
  renderAttendeePicker();
  updateDatePolicy();
  updateDurationPolicy();
  await loadReservations();
  await loadMessages().catch(() => {
    state.messages = [];
    state.sentMessages = [];
    renderMessageCenter();
  });
  if (state.user.role === "admin") {
    await loadAdminData();
  }
  showDashboardPage();
}

async function loadHolidayYears(years) {
  await Promise.all(
    years.map(async (year) => {
      try {
        const holidays = await api(`/api/calendar/holidays?year=${year}`);
        for (const holiday of holidays) {
          state.holidays[holiday.date] = holiday.name;
        }
      } catch {
        // The local fallback table keeps the calendar usable if this endpoint is unavailable.
      }
    }),
  );
}

function selectedAttendeeIds() {
  return [...state.selectedAttendeeIds].filter((id) => Number.isInteger(id) && id > 0);
}

function attendeeMatches(user, keyword) {
  if (!keyword) return true;
  const haystack = `${user.name || ""} ${user.email || ""}`.toLowerCase();
  return haystack.includes(keyword.toLowerCase());
}

function renderSelectedAttendeeChips() {
  if (!els.selectedAttendeeChips) return;
  const selectedUsers = state.directoryUsers
    .filter((user) => state.selectedAttendeeIds.has(user.id))
    .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, "ja"));

  els.selectedAttendeeChips.hidden = selectedUsers.length === 0;
  if (!selectedUsers.length) {
    els.selectedAttendeeChips.innerHTML = "";
    return;
  }

  els.selectedAttendeeChips.innerHTML = selectedUsers
    .map(
      (user) => `
        <button class="attendee-chip" type="button" data-remove-attendee="${user.id}" title="${escapeHtml(user.email)}">
          <span>${escapeHtml(user.name || user.email)}</span>
          <small>${escapeHtml(user.email)}</small>
          <b aria-hidden="true">×</b>
        </button>
      `,
    )
    .join("");
}

function renderAttendeePicker() {
  if (!els.attendeeList) return;
  const keyword = els.attendeeSearchInput?.value.trim() || "";
  const currentUserId = state.user?.id;
  renderSelectedAttendeeChips();
  els.attendeeCountText.textContent = `${state.selectedAttendeeIds.size}名選択中`;

  if (keyword.length < 2) {
    els.attendeeList.innerHTML = `
      <div class="attendee-empty">
        <strong>氏名またはメールを2文字以上入力してください。</strong>
        <span>選択済みの参加者は上に表示されます。</span>
      </div>
    `;
    return;
  }

  const visibleUsers = state.directoryUsers
    .filter((user) => user.id !== currentUserId)
    .filter((user) => attendeeMatches(user, keyword))
    .sort((a, b) => {
      const aSelected = state.selectedAttendeeIds.has(a.id) ? 0 : 1;
      const bSelected = state.selectedAttendeeIds.has(b.id) ? 0 : 1;
      if (aSelected !== bSelected) return aSelected - bSelected;
      return (a.name || a.email).localeCompare(b.name || b.email, "ja");
    })
    .slice(0, 24);

  if (!visibleUsers.length) {
    els.attendeeList.innerHTML = `<p class="empty compact">該当するユーザーはありません。</p>`;
    return;
  }

  els.attendeeList.innerHTML = visibleUsers
    .map((user) => {
      const checked = state.selectedAttendeeIds.has(user.id) ? "checked" : "";
      return `
        <label class="attendee-option">
          <input type="checkbox" value="${user.id}" ${checked} />
          <span>
            <strong>${escapeHtml(user.name)}</strong>
            <small>${escapeHtml(user.email)}</small>
          </span>
        </label>
      `;
    })
    .join("");
}

function syncParticipantCountWithAttendees() {
  const minimum = Math.max(1, state.selectedAttendeeIds.size + 1);
  const current = Number(els.participantCountInput.value || 0);
  if (!current || current < minimum) {
    els.participantCountInput.value = String(minimum);
  }
}

function formatAttendees(attendees = []) {
  if (!attendees.length) return "-";
  return attendees.map((attendee) => `${attendee.name} <${attendee.email}>`).join("、");
}

function isParticipantReservation(reservation) {
  return Boolean(reservation.attendees?.some((attendee) => attendee.user_id === state.user?.id));
}

function myRelevantReservations(reservations) {
  return reservations.filter((reservation) => reservation.user_id === state.user?.id || isParticipantReservation(reservation));
}

function setPageHeading(title, dateString = state.selectedDate || today()) {
  if (els.pageTitle) els.pageTitle.textContent = title;
  if (els.appPageDate) els.appPageDate.textContent = formatDateJa(dateString);
}

function setSideNavigation(activeKey, adminView = "") {
  const isDashboard = activeKey === "dashboard";
  const isReservation = activeKey === "reservation";
  const isTimeline = activeKey === "timeline";
  const isCalendar = activeKey === "calendar";

  els.dashboardNavButton?.classList.toggle("active", isDashboard);
  els.dashboardNavButton?.setAttribute("aria-current", isDashboard ? "page" : "false");
  els.reservationTabButton.classList.toggle("active", isReservation);
  els.reservationTabButton.setAttribute("aria-current", isReservation ? "page" : "false");
  els.timelineNavButton?.classList.toggle("active", isTimeline);
  els.timelineNavButton?.setAttribute("aria-current", isTimeline ? "page" : "false");
  els.calendarNavButton?.classList.toggle("active", isCalendar);
  els.calendarNavButton?.setAttribute("aria-current", isCalendar ? "page" : "false");

  els.sidebarAdminButtons.forEach((button) => {
    const active = activeKey === "admin" && button.dataset.adminSideView === adminView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  if (els.quickReservationButton) {
    els.quickReservationButton.hidden = isReservation;
  }
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function showDashboardPage() {
  els.dashboardSection.hidden = false;
  els.reservationSection.hidden = true;
  els.timelineSection.hidden = true;
  els.calendarSection.hidden = true;
  els.adminSection.hidden = true;
  setPageHeading("ダッシュボード", today());
  setSideNavigation("dashboard");
  renderDashboard();
}

function showReservationPage() {
  els.dashboardSection.hidden = true;
  els.reservationSection.hidden = false;
  els.timelineSection.hidden = true;
  els.calendarSection.hidden = true;
  els.adminSection.hidden = true;
  setPageHeading("新規予約", state.selectedDate);
  setSideNavigation("reservation");
  renderRoomChoiceGrid();
  renderReservationAvailability();
  updateReservationLiveSummary();
}

async function showTimelinePage() {
  els.dashboardSection.hidden = true;
  els.reservationSection.hidden = true;
  els.timelineSection.hidden = false;
  els.calendarSection.hidden = true;
  els.adminSection.hidden = true;
  state.viewMode = "day";
  setPageHeading("タイムライン", state.selectedDate);
  setSideNavigation("timeline");
  await loadReservations();
}

async function showCalendarPage() {
  els.dashboardSection.hidden = true;
  els.reservationSection.hidden = true;
  els.timelineSection.hidden = true;
  els.calendarSection.hidden = false;
  els.adminSection.hidden = true;
  state.calendarMonth = calendarMonthStart(state.selectedDate);
  setPageHeading("カレンダー", state.selectedDate);
  setSideNavigation("calendar");
  await loadCalendarReservations();
}

async function showAdminPage(view = state.adminView || "overview") {
  if (state.user.role !== "admin") return;
  els.dashboardSection.hidden = true;
  els.reservationSection.hidden = true;
  els.timelineSection.hidden = true;
  els.calendarSection.hidden = true;
  els.adminSection.hidden = false;
  setAdminView(view);
  await loadAdminData();
}

function setAdminView(view) {
  const targetView = [...els.adminPanelViews].some((panel) => panel.dataset.adminPanel === view) ? view : "overview";
  state.adminView = targetView;
  els.adminMenuButtons.forEach((button) => {
    const active = button.dataset.adminView === targetView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  els.adminPanelViews.forEach((panel) => {
    const active = panel.dataset.adminPanel === targetView;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });

  if (!els.adminSection.hidden) {
    setPageHeading(adminPageTitle(targetView), today());
    setSideNavigation("admin", targetView);
  }
}

function adminPageTitle(view) {
  const titles = {
    overview: "管理・承認",
    approvals: "承認管理",
    reservations: "予約管理",
    users: "ユーザー管理",
    audit: "操作ログ",
    mail: "メール設定",
    reports: "レポート",
  };
  return titles[view] || "管理・承認";
}

function getRange() {
  if (state.viewMode === "week") {
    return { start: state.selectedDate, end: addDays(state.selectedDate, 7) };
  }
  return { start: state.selectedDate, end: addDays(state.selectedDate, 1) };
}

async function loadReservations() {
  const { start, end } = getRange();
  const query = new URLSearchParams({ start, end });
  state.reservations = await api(`/api/reservations?${query.toString()}`);
  renderSchedule();
  renderReservationAvailability();
  renderOverviewPanels();
  renderUserNotifications();
  renderDashboard();
  renderTimelinePage();
}

async function loadCalendarReservations() {
  const start = calendarMonthStart(state.calendarMonth);
  const end = addMonths(start, 1);
  const query = new URLSearchParams({ start, end });
  state.calendarReservations = await api(`/api/reservations?${query.toString()}`);
  renderCalendarPage();
}

function reservationsForRoom(roomId) {
  return state.reservations
    .filter((reservation) => reservation.room_id === roomId && isApprovedReservation(reservation))
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}

function renderRoomChoiceGrid() {
  if (!els.roomChoiceGrid) return;

  const selectedRoomId = Number(els.roomSelect.value);
  els.roomChoiceGrid.innerHTML = state.rooms
    .map((room) => {
      const selected = Number(room.id) === selectedRoomId;
      const selectionLabel = selected ? "選択中" : "選択";
      return `
        <button
          class="room-choice${selected ? " is-selected" : ""}"
          type="button"
          role="radio"
          aria-checked="${selected}"
          data-room-choice="${room.id}"
          style="--room-choice-color: ${escapeHtml(roomColor(room.name))}"
        >
          <span class="room-choice-title"><i aria-hidden="true"></i>${escapeHtml(room.name)}</span>
          <span class="room-choice-caption">${selectionLabel}</span>
        </button>
      `;
    })
    .join("");
  updateReservationLiveSummary();
}

function updateReservationLiveSummary() {
  if (!els.reservationLiveSummary) return;

  const title = els.titleInput?.value.trim() || "会議件名を入力してください";
  const room = state.rooms.find((item) => Number(item.id) === Number(els.roomSelect?.value));
  const date = normalizeDate(els.dateInput?.value || state.selectedDate);
  const start = els.startTimeSelect?.value || "--:--";
  const specialEnabled = Boolean(els.specialRequestToggle?.checked);
  const end = specialEnabled
    ? els.specialEndTimeSelect?.value || "--:--"
    : els.endTimeSelect?.value || "--:--";
  const roomName = room?.name || "会議室未選択";
  const attendeeCount = Number(els.participantCountInput?.value || 0);
  const attendeeLabel = attendeeCount > 0 ? localizedPeopleCount(attendeeCount) : "人数未設定";

  els.reservationLiveSummary.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(formatDateJa(date))} ・ ${escapeHtml(start)}〜${escapeHtml(end)} ・ ${escapeHtml(roomName)} ・ ${escapeHtml(attendeeLabel)}</span>
  `;
}

function renderReservationAvailability() {
  if (!els.reservationAvailabilityList || !els.reservationAvailabilityCaption) return;

  const roomId = Number(els.roomSelect.value);
  const room = state.rooms.find((item) => Number(item.id) === roomId);
  const selectedDate = normalizeDate(els.dateInput.value || state.selectedDate);

  if (!room || !selectedDate) {
    els.reservationAvailabilityCaption.textContent = "会議室を選択してください";
    els.reservationAvailabilityList.innerHTML = `
      <div class="reservation-availability-empty">
        <strong>空き時間を確認できます</strong>
        <span>会議室と日付を選択すると、予約済みの時間を表示します。</span>
      </div>
    `;
    return;
  }

  const reservations = activeReservationsForDate(reservationsForRoom(room.id), selectedDate);
  els.reservationAvailabilityCaption.textContent = `${room.name} / ${formatDateJa(selectedDate)}`;

  if (!reservations.length) {
    els.reservationAvailabilityList.innerHTML = `
      <div class="reservation-availability-empty is-available">
        <strong>${escapeHtml(room.name)} は空いています</strong>
        <span>この日の予約済み時間はありません。</span>
      </div>
    `;
    return;
  }

  els.reservationAvailabilityList.innerHTML = reservations
    .map(
      (reservation) => `
        <article class="reservation-availability-item" style="--room-choice-color: ${escapeHtml(roomColor(room.name))}">
          <span class="reservation-availability-time">${escapeHtml(reservation.start_time)} - ${escapeHtml(reservation.end_time)}</span>
          <strong>${escapeHtml(reservation.title || reservation.purpose || "予約済み")}</strong>
          <small>${escapeHtml(reservation.reserver_name || reservation.user_name || "-")}</small>
        </article>
      `,
    )
    .join("");
}

function renderSchedule() {
  els.periodLabel.textContent =
    state.viewMode === "week"
      ? `${formatDateJa(state.selectedDate)} から 1週間`
      : `${formatDateJa(state.selectedDate)} 09:00 - 19:00`;

  if (state.viewMode === "week") {
    els.schedule.innerHTML = state.rooms
      .map((room) => {
        const reservations = reservationsForRoom(room.id);
        const body = reservations.length
          ? reservations.map((reservation) => reservationWeekItem(reservation)).join("")
          : `<p class="empty">予約はありません。</p>`;
        return `
          <section class="room-row">
            <div class="room-row-header">
              <span class="room-name">${escapeHtml(room.name)}</span>
              <span class="reservation-meta">${reservations.length} 件</span>
            </div>
            <div class="reservation-list week-reservation-list">${body}</div>
          </section>
        `;
      })
      .join("");
    return;
  }

  els.schedule.innerHTML = renderDayTimelineMarkup();
}

function renderDayTimelineMarkup() {
  const timeLabels = [];
  const timelineStart = timeToMinutes(BUSINESS_START_TIME);
  const timelineEnd = timeToMinutes(BUSINESS_END_TIME);
  for (let minutes = timelineStart; minutes <= timelineEnd; minutes += 120) {
    const edgeClass = minutes === timelineStart ? " is-start" : minutes === timelineEnd ? " is-end" : "";
    timeLabels.push(`
      <span class="timeline-time${edgeClass}" style="left: ${timelinePosition(minutes)}%">${minutesToTime(minutes)}</span>
    `);
  }

  return `
    <div class="timeline-shell">
      <div class="timeline-header">
        <div class="timeline-room-label">会議室</div>
        <div class="timeline-scale">${timeLabels.join("")}</div>
      </div>
      ${state.rooms
        .map((room) => {
          const reservations = reservationsForRoom(room.id);
          return `
            <section class="timeline-row">
              <div class="timeline-room-info" style="--room-color:${escapeHtml(roomColor(room.name))}">
                <strong>${escapeHtml(room.name)}</strong>
                <span class="${reservations.length ? "is-busy" : "is-free"}">
                  <i aria-hidden="true"></i>${reservations.length ? `${reservations.length} 件` : "終日空き"}
                </span>
              </div>
              <div class="timeline-track">
                <div class="timeline-grid-lines"></div>
                ${reservations.length ? reservations.map((reservation) => reservationTimelineBlock(reservation)).join("") : `<span class="timeline-empty">空き</span>`}
              </div>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderTimelinePage() {
  if (!els.timelineViewSchedule || els.timelineSection.hidden) return;
  els.timelineViewDate.textContent = `${formatDateJa(state.selectedDate)} 09:00 - 19:00`;
  els.timelineViewSchedule.innerHTML = renderDayTimelineMarkup();
}

function calendarDateReservations(dateString) {
  return state.calendarReservations
    .filter(
      (reservation) =>
        reservation.date === dateString
        && isApprovedReservation(reservation)
        && (state.calendarRoomFilter === "all" || String(reservation.room_id) === state.calendarRoomFilter),
    )
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}

function renderCalendarPage() {
  if (!els.calendarMonthGrid || els.calendarSection.hidden) return;

  const monthStart = calendarMonthStart(state.calendarMonth);
  const { year, month } = dateParts(monthStart);
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const monthDays = daysInMonth(monthStart);
  const cellCount = Math.ceil((firstWeekday + monthDays) / 7) * 7;
  const monthPrefix = monthStart.slice(0, 7);

  els.calendarMonthLabel.textContent = formatMonthLabel(monthStart);
  if (els.calendarRoomFilters) {
    const approvedMonthReservations = state.calendarReservations.filter((reservation) => isApprovedReservation(reservation));
    const allActive = state.calendarRoomFilter === "all";
    els.calendarRoomFilters.innerHTML = `
      <button class="calendar-room-filter${allActive ? " is-active" : ""}" type="button" data-calendar-room-filter="all" aria-pressed="${allActive}">
        <span class="calendar-filter-all-icon" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
        すべて
        <small>${approvedMonthReservations.length}</small>
      </button>
      ${state.rooms
        .map((room) => {
          const value = String(room.id);
          const active = state.calendarRoomFilter === value;
          const count = approvedMonthReservations.filter((reservation) => Number(reservation.room_id) === Number(room.id)).length;
          return `
            <button
              class="calendar-room-filter${active ? " is-active" : ""}"
              type="button"
              data-calendar-room-filter="${escapeHtml(value)}"
              aria-pressed="${active}"
            >
              <span class="calendar-filter-dot" style="--filter-color:${escapeHtml(roomColor(room.name))};--filter-border:${escapeHtml(roomBorderColor(room.name))}" aria-hidden="true"></span>
              ${escapeHtml(room.name)}
              <small>${count}</small>
            </button>
          `;
        })
        .join("")}
    `;
  }
  els.calendarMonthGrid.innerHTML = Array.from({ length: cellCount }, (_, index) => {
    const cellDate = addDays(monthStart, index - firstWeekday);
    const { day } = dateParts(cellDate);
    const inCurrentMonth = cellDate.startsWith(monthPrefix);
    const selected = cellDate === state.selectedDate;
    const currentDay = cellDate === today();
    const reservations = calendarDateReservations(cellDate);
    const holiday = holidayName(cellDate);
    const visibleReservations = inCurrentMonth ? reservations.slice(0, 3) : [];
    const hiddenCount = inCurrentMonth ? Math.max(reservations.length - visibleReservations.length, 0) : 0;
    const accessibleLabel = `${formatFullDate(cellDate)}、${localizedBookingCount(reservations.length)}`;

    return `
      <button
        class="calendar-day-cell${inCurrentMonth ? "" : " is-outside"}${selected ? " is-selected" : ""}${currentDay ? " is-today" : ""}"
        type="button"
        data-calendar-date="${cellDate}"
        aria-pressed="${selected}"
        aria-label="${escapeHtml(accessibleLabel)}"
      >
        <span class="calendar-day-number">${inCurrentMonth ? day : ""}</span>
        ${inCurrentMonth && holiday ? `<span class="calendar-day-holiday">${escapeHtml(holiday)}</span>` : ""}
        <span class="calendar-day-events">
          ${visibleReservations
            .map(
              (reservation) => `
                <span
                  class="calendar-event"
                  style="--room-accent: ${escapeHtml(roomColor(reservation.room_name))}; --room-text: ${escapeHtml(roomTextColor(reservation.room_name))}; --room-border: ${escapeHtml(roomBorderColor(reservation.room_name))};"
                  title="${escapeHtml(`${reservation.start_time} - ${reservation.end_time} ${reservation.title || reservation.purpose}`)}"
                >
                  ${escapeHtml(reservation.title || reservation.purpose || "会議")}
                </span>
              `,
            )
            .join("")}
          ${hiddenCount ? `<span class="calendar-more-events">+${hiddenCount}件</span>` : ""}
        </span>
      </button>
    `;
  }).join("");

  const selectedReservations = calendarDateReservations(state.selectedDate);
  els.calendarSelectedDateLabel.textContent = formatFullDate(state.selectedDate);
  els.calendarSelectedDateCount.textContent = localizedBookingCount(selectedReservations.length);
  els.calendarSelectedAgenda.innerHTML = selectedReservations.length
    ? selectedReservations
        .map((reservation) => {
          const displayState = reservationStateClass(reservation);
          const participantCount = Number(reservation.participant_count || 0);
          const participantLabel = participantCount > 0 ? localizedPeopleCount(participantCount) : "人数未設定";
          return `
            <article
              class="calendar-agenda-item ${escapeHtml(displayState)}"
              data-reservation-detail="${reservation.id}"
              role="button"
              tabindex="0"
              style="--room-accent: ${escapeHtml(roomColor(reservation.room_name))}; --room-border: ${escapeHtml(roomBorderColor(reservation.room_name))};"
            >
              <div class="calendar-agenda-title-row">
                <span class="calendar-agenda-dot" aria-hidden="true"></span>
                <strong>${escapeHtml(reservation.title || reservation.purpose || "会議")}</strong>
              </div>
              <p class="calendar-agenda-time">${escapeHtml(reservation.start_time)}〜${escapeHtml(reservation.end_time)}・${escapeHtml(reservation.room_name)}</p>
              <div class="calendar-agenda-footer">
                <span>${escapeHtml(reservation.reserver_name || reservation.user_name || "-")}・${escapeHtml(participantLabel)}</span>
                ${statusBadge(displayState)}
              </div>
            </article>
          `;
        })
        .join("")
    : `
      <div class="calendar-agenda-empty">
        <span class="empty-state-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 9.5h16M9 14h6"/></svg>
        </span>
        <strong>この日の予約はありません。</strong>
        <span>${state.calendarRoomFilter === "all" ? "空いている時間を選んで新しい予約を作成できます。" : "選択中の会議室には予約がありません。"}</span>
        <button class="secondary-button compact-button" type="button" data-calendar-create>この日に予約する</button>
      </div>
    `;
}

async function moveTimelineDate(offset) {
  state.viewMode = "day";
  state.selectedDate = addDays(state.selectedDate, offset);
  els.dateInput.value = state.selectedDate;
  updateDatePolicy();
  setPageHeading("タイムライン", state.selectedDate);
  await loadReservations();
}

async function moveCalendarMonth(offset) {
  const nextMonth = addMonths(state.calendarMonth, offset);
  const selectedDay = dateParts(state.selectedDate).day;
  const { year, month } = dateParts(nextMonth);
  const selectedDayInMonth = Math.min(selectedDay, daysInMonth(nextMonth));

  state.calendarMonth = nextMonth;
  state.selectedDate = `${year}-${String(month).padStart(2, "0")}-${String(selectedDayInMonth).padStart(2, "0")}`;
  els.dateInput.value = state.selectedDate;
  updateDatePolicy();
  setPageHeading("カレンダー", state.selectedDate);
  await loadCalendarReservations();
}

function timelinePosition(minutes) {
  const start = timeToMinutes(BUSINESS_START_TIME);
  const end = timeToMinutes(BUSINESS_END_TIME);
  return ((minutes - start) / (end - start)) * 100;
}

function isPastReservation(reservation) {
  const endAt = new Date(`${normalizeDate(reservation.date)}T${reservation.end_time}:00+09:00`);
  return endAt.getTime() <= Date.now();
}

function reservationStateClass(reservation) {
  return isPastReservation(reservation) ? "ended" : normalizedStatus(reservation.status);
}

function reservationTimelineBlock(reservation) {
  const start = Math.max(timeToMinutes(reservation.start_time), timeToMinutes(BUSINESS_START_TIME));
  const end = Math.min(timeToMinutes(reservation.end_time), timeToMinutes(BUSINESS_END_TIME));
  const left = timelinePosition(start);
  const width = Math.max(timelinePosition(end) - left, 3);
  const displayState = reservationStateClass(reservation);
  return `
    <article
      class="timeline-booking ${escapeHtml(displayState)}"
      style="left: ${left}%; width: ${width}%; --room-accent: ${escapeHtml(roomColor(reservation.room_name))}; --room-text: ${escapeHtml(roomTextColor(reservation.room_name))}; --room-border: ${escapeHtml(roomBorderColor(reservation.room_name))};"
      title="${escapeHtml(reservation.title || reservation.purpose)}"
      role="button"
      tabindex="0"
      data-reservation-detail="${reservation.id}"
    >
      <strong>${escapeHtml(reservation.title || reservation.purpose)}</strong>
      <span>${displayState === "ended" ? "終了 ・ " : ""}${escapeHtml(reservation.start_time)} - ${escapeHtml(reservation.end_time)}</span>
    </article>
  `;
}

function reservationWeekItem(reservation) {
  const mine = reservation.user_id === state.user?.id;
  const canDelete = reservation.can_delete;
  const displayState = reservationStateClass(reservation);
  const owner = reservation.reserver_name || reservation.user_name || "-";
  return `
    <article
      class="week-reservation-item ${mine ? "mine" : ""} ${escapeHtml(displayState)}"
      data-reservation-detail="${reservation.id}"
      role="button"
      tabindex="0"
      style="--room-border: ${escapeHtml(roomBorderColor(reservation.room_name))}"
    >
      <span class="week-reservation-date">${escapeHtml(formatDateJa(reservation.date))}</span>
      <span class="week-reservation-main">
        <strong>${escapeHtml(reservation.title || reservation.purpose)}</strong>
        <span class="week-reservation-sub">${escapeHtml(reservation.start_time)} - ${escapeHtml(reservation.end_time)} / ${escapeHtml(owner)}</span>
      </span>
      <span class="week-reservation-badges">
        ${statusBadge(displayState)}
        ${specialRequestBadge(reservation)}
      </span>
      ${
        canDelete
          ? `<button class="link-button" data-delete-reservation="${reservation.id}" type="button">取消</button>`
          : ""
      }
    </article>
  `;
}

function reservationCard(reservation) {
  const mine = reservation.user_id === state.user.id;
  const canDelete = reservation.can_delete;
  const displayState = reservationStateClass(reservation);
  return `
    <article
      class="reservation-card ${mine ? "mine" : ""} ${escapeHtml(displayState)}"
      data-reservation-detail="${reservation.id}"
      role="button"
      tabindex="0"
      style="--room-accent: ${escapeHtml(roomColor(reservation.room_name))}; --room-border: ${escapeHtml(roomBorderColor(reservation.room_name))}"
    >
      <div class="reservation-line">
        <strong>${escapeHtml(reservation.title || reservation.purpose)}</strong>
        ${statusBadge(displayState)}
        ${specialRequestBadge(reservation)}
      </div>
      <span class="reservation-meta">
        ${escapeHtml(reservation.date)} ${escapeHtml(reservation.start_time)} - ${escapeHtml(reservation.end_time)}
      </span>
      <span class="reservation-meta">部署：${escapeHtml(reservation.department || "-")} / 予約者：${escapeHtml(reservation.reserver_name || reservation.user_name)}</span>
      <span class="reservation-meta">${escapeHtml(window.MEETING_I18N?.translate("参加人数") || "参加人数")}：${escapeHtml(localizedPeopleCount(reservation.participant_count))}</span>
      <span class="reservation-meta">備考：${escapeHtml(reservation.notes || "-")}</span>
      ${reservation.request_reason ? `<span class="reservation-meta">申請理由：${escapeHtml(reservation.request_reason)}</span>` : ""}
      ${reservation.admin_note ? `<span class="reservation-meta">管理メモ：${escapeHtml(reservation.admin_note)}</span>` : ""}
      ${
        canDelete
          ? `<button class="link-button" data-delete-reservation="${reservation.id}" type="button">予約を取消</button>`
          : ""
      }
    </article>
  `;
}

function statusBadge(status) {
  const normalized = normalizedStatus(status);
  return `<span class="status-pill ${escapeHtml(normalized)}">${escapeHtml(STATUS_LABELS[normalized] || normalized)}</span>`;
}

function specialRequestBadge(reservation) {
  if (!isSpecialReservation(reservation)) {
    return `<span class="status-pill neutral">特別申請：不要</span>`;
  }
  const status = normalizedStatus(reservation.status);
  const label =
    status === "pending"
      ? "特別申請：審査中"
      : status === "approved"
        ? "特別申請：承認済み"
        : "特別申請：却下";
  return `<span class="status-pill ${escapeHtml(status)}">${escapeHtml(label)}</span>`;
}

function renderUserNotifications() {
  const ownReservations = state.reservations.filter((reservation) => reservation.user_id === state.user?.id);
  const notices = [];
  const closedLabel = closedDayLabel(state.selectedDate);

  if (closedLabel) {
    notices.push({
      type: "warn",
      title: "休日のため予約できません",
      body: `${formatDateJa(state.selectedDate)} は ${closedLabel} です。勤務日を選択してください。`,
    });
  }

  for (const reservation of ownReservations) {
    if (!isSpecialReservation(reservation)) continue;
    const title = reservation.title || reservation.purpose;
    const status = normalizedStatus(reservation.status);
    if (status === "pending") {
      notices.push({
        type: "pending",
        title: "特別申請は審査中です",
        body: `${title} / ${reservation.date} ${reservation.start_time}-${reservation.end_time}`,
      });
    } else if (status === "approved") {
      notices.push({
        type: "ok",
        title: "特別申請が承認されました",
        body: `${title} / ${reservation.date} ${reservation.start_time}-${reservation.end_time}`,
      });
    } else if (status === "rejected") {
      notices.push({
        type: "warn",
        title: "特別申請が却下されました",
        body: `${title}${reservation.admin_note ? ` / ${reservation.admin_note}` : ""}`,
      });
    }
  }

  if (!notices.length) {
    els.userNotifications.innerHTML = `<p class="empty">通知はありません。</p>`;
    return;
  }

  els.userNotifications.innerHTML = notices
    .map(
      (notice) => `
        <article class="notice-item ${escapeHtml(notice.type)}">
          <strong>${escapeHtml(notice.title)}</strong>
          <span>${escapeHtml(notice.body)}</span>
        </article>
      `,
    )
    .join("");
}

function activeReservationsForDate(reservations, dateString) {
  const date = normalizeDate(dateString);
  return reservations
    .filter((reservation) => normalizeDate(reservation.date) === date && isApprovedReservation(reservation))
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}

function businessMinutesForReservation(reservation) {
  const start = Math.max(timeToMinutes(reservation.start_time), timeToMinutes(BUSINESS_START_TIME));
  const end = Math.min(timeToMinutes(reservation.end_time), timeToMinutes(BUSINESS_END_TIME));
  return Math.max(0, end - start);
}

function roomColor(roomName) {
  return ROOM_COLORS[roomName] || "#0f766e";
}

function roomTextColor(roomName) {
  return roomName === "Room D" ? "#1c1917" : "#ffffff";
}

function roomBorderColor(roomName) {
  return roomName === "Room D" ? "#cbd5e1" : roomColor(roomName);
}

function renderOverviewPanels() {
  renderSpecialRequestStatus();
  renderFloorOverview(els.floorOverview, state.reservations, state.selectedDate);
  renderTodayAgenda(els.todayAgenda, myRelevantReservations(state.reservations), state.selectedDate);
}

function renderSpecialRequestStatus() {
  if (!els.specialRequestStatus) return;
  const specialRequests = ownReservations(state.reservations)
    .filter((reservation) => isSpecialReservation(reservation))
    .sort((a, b) => b.start_at.localeCompare(a.start_at));

  if (!specialRequests.length) {
    els.specialRequestStatus.innerHTML = `<div class="empty-box">この期間の特別申請はありません。</div>`;
    return;
  }

  els.specialRequestStatus.innerHTML = specialRequests
    .map((reservation) => {
      const status = normalizedStatus(reservation.status);
      const stateClass = status === "pending" ? "pending" : status === "approved" ? "ok" : "warn";
      const stateText =
        status === "pending"
          ? "審査中"
          : status === "approved"
            ? "承認済み"
            : "却下";
      const note =
        status === "pending"
          ? "管理者の承認後に予約が確定します。"
          : status === "approved"
            ? "予約スケジュールに反映済みです。"
            : reservation.admin_note || "必要に応じて内容を見直して再申請してください。";
      return `
        <article
          class="special-status-card ${escapeHtml(stateClass)}"
          data-reservation-detail="${reservation.id}"
          role="button"
          tabindex="0"
        >
          <div>
            <strong>${escapeHtml(reservation.title || reservation.purpose)}</strong>
            <span>${escapeHtml(formatDateJa(reservation.date))} ${escapeHtml(reservation.start_time)} - ${escapeHtml(reservation.end_time)} ・ ${escapeHtml(reservation.room_name)}</span>
            <small>${escapeHtml(note)}</small>
          </div>
          <span class="status-pill ${escapeHtml(status)}">特別申請：${escapeHtml(stateText)}</span>
        </article>
      `;
    })
    .join("");
}

function renderAdminOverviewPanels() {
  renderFloorOverview(els.adminFloorOverview, state.adminReservations, today());
  renderTodayAgenda(els.adminTodayAgenda, state.adminReservations, today(), true);
}

const DASHBOARD_STAT_ICONS = [
  '<svg viewBox="0 0 24 24"><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5"/><path d="M12 7v5l3 2M16.5 3.5h4v4"/></svg>',
  '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 9.5h17M8 14h3M8 17h6"/></svg>',
  '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.75 19.5a5.25 5.25 0 0 1 10.5 0M17.25 7.5v6M14.25 10.5h6"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M7.5 3.75h9l3.25 3.25v13.25H4.25V3.75Z"/><path d="M16.5 3.75V7h3.25M8 12h8M8 16h5"/></svg>',
];

function renderDashboard() {
  if (!els.dashboardSummary || !state.user) return;

  const isAdmin = state.user.role === "admin";
  const allReservations = isAdmin ? state.adminReservations : state.reservations;
  const relevantReservations = isAdmin ? allReservations : myRelevantReservations(state.reservations);
  const todayReservations = activeReservationsForDate(relevantReservations, today());
  const specialReservations = (isAdmin ? allReservations : relevantReservations).filter((reservation) => isSpecialReservation(reservation));
  const pendingRequests = specialReservations.filter((reservation) => normalizedStatus(reservation.status) === "pending");
  const approvedReservations = relevantReservations.filter((reservation) => isApprovedReservation(reservation));

  const summaries = isAdmin
    ? [
        ["承認待ち", pendingRequests.length, pendingRequests.length ? "確認が必要です" : "未処理なし"],
        ["本日の予約", todayReservations.length, formatDateJa(today())],
        ["有効ユーザー", state.users.filter((user) => user.is_active).length, "現在利用可能"],
        ["承認済み予約", allReservations.filter((reservation) => isApprovedReservation(reservation)).length, "登録済み"],
      ]
    : [
        ["審査中の申請", pendingRequests.length, pendingRequests.length ? "結果をお待ちください" : "申請なし"],
        ["本日の予定", todayReservations.length, formatDateJa(today())],
        ["今週の予定", approvedReservations.filter((reservation) => reservation.date >= today()).length, "これからの予定"],
        ["参加予定", relevantReservations.filter((reservation) => isParticipantReservation(reservation) && isApprovedReservation(reservation)).length, "招待された会議"],
      ];

  els.dashboardSummary.innerHTML = summaries
    .map(
      ([label, value, caption], index) => `
        <article class="dashboard-stat ${index === 0 && pendingRequests.length ? "is-accent" : ""}">
          <span class="dashboard-stat-icon" aria-hidden="true">${DASHBOARD_STAT_ICONS[index]}</span>
          <div class="dashboard-stat-copy">
            <span class="dashboard-stat-label">${escapeHtml(label)}</span>
            <strong class="dashboard-stat-value${index === 0 && pendingRequests.length ? " is-accent" : ""}">${escapeHtml(value)}</strong>
            <small class="dashboard-stat-note">${escapeHtml(caption)}</small>
          </div>
        </article>
      `,
    )
    .join("");

  renderFloorOverview(els.dashboardFloorOverview, allReservations, today());
  if (els.dashboardAgendaTitle) {
    els.dashboardAgendaTitle.textContent = isAdmin ? "本日の予定" : "自分の予定";
  }
  if (els.dashboardAgendaCaption) {
    els.dashboardAgendaCaption.textContent = isAdmin ? "時刻順" : "自分が予約・参加する会議";
  }
  renderTodayAgenda(els.dashboardTodayAgenda, relevantReservations, today(), isAdmin);
  renderDashboardPending(pendingRequests, isAdmin);
}

function renderDashboardPending(pendingRequests, isAdmin) {
  if (!els.dashboardPendingPanel || !els.dashboardPendingList) return;

  const count = pendingRequests.length;
  els.dashboardPendingPanel.hidden = count === 0;
  if (els.sidebarPendingBadge) {
    els.sidebarPendingBadge.hidden = !isAdmin || count === 0;
    els.sidebarPendingBadge.textContent = count ? String(count) : "";
  }
  if (!count) return;

  if (els.dashboardPendingTitle) {
    els.dashboardPendingTitle.textContent = isAdmin ? "承認待ちの申請" : "特別申請状況";
  }
  if (els.dashboardPendingCaption) {
    els.dashboardPendingCaption.textContent = isAdmin
      ? `${count}件の申請内容を確認してください。`
      : "管理者の承認後に予約が確定します。";
  }

  els.dashboardPendingList.innerHTML = pendingRequests
    .slice(0, 3)
    .map((reservation) => {
      const title = reservation.title || reservation.purpose || "無題の予約";
      const requester = reservation.reserver_name || reservation.user_name || "-";
      const metadata = `${formatDateJa(reservation.date)} ・ ${reservation.start_time}-${reservation.end_time} ・ ${reservation.room_name}`;
      return `
        <article class="dashboard-pending-item" data-reservation-detail="${reservation.id}" role="button" tabindex="0">
          <span class="dashboard-pending-dot" style="background:${escapeHtml(roomColor(reservation.room_name))}" aria-hidden="true"></span>
          <div>
            <strong>${escapeHtml(title)}</strong>
            <small>${escapeHtml(metadata)}</small>
          </div>
          <span class="dashboard-pending-owner">${escapeHtml(isAdmin ? requester : "審査中")}</span>
        </article>
      `;
    })
    .join("");
}

function renderFloorOverview(container, reservations, dateString) {
  if (!container) return;
  const activeReservations = activeReservationsForDate(reservations, dateString);

  container.innerHTML = state.rooms
    .map((room) => {
      const roomReservations = activeReservations.filter((reservation) => reservation.room_id === room.id);
      const bookedMinutes = roomReservations.reduce((total, reservation) => total + businessMinutesForReservation(reservation), 0);
      const percent = Math.min(100, Math.round((bookedMinutes / BUSINESS_DAY_MINUTES) * 100));
      const nextReservation = roomReservations[0];
      return `
        <article class="room-overview-card" style="--room-accent: ${escapeHtml(roomColor(room.name))}; --room-border: ${escapeHtml(roomBorderColor(room.name))}">
          <div class="room-overview-head">
            <div>
              <i aria-hidden="true"></i>
              <strong>${escapeHtml(room.name)}</strong>
            </div>
            <span class="${roomReservations.length ? "is-busy" : "is-free"}">${roomReservations.length ? `${roomReservations.length}件` : "空き"}</span>
          </div>
          <div class="room-overview-bar" aria-hidden="true">
            <span style="width: ${percent}%"></span>
          </div>
          <div class="room-overview-foot">
            <p><strong>${percent}%</strong><span>稼働率</span></p>
            <small>${nextReservation ? `<b>次回</b> ${escapeHtml(nextReservation.start_time)} ${escapeHtml(nextReservation.title || nextReservation.purpose)}` : "本日は終日空いています"}</small>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTodayAgenda(container, reservations, dateString, includeOwner = false) {
  if (!container) return;
  const activeReservations = activeReservationsForDate(reservations, dateString);

  if (!activeReservations.length) {
    const dashboardEmpty = container === els.dashboardTodayAgenda;
    container.innerHTML = dashboardEmpty
      ? `
        <div class="dashboard-empty-state">
          <span class="empty-state-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 9.5h16M12 12.5v5M9.5 15h5"/></svg>
          </span>
          <strong>本日の予定はありません</strong>
          <p>空いている会議室から、新しい予定を登録できます。</p>
          <button class="secondary-button compact-button" type="button" data-dashboard-create>新しい予約を作成</button>
        </div>
      `
      : `<div class="empty-box">この日の予定はありません。</div>`;
    return;
  }

  container.innerHTML = activeReservations
    .map((reservation) => {
      const owner = includeOwner ? `<span>${escapeHtml(reservation.reserver_name || reservation.user_name)} / ${escapeHtml(reservation.user_email || "")}</span>` : "";
      const displayState = reservationStateClass(reservation);
      return `
        <article
          class="today-agenda-item ${escapeHtml(displayState)}"
          data-reservation-detail="${reservation.id}"
          role="button"
          tabindex="0"
          style="--room-accent: ${escapeHtml(roomColor(reservation.room_name))}; --room-border: ${escapeHtml(roomBorderColor(reservation.room_name))}"
        >
          <div>
            <strong>${escapeHtml(reservation.title || reservation.purpose)}</strong>
            <span>${escapeHtml(reservation.start_time)} - ${escapeHtml(reservation.end_time)} ・ ${escapeHtml(reservation.room_name)}</span>
            ${owner}
          </div>
          <div class="agenda-status">
            ${statusBadge(displayState)}
            ${durationMinutes(reservation.start_time, reservation.end_time) > STANDARD_RESERVATION_MINUTES ? specialRequestBadge(reservation) : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function ownReservations(reservations) {
  return reservations.filter((reservation) => reservation.user_id === state.user?.id);
}

function findReservation(id) {
  const reservationId = Number(id);
  return [...state.reservations, ...state.adminReservations].find((reservation) => reservation.id === reservationId);
}

function reservationDetailRow(label, value) {
  const displayValue = value === undefined || value === null || value === "" || value === "undefined名" ? "-" : value;
  return `
    <div class="detail-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(displayValue)}</strong>
    </div>
  `;
}

function openReservationDetail(id) {
  const reservation = findReservation(id);
  if (!reservation) return;
  const title = reservation.title || reservation.purpose;
  const duration = durationMinutes(reservation.start_time, reservation.end_time);
  const isSpecialRequest = duration > STANDARD_RESERVATION_MINUTES;
  const displayState = reservationStateClass(reservation);

  els.reservationDetailTitle.textContent = title;
  els.reservationDetailSubtitle.textContent = `${formatDateJa(reservation.date)} ${reservation.start_time} - ${reservation.end_time} / ${reservation.room_name}`;
  els.reservationDetailBody.innerHTML = `
    <div class="detail-status-line">
      ${statusBadge(displayState)}
      ${specialRequestBadge(reservation)}
    </div>
    <div class="detail-grid">
      ${reservationDetailRow("会議室", reservation.room_name)}
      ${reservationDetailRow("日時", `${formatDateJa(reservation.date)} ${reservation.start_time} - ${reservation.end_time}`)}
      ${reservationDetailRow("所要時間", `${duration}分`)}
      ${reservationDetailRow("部署", reservation.department)}
      ${reservationDetailRow("予約者", reservation.reserver_name || reservation.user_name)}
      ${reservationDetailRow("メール", reservation.user_email)}
      ${reservationDetailRow("参加人数", reservation.participant_count ? localizedPeopleCount(reservation.participant_count) : "-")}
      ${reservationDetailRow("参加者", formatAttendees(reservation.attendees))}
      ${reservationDetailRow("備考", reservation.notes)}
      ${isSpecialRequest ? reservationDetailRow("特別申請理由", reservation.request_reason) : ""}
      ${reservation.admin_note ? reservationDetailRow("管理メモ", reservation.admin_note) : ""}
    </div>
  `;

  const actions = [`<button class="secondary-button" type="button" data-close-modal>閉じる</button>`];
  const status = normalizedStatus(reservation.status);
  if (state.user?.role === "admin" && isSpecialRequest && status !== "approved") {
    actions.unshift(`<button class="secondary-button approve-action" type="button" data-detail-decision="approved" data-detail-id="${reservation.id}">承認</button>`);
    if (status !== "rejected") {
      actions.unshift(`<button class="secondary-button danger-action" type="button" data-detail-decision="rejected" data-detail-id="${reservation.id}">却下</button>`);
    }
  }
  if (reservation.can_delete) {
    actions.push(`<button class="secondary-button danger-action" type="button" data-detail-delete="${reservation.id}">${state.user?.role === "admin" ? "予約を削除" : "予約を取消"}</button>`);
  }
  els.reservationDetailActions.innerHTML = actions.join("");
  els.reservationModal.hidden = false;
}

function closeReservationDetail() {
  els.reservationModal.hidden = true;
  els.reservationDetailTitle.textContent = "予約詳細";
  els.reservationDetailSubtitle.textContent = "";
  els.reservationDetailBody.innerHTML = "";
  els.reservationDetailActions.innerHTML = "";
}

function reservationDeleteCopy(mode) {
  const adminMode = mode === "admin";
  return {
    kicker: adminMode ? "予約削除の確認" : "予約取消の確認",
    title: adminMode ? "この予約を削除しますか？" : "この予約を取り消しますか？",
    description: adminMode ? "削除する予約を確認してください。" : "取り消す予約を確認してください。",
    confirm: adminMode ? "予約を削除" : "予約を取消",
    pending: adminMode ? "削除しています..." : "取り消しています...",
  };
}

function reservationDeleteOwnerSummary(reservation) {
  const owner = reservation.reserver_name || reservation.user_name || "-";
  const language = window.MEETING_I18N?.language || "ja";
  if (language === "zh") return `预约人：${owner} ・ 预约编号 #${reservation.id}`;
  if (language === "en") return `Organizer: ${owner} · Booking #${reservation.id}`;
  return `予約者：${owner} ・ 予約 #${reservation.id}`;
}

function openReservationDeleteConfirm(id, mode = "user", trigger = document.activeElement) {
  const reservation = findReservation(id);
  if (!reservation || !els.reservationDeleteConfirmModal) return;
  const normalizedMode = mode === "admin" ? "admin" : "user";
  const copy = reservationDeleteCopy(normalizedMode);
  state.reservationDeleteRequest = {
    id: Number(reservation.id),
    mode: normalizedMode,
    trigger,
  };

  els.reservationDeleteConfirmKicker.textContent = copy.kicker;
  els.reservationDeleteConfirmTitle.textContent = copy.title;
  els.reservationDeleteConfirmDescription.textContent = copy.description;
  els.reservationDeleteBookingTitle.textContent = reservation.title || reservation.purpose || "予約";
  els.reservationDeleteBookingMeta.textContent =
    `${formatDateJa(reservation.date)} ${reservation.start_time} - ${reservation.end_time} ・ ${reservation.room_name}`;
  els.reservationDeleteBookingOwner.textContent = reservationDeleteOwnerSummary(reservation);
  els.confirmReservationDeleteButton.textContent = copy.confirm;
  els.confirmReservationDeleteButton.disabled = false;
  clearMessage(els.reservationDeleteConfirmMessage);
  els.reservationDeleteConfirmModal.hidden = false;
  window.requestAnimationFrame(() => els.cancelReservationDeleteButton.focus());
}

function closeReservationDeleteConfirm({ restoreFocus = true } = {}) {
  if (!els.reservationDeleteConfirmModal) return;
  const request = state.reservationDeleteRequest;
  els.reservationDeleteConfirmModal.hidden = true;
  els.confirmReservationDeleteButton.disabled = false;
  clearMessage(els.reservationDeleteConfirmMessage);
  state.reservationDeleteRequest = null;
  if (restoreFocus && request?.trigger?.isConnected) request.trigger.focus();
}

async function confirmReservationDelete() {
  const request = state.reservationDeleteRequest;
  if (!request || els.confirmReservationDeleteButton.disabled) return;
  const copy = reservationDeleteCopy(request.mode);
  els.confirmReservationDeleteButton.disabled = true;
  els.confirmReservationDeleteButton.textContent = copy.pending;
  clearMessage(els.reservationDeleteConfirmMessage);

  try {
    if (request.mode === "admin") {
      await adminDeleteReservation(request.id);
    } else {
      await deleteReservation(request.id);
    }
    closeReservationDeleteConfirm({ restoreFocus: false });
    if (!els.reservationModal.hidden) closeReservationDetail();
  } catch (error) {
    showMessage(els.reservationDeleteConfirmMessage, error.message, "warn");
    els.confirmReservationDeleteButton.disabled = false;
    els.confirmReservationDeleteButton.textContent = copy.confirm;
  }
}

function openReservationDetailFromEvent(event) {
  const detailTarget = event.target.closest("[data-reservation-detail]");
  if (!detailTarget) return false;
  openReservationDetail(detailTarget.dataset.reservationDetail);
  return true;
}

function updateDatePolicy() {
  const selectedDate = els.dateInput.value;
  if (!selectedDate) return;

  els.selectedDateLabel.textContent = `${formatDateJa(selectedDate)} の予約を作成します。`;
  const closedLabel = closedDayLabel(selectedDate);
  if (closedLabel) {
    els.calendarHint.textContent = `${formatDateJa(selectedDate)} は ${closedLabel} のため予約できません。`;
    els.calendarHint.className = "calendar-hint warn";
    els.reservationSubmitButton.disabled = true;
  } else {
    updateStartTimeOptions();
    const noStartOptions = !els.startTimeSelect.value;
    if (noStartOptions) {
      els.calendarHint.textContent = `${formatDateJa(selectedDate)} の予約可能時間は終了しました。`;
      els.calendarHint.className = "calendar-hint warn";
      els.reservationSubmitButton.disabled = true;
    } else {
      const startGuide =
        normalizeDate(selectedDate) === today()
          ? `現在時刻を過ぎた時間は選択できません。予約可能時間は${els.startTimeSelect.value}-19:00です。`
          : "予約可能時間は09:00-19:00です。";
      els.calendarHint.textContent = `${formatDateJa(selectedDate)} は勤務日です。${startGuide}`;
      els.calendarHint.className = "calendar-hint ok";
      els.reservationSubmitButton.disabled = false;
    }
  }
}

function updateDurationPolicy() {
  if (!els.startTimeSelect.value || !els.endTimeSelect.value) {
    els.specialRequestDetails.hidden = true;
    if (els.specialEndTimeField) {
      els.specialEndTimeField.hidden = false;
    }
    els.requestReasonInput.required = false;
    els.requestConfirmInput.required = false;
    if (!els.durationHint.textContent) {
      els.durationHint.textContent = "予約可能な開始時刻がありません。";
      els.durationHint.className = "calendar-hint warn";
    }
    return;
  }
  updateSpecialEndTimeOptions();
  const normalMinutes = durationMinutes(els.startTimeSelect.value, els.endTimeSelect.value);
  const recurrenceEnabled = els.recurrenceSelect?.value === "weekly";
  const recurrenceCount = recurrenceEnabled ? Number(els.recurrenceCountSelect?.value || 1) : 1;
  const specialEnabled = els.specialRequestToggle.checked;
  const approvalRequired = specialEnabled || recurrenceEnabled;
  const minutes = specialEnabled
    ? durationMinutes(els.startTimeSelect.value, els.specialEndTimeSelect.value)
    : normalMinutes;
  els.specialRequestDetails.hidden = !approvalRequired;
  if (els.specialEndTimeField) {
    els.specialEndTimeField.hidden = recurrenceEnabled && !specialEnabled;
  }
  els.requestReasonInput.required = false;
  els.requestConfirmInput.required = false;
  els.approvalStatusText.textContent = "特別申請：未提出";
  els.requestSummary.textContent = "";
  if (els.specialRequestToggle.disabled) {
    els.approvalStatusText.textContent = "特別申請：不可";
  }

  if (normalMinutes <= 0) {
    els.durationHint.textContent = "終了時刻は開始時刻より後にしてください。";
    els.durationHint.className = "calendar-hint warn";
    return;
  }
  if (normalMinutes < MIN_RESERVATION_MINUTES) {
    els.durationHint.textContent = "予約時間は30分以上にしてください。";
    els.durationHint.className = "calendar-hint warn";
    return;
  }

  if (!approvalRequired) {
    els.requestConfirmInput.checked = false;
    els.requestReasonInput.value = "";
    els.durationHint.textContent = `${normalMinutes}分の通常予約です。90分を超える場合は特別申請欄を使用してください。`;
    els.durationHint.className = "calendar-hint ok";
    return;
  }

  if (minutes > MAX_REQUEST_MINUTES) {
    els.durationHint.textContent = "予約時間は10時間以内にしてください。";
    els.durationHint.className = "calendar-hint warn";
    return;
  }

  els.requestReasonInput.required = true;
  els.requestConfirmInput.required = true;
  els.approvalStatusText.textContent = "特別申請：未提出";
  if (recurrenceEnabled && !specialEnabled) {
    els.requestSummary.textContent = `申請内容：毎週の繰り返し予約（${recurrenceCount}回） / ${els.startTimeSelect.value} - ${els.endTimeSelect.value}（${minutes}分）`;
    els.durationHint.textContent = `毎週の繰り返し予約は特別申請です。管理者承認後に各回の予約が確定します。`;
  } else if (recurrenceEnabled) {
    els.requestSummary.textContent = `申請内容：90分超過＋毎週の繰り返し予約（${recurrenceCount}回） / ${els.startTimeSelect.value} - ${els.specialEndTimeSelect.value}（${minutes}分）`;
    els.durationHint.textContent = `長時間の繰り返し予約です。管理者承認後に各回の予約が確定します。`;
  } else {
    els.requestSummary.textContent = `申請時間：${els.startTimeSelect.value} - ${els.specialEndTimeSelect.value}（${minutes}分、通常上限90分を超過）`;
    els.durationHint.textContent =
      state.user?.role === "admin"
        ? `${minutes}分の特別時間です。管理者として登録できます。`
        : `${minutes}分の特別申請です。管理者承認後に確定します。`;
  }
  els.durationHint.className = "calendar-hint warn";
}

async function createReservation(event) {
  event.preventDefault();
  clearMessage(els.reservationMessage);

  const selectedDate = els.dateInput.value;
  const specialEnabled = els.specialRequestToggle.checked;
  const recurrence = els.recurrenceSelect?.value || "none";
  const recurrenceCount = recurrence === "weekly" ? Number(els.recurrenceCountSelect?.value || 1) : 1;
  const recurrenceRequiresApproval = recurrence === "weekly";
  const approvalRequired = specialEnabled || recurrenceRequiresApproval;
  const finalEndTime = specialEnabled ? els.specialEndTimeSelect.value : els.endTimeSelect.value;
  const minutes = durationMinutes(els.startTimeSelect.value, finalEndTime);

  if (isClosedDate(selectedDate)) {
    showMessage(els.reservationMessage, "休日・祝日は予約できません。勤務日を選択してください。", "warn");
    return;
  }
  if (!els.startTimeSelect.value || isPastStartSelection(selectedDate, els.startTimeSelect.value)) {
    showMessage(els.reservationMessage, "現在時刻を過ぎた時間は予約できません。開始時刻を選び直してください。", "warn");
    updateStartTimeOptions();
    return;
  }
  if (minutes <= 0) {
    showMessage(els.reservationMessage, "終了時刻は開始時刻より後にしてください。", "warn");
    return;
  }
  if (minutes < MIN_RESERVATION_MINUTES) {
    showMessage(els.reservationMessage, "予約時間は30分以上にしてください。", "warn");
    return;
  }
  if (minutes > MAX_REQUEST_MINUTES) {
    showMessage(els.reservationMessage, "予約時間は10時間以内にしてください。", "warn");
    return;
  }
  if (!specialEnabled && minutes > STANDARD_RESERVATION_MINUTES) {
    showMessage(els.reservationMessage, "通常予約は90分以内です。90分を超える場合は特別申請欄を使用してください。", "warn");
    return;
  }
  if (approvalRequired && !els.requestReasonInput.value.trim()) {
    showMessage(els.reservationMessage, "特別申請理由を入力してください。", "warn");
    return;
  }
  if (approvalRequired && !els.requestConfirmInput.checked) {
    showMessage(els.reservationMessage, "特別申請の確認にチェックを入れてください。", "warn");
    return;
  }
  if (
    !els.titleInput.value.trim() ||
    !els.departmentInput.value.trim() ||
    !els.reserverNameInput.value.trim() ||
    !els.participantCountInput.value ||
    !els.notesInput.value.trim()
  ) {
    showMessage(els.reservationMessage, "すべての必須項目を入力してください。", "warn");
    return;
  }

  const submitButtonMarkup = els.reservationSubmitButton.innerHTML;
  els.reservationSubmitButton.disabled = true;
  els.reservationSubmitButton.classList.add("is-loading");
  els.reservationSubmitButton.innerHTML = `
    <span class="button-spinner" aria-hidden="true"></span>
    予約を登録中
  `;

  try {
    const reservation = await api("/api/reservations", {
      method: "POST",
      body: JSON.stringify({
        room_id: Number(els.roomSelect.value),
        date: selectedDate,
        start_time: els.startTimeSelect.value,
        end_time: finalEndTime,
        purpose: els.titleInput.value.trim(),
        title: els.titleInput.value.trim(),
        team: els.departmentInput.value.trim(),
        department: els.departmentInput.value.trim(),
        reserver_name: els.reserverNameInput.value.trim(),
        participant_count: Number(els.participantCountInput.value),
        attendee_user_ids: selectedAttendeeIds(),
        recurrence,
        recurrence_count: recurrenceCount,
        notes: els.notesInput.value.trim(),
        request_reason: els.requestReasonInput.value.trim(),
      }),
    });
    els.titleInput.value = "";
    els.departmentInput.value = "";
    els.reserverNameInput.value = state.user.name || "";
    els.notesInput.value = "";
    els.specialRequestToggle.checked = false;
    els.requestConfirmInput.checked = false;
    els.requestReasonInput.value = "";
    state.selectedAttendeeIds.clear();
    if (els.attendeeSearchInput) {
      els.attendeeSearchInput.value = "";
    }
    renderAttendeePicker();
    if (els.recurrenceSelect) {
      els.recurrenceSelect.value = "none";
    }
    if (els.recurrenceCountSelect) {
      els.recurrenceCountSelect.value = "1";
      els.recurrenceCountSelect.disabled = true;
    }
    updateDurationPolicy();
    showMessage(
      els.reservationMessage,
      recurrenceRequiresApproval
        ? `繰り返し予約の承認申請を${recurrenceCount}件送信しました。管理者の承認後に確定します。`
        : specialEnabled || normalizedStatus(reservation.status) === "pending"
        ? "長時間予約の承認申請を送信しました。管理者の承認後に確定します。"
        : "予約を作成しました。",
      "ok",
    );
    await loadReservations();
    if (state.user.role === "admin") {
      await loadAdminData();
    }
  } catch (error) {
    showMessage(els.reservationMessage, error.message, "warn");
  } finally {
    els.reservationSubmitButton.innerHTML = submitButtonMarkup;
    els.reservationSubmitButton.classList.remove("is-loading");
    updateDatePolicy();
    updateReservationLiveSummary();
  }
}

async function deleteReservation(id) {
  await api(`/api/reservations/${id}`, { method: "DELETE" });
  showMessage(els.reservationMessage, "予約を取消しました。", "ok");
  try {
    await loadReservations();
    if (state.user.role === "admin") {
      await loadAdminData();
    }
  } catch {
    showToast("予約は取り消されましたが、画面の再読み込みに失敗しました。", "warn");
  }
}

async function loadAdminData() {
  const [users, reservations, auditLogs] = await Promise.all([
    api("/api/admin/users"),
    api("/api/admin/reservations"),
    api("/api/admin/audit-logs"),
  ]);
  state.users = users;
  state.adminReservations = reservations;
  state.auditLogs = auditLogs;
  renderAdminSummary();
  renderAdminOverviewPanels();
  renderPendingApprovals();
  renderAdminReservations();
  renderAuditLogs();
  renderUsers();
  renderMessageRecipientOptions();
  renderDashboard();
}

async function sendAdminMailTest() {
  clearMessage(els.mailTestMessage);
  els.mailTestButton.disabled = true;
  try {
    const result = await api("/api/admin/mail/test", {
      method: "POST",
      body: JSON.stringify({ email: state.user?.email }),
    });
    showMessage(els.mailTestMessage, `テストメールを送信しました。送信先：${result.to}`, "ok");
  } catch (error) {
    showMessage(els.mailTestMessage, error.message, "warn");
  } finally {
    els.mailTestButton.disabled = false;
  }
}

async function downloadAdminReport(period) {
  clearMessage(els.reportMessage);
  const targetDate = els.reportDateInput?.value || state.selectedDate || today();
  const query = new URLSearchParams({
    period,
    target_date: targetDate,
    save: "true",
  });
  let response;
  try {
    response = await fetch(`/api/admin/reports/usage.csv?${query.toString()}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    const networkError = new Error("APIに接続できませんでした。ネットワークとAPIコンテナの状態を確認してください。");
    networkError.cause = error;
    throw networkError;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const reportError = new Error(
      response.status === 404
        ? apiUpdateMessage("CSVレポートの作成")
        : apiErrorMessage(data),
    );
    reportError.status = response.status;
    throw reportError;
  }

  const blob = await response.blob();
  if (!blob.size) {
    throw new Error("CSVの内容が空でした。APIログを確認してください。");
  }
  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  const filename = filenameMatch?.[1] || `meeting-report-${period}-${targetDate}.csv`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  const savedToNas = response.headers.get("x-report-saved") === "true";
  const auditFailed = response.headers.get("x-report-audit-error") === "true";
  if (savedToNas) {
    showMessage(
      els.reportMessage,
      auditFailed
        ? "CSVを作成してNASにも保存しました。操作ログの記録のみ失敗したため、APIログを確認してください。"
        : "CSVを作成しました。NASのreportsフォルダにも保存しました。",
      auditFailed ? "info" : "ok",
    );
  } else {
    showMessage(
      els.reportMessage,
      "CSVをダウンロードしました。NASのreportsフォルダへの保存は失敗しました。Container Manager のログで REPORT_DIR の権限を確認してください。",
      "warn",
    );
  }
}

async function handleReportDownload(period) {
  const buttons = [els.dailyReportButton, els.weeklyReportButton].filter(Boolean);
  buttons.forEach((button) => {
    button.dataset.idleLabel = button.textContent;
    button.textContent = "CSV作成中…";
    button.disabled = true;
  });
  try {
    await downloadAdminReport(period);
  } catch (error) {
    const message = state.apiVersion && state.apiVersion !== EXPECTED_API_VERSION
      ? apiUpdateMessage("CSVレポートの作成")
      : error.message;
    showMessage(els.reportMessage, message, error.status >= 500 ? "warn" : "info");
  } finally {
    buttons.forEach((button) => {
      button.textContent = button.dataset.idleLabel || button.textContent;
      delete button.dataset.idleLabel;
      button.disabled = false;
    });
  }
}

function renderAdminSummary() {
  const pendingCount = state.adminReservations.filter(
    (reservation) => isSpecialReservation(reservation) && normalizedStatus(reservation.status) === "pending",
  ).length;
  const activeToday = state.adminReservations.filter(
    (reservation) => reservation.date === today() && isApprovedReservation(reservation),
  ).length;
  const activeUsers = state.users.filter((user) => user.is_active).length;
  const approvedCount = state.adminReservations.filter((reservation) => isApprovedReservation(reservation)).length;
  if (els.adminNavPendingCount) els.adminNavPendingCount.textContent = pendingCount;
  if (els.adminNavReservationCount) els.adminNavReservationCount.textContent = state.adminReservations.length;
  if (els.adminNavUserCount) els.adminNavUserCount.textContent = activeUsers;
  if (els.sidebarPendingBadge) {
    els.sidebarPendingBadge.hidden = pendingCount === 0;
    els.sidebarPendingBadge.textContent = pendingCount ? String(pendingCount) : "";
  }

  els.adminSummary.innerHTML = [
    ["承認待ち", pendingCount],
    ["本日の予約", activeToday],
    ["有効ユーザー", activeUsers],
    ["承認済み予約", approvedCount],
  ]
    .map(
      ([label, value]) => `
        <article class="summary-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </article>
      `,
    )
    .join("");
}

function approvalRequestCard(reservation, { reviewed = false } = {}) {
  const status = normalizedStatus(reservation.status);
  const attendeeCount = Number(reservation.participant_count);
  const attendeeLabel = Number.isFinite(attendeeCount) && attendeeCount > 0 ? localizedPeopleCount(attendeeCount) : "人数未入力";
  const title = reservation.title || reservation.purpose || "無題の会議";
  const roomName = reservation.room_name || "-";
  const applicant = reservation.reserver_name || reservation.user_name || "-";
  const canReapprove = status === "rejected";
  const showNoteInput = status !== "approved";
  const actionMarkup = reviewed
    ? `
        <div class="approval-card-actions">
          <button class="table-text-button" data-reservation-detail="${reservation.id}" type="button">詳細</button>
          ${
            canReapprove
              ? `<button class="approval-action-button approve" data-admin-decision="${reservation.id}" data-next-status="approved" type="button">再承認する</button>`
              : ""
          }
        </div>
      `
    : `
        <div class="approval-card-actions">
          <button class="table-text-button" data-reservation-detail="${reservation.id}" type="button">詳細</button>
          <button class="approval-action-button reject" data-admin-decision="${reservation.id}" data-next-status="rejected" type="button">却下</button>
          <button class="approval-action-button approve" data-admin-decision="${reservation.id}" data-next-status="approved" type="button">承認する</button>
        </div>
      `;

  return `
    <article class="approval-request-card ${reviewed ? "reviewed" : "pending"}" style="--approval-room-color:${escapeHtml(roomColor(roomName))}">
      <div class="approval-request-marker" aria-hidden="true">${escapeHtml(roomName.slice(0, 1))}</div>
      <div class="approval-request-main">
        <div class="approval-request-title-row">
          <strong>${escapeHtml(title)}</strong>
          ${reviewed ? `${statusBadge(status)} ${specialRequestBadge(reservation)}` : `<span class="approval-request-label">特別申請</span>`}
        </div>
        <p class="approval-request-meta">
          <span class="room-cell-dot" style="background:${escapeHtml(roomColor(roomName))}" aria-hidden="true"></span>${escapeHtml(roomName)}
          <span aria-hidden="true">・</span>
          ${escapeHtml(formatDateJa(reservation.date))}
          <span aria-hidden="true">・</span>
          ${escapeHtml(reservation.start_time)}〜${escapeHtml(reservation.end_time)}
        </p>
        <p class="approval-request-applicant">申請者: ${escapeHtml(applicant)}・${escapeHtml(attendeeLabel)}</p>
        ${reservation.department ? `<p class="approval-request-detail">部署: ${escapeHtml(reservation.department)}</p>` : ""}
        ${reservation.request_reason ? `<p class="approval-request-reason"><span>申請理由</span>${escapeHtml(reservation.request_reason)}</p>` : ""}
        ${reservation.admin_note ? `<p class="approval-request-note"><span>管理メモ</span>${escapeHtml(reservation.admin_note)}</p>` : ""}
        ${
          showNoteInput
            ? `<label class="approval-note-field"><span>管理メモ</span><input data-admin-note="${reservation.id}" type="text" value="${escapeHtml(reservation.admin_note || "")}" placeholder="任意" /></label>`
            : ""
        }
      </div>
      ${actionMarkup}
    </article>
  `;
}

function renderPendingApprovals() {
  const specialRequests = state.adminReservations.filter((reservation) => isSpecialReservation(reservation));
  const pendingRequests = specialRequests
    .filter((reservation) => normalizedStatus(reservation.status) === "pending")
    .sort((a, b) => `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`));
  const reviewedRequests = specialRequests
    .filter((reservation) => normalizedStatus(reservation.status) !== "pending")
    .sort((a, b) => `${b.date} ${b.start_time}`.localeCompare(`${a.date} ${a.start_time}`));

  if (els.pendingApprovalCount) els.pendingApprovalCount.textContent = `${pendingRequests.length}件`;
  if (els.reviewedApprovalCount) els.reviewedApprovalCount.textContent = `${reviewedRequests.length}件`;
  if (els.approvalAlertTitle) {
    els.approvalAlertTitle.textContent = pendingRequests.length ? `${pendingRequests.length}件の承認待ちがあります` : "承認待ちの申請はありません";
  }
  if (els.approvalAlertText) {
    els.approvalAlertText.textContent = pendingRequests.length
      ? "申請内容を確認して、承認または却下を選択してください。"
      : "新しい特別申請が届くと、ここに表示されます。";
  }

  els.pendingTableBody.innerHTML = pendingRequests.length
    ? pendingRequests.map((reservation) => approvalRequestCard(reservation)).join("")
    : `
        <div class="approval-empty">
          <strong>承認待ちの申請はありません。</strong>
          <span>新しい特別申請が届くと、ここに表示されます。</span>
        </div>
      `;

  if (!els.reviewedApprovalList) return;
  els.reviewedApprovalList.innerHTML = reviewedRequests.length
    ? reviewedRequests.map((reservation) => approvalRequestCard(reservation, { reviewed: true })).join("")
    : `<div class="approval-empty compact"><strong>審査済みの特別申請はありません。</strong></div>`;
}

function renderAdminReservations() {
  const query = els.adminReservationSearchInput?.value.trim().toLocaleLowerCase("ja-JP") || "";
  const reservations = state.adminReservations.filter((reservation) => {
    const statusMatches = state.adminReservationFilter === "all" || normalizedStatus(reservation.status) === state.adminReservationFilter;
    if (!statusMatches) return false;
    if (!query) return true;

    const searchText = [
      reservation.title,
      reservation.purpose,
      reservation.room_name,
      reservation.reserver_name,
      reservation.user_name,
      reservation.user_email,
      reservation.department,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("ja-JP");
    return searchText.includes(query);
  });

  els.adminReservationFilterButtons.forEach((button) => {
    const active = button.dataset.adminReservationFilter === state.adminReservationFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  if (els.adminReservationCount) {
    els.adminReservationCount.textContent = `${reservations.length}件を表示`;
  }

  if (!reservations.length) {
    els.adminReservationTableBody.innerHTML = `<tr><td class="empty-cell" colspan="7">条件に一致する予約データはありません。</td></tr>`;
    return;
  }

  els.adminReservationTableBody.innerHTML = reservations
    .map(
      (reservation) => {
        const attendeeCount = Number(reservation.participant_count);
        const attendeeLabel = Number.isFinite(attendeeCount) && attendeeCount > 0 ? localizedPeopleCount(attendeeCount) : "-";
        return `
        <tr>
          <td>
            <div class="admin-reservation-title">
              <strong>${escapeHtml(reservation.title || reservation.purpose)}</strong>
              <span>予約 #${escapeHtml(reservation.id)}</span>
            </div>
          </td>
          <td><span class="admin-room-cell"><span class="room-cell-dot" style="background:${escapeHtml(roomColor(reservation.room_name))}" aria-hidden="true"></span>${escapeHtml(reservation.room_name)}</span></td>
          <td>
            <time class="admin-reservation-time" datetime="${escapeHtml(`${reservation.date}T${reservation.start_time}`)}">
              <strong>${escapeHtml(formatDateJa(reservation.date))}</strong>
              <span>${escapeHtml(reservation.start_time)}〜${escapeHtml(reservation.end_time)}</span>
            </time>
          </td>
          <td>
            <div class="admin-reservation-owner">
              <span aria-hidden="true">${escapeHtml(Array.from((reservation.reserver_name || reservation.user_name || "•").trim())[0] || "•")}</span>
              <div><strong>${escapeHtml(reservation.reserver_name || reservation.user_name)}</strong><small>${escapeHtml(reservation.user_email)}</small></div>
            </div>
          </td>
          <td><span class="participant-count-pill">${escapeHtml(attendeeLabel)}</span></td>
          <td>${statusBadge(reservation.status)}</td>
          <td class="reservation-management-actions">
            <button class="table-icon-button" data-reservation-detail="${reservation.id}" type="button" title="予約詳細" aria-label="予約詳細">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 10.5v6M12 7.5h.01"/></svg>
            </button>
            <button class="table-icon-button danger" data-admin-delete-reservation="${reservation.id}" type="button" title="予約を削除" aria-label="予約を削除">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7h15M9 3.75h6L16 7H8l1-3.25ZM7 7l.75 13h8.5L17 7M10 11v5M14 11v5"/></svg>
            </button>
          </td>
        </tr>
      `;
      },
    )
    .join("");
}

const AUDIT_ACTION_LABELS = {
  "auth.login": "ログイン",
  "auth.login_failed": "ログイン失敗",
  "auth.password_changed": "パスワード変更",
  "auth.password_changed_public": "パスワード変更",
  "auth.password_reset_code_sent": "確認コード送信",
  "auth.password_reset_requested_unknown": "未登録メールの再設定依頼",
  "auth.password_reset_completed": "パスワード再設定",
  "auth.initial_password_changed": "初期パスワード変更",
  "reservation.created": "予約作成",
  "reservation.deleted": "予約取消",
  "admin.reservation_decided": "予約承認・却下",
  "admin.reservation_deleted": "予約削除",
  "admin.user_created": "ユーザー追加",
  "admin.user_updated": "ユーザー更新",
  "admin.user_disabled": "ユーザー停止",
  "admin.user_deleted": "ユーザー削除",
  "admin.message_sent": "メッセージ送信",
  "admin.report_exported": "レポート出力",
  "profile.updated": "プロフィール更新",
};

const AUDIT_DETAIL_LABELS = {
  email: "メール",
  name: "氏名",
  role: "権限",
  room: "会議室",
  title: "会議件名",
  start: "開始",
  end: "終了",
  status: "状態",
  admin_note: "管理メモ",
  is_active: "有効",
  password_reset_by_admin: "管理者によるパスワード再設定",
  department: "部署",
  avatar: "プロフィール画像",
  recipient: "送信先",
  recipient_user_id: "送信先ユーザー",
  period: "集計期間",
  target_date: "基準日",
  filename: "ファイル",
  saved_path: "NAS保存",
  save_error: "保存エラー",
  reference: "参照ID",
  deleted_user: "削除ユーザー",
  detached_audit_logs: "引継ぎログ",
  from: "変更前",
  to: "変更後",
  updated: "更新",
};

const AUDIT_TARGET_LABELS = {
  user: "ユーザー",
  reservation: "予約",
  report: "レポート",
  message: "メッセージ",
};

function formatAuditTime(value) {
  if (!value) return "-";
  const normalized = String(value).includes("T") ? value : String(value).replace(" ", "T");
  const date = new Date(normalized.endsWith("Z") ? normalized : `${normalized}+09:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function auditActionCategory(action) {
  const value = String(action || "");
  if (value.startsWith("auth.")) return "auth";
  if (value.includes("reservation")) return "reservation";
  if (value.includes("user") || value === "profile.updated") return "user";
  return "system";
}

function formatAuditBoolean(value) {
  return value ? "はい" : "いいえ";
}

function formatAuditValue(key, value, depth = 0) {
  if (key === "period") {
    return { daily: "日次", weekly: "週次" }[value] || String(value);
  }
  if (key === "status") return STATUS_LABELS[value] || String(value);
  if (key === "role") return value === "admin" ? "管理者" : value === "member" ? "一般" : String(value);
  if (key === "saved_path") return value ? "保存済み" : "未保存";
  if (key === "avatar" && value && typeof value === "object") {
    return value.updated ? "画像を更新" : "画像を削除";
  }
  if (value && typeof value === "object" && !Array.isArray(value) && ("from" in value || "to" in value)) {
    const before = value.from === null || value.from === undefined || value.from === "" ? "未設定" : formatAuditValue("from", value.from, depth + 1);
    const after = value.to === null || value.to === undefined || value.to === "" ? "未設定" : formatAuditValue("to", value.to, depth + 1);
    return `${before} → ${after}`;
  }
  if (key === "deleted_user" && value && typeof value === "object") {
    return [value.name, value.email].filter(Boolean).join(" / ") || "削除済みユーザー";
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatAuditValue(key, item, depth + 1)).join(", ");
  }
  if (value && typeof value === "object") {
    if (depth >= 2) return JSON.stringify(value);
    return Object.entries(value)
      .filter(([, nestedValue]) => nestedValue !== null && nestedValue !== undefined && nestedValue !== "")
      .map(([nestedKey, nestedValue]) => `${AUDIT_DETAIL_LABELS[nestedKey] || nestedKey}: ${formatAuditValue(nestedKey, nestedValue, depth + 1)}`)
      .join(" / ");
  }
  if (typeof value === "boolean") return formatAuditBoolean(value);
  return String(value);
}

function formatAuditDetailEntries(detail) {
  if (!detail) return [];
  try {
    const parsed = JSON.parse(detail);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [{ label: "", value: String(detail) }];
    }
    return Object.entries(parsed)
      .filter(([, value]) => value !== null && value !== undefined && value !== "")
      .filter(([key, value]) => !(key === "save_error" && value === false))
      .map(([key, value]) => ({
        label: AUDIT_DETAIL_LABELS[key] || key,
        value: formatAuditValue(key, value).slice(0, 180),
      }));
  } catch {
    return [{ label: "", value: String(detail).slice(0, 240) }];
  }
}

function renderAuditDetail(detail) {
  const entries = formatAuditDetailEntries(detail);
  if (!entries.length) return '<span class="audit-empty-value">—</span>';
  return entries
    .map(
      ({ label, value }) => `
        <span class="audit-detail-item">
          ${label ? `<span class="audit-detail-label">${escapeHtml(label)}</span>` : ""}
          <span class="audit-detail-value">${escapeHtml(value)}</span>
        </span>
      `,
    )
    .join("");
}

function formatAuditTarget(log) {
  const type = log.target_type ? AUDIT_TARGET_LABELS[log.target_type] || log.target_type : "";
  if (!type && !log.target_id) return "—";
  return [type, log.target_id ? `#${log.target_id}` : ""].filter(Boolean).join(" ");
}

function formatAuditTimeParts(value) {
  const formatted = formatAuditTime(value);
  const [date = "—", time = ""] = formatted.split(/\s+/);
  return { date, time };
}

function auditSearchText(log) {
  return [
    log.actor_name,
    log.actor_email,
    AUDIT_ACTION_LABELS[log.action] || log.action,
    formatAuditTarget(log),
    ...formatAuditDetailEntries(log.detail).flatMap((entry) => [entry.label, entry.value]),
    log.ip_address,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ja-JP");
}

function renderAuditLogs() {
  if (!els.auditTableBody) return;
  const query = state.auditSearch.trim().toLocaleLowerCase("ja-JP");
  const visibleLogs = state.auditLogs.filter((log) => {
    const categoryMatches = state.auditFilter === "all" || auditActionCategory(log.action) === state.auditFilter;
    return categoryMatches && (!query || auditSearchText(log).includes(query));
  });

  els.auditFilterButtons.forEach((button) => {
    const active = button.dataset.auditFilter === state.auditFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  if (els.auditResultCount) {
    els.auditResultCount.textContent = visibleLogs.length === state.auditLogs.length
      ? `${state.auditLogs.length} 件`
      : `${visibleLogs.length} / ${state.auditLogs.length} 件`;
  }

  if (!visibleLogs.length) {
    const message = state.auditLogs.length ? "条件に一致する操作ログはありません。" : "操作ログはまだありません。";
    els.auditTableBody.innerHTML = `<tr><td class="empty-cell audit-empty-cell" colspan="6">${message}</td></tr>`;
    return;
  }

  els.auditTableBody.innerHTML = visibleLogs
    .map(
      (log) => {
        const time = formatAuditTimeParts(log.created_at);
        const category = auditActionCategory(log.action);
        const actorName = log.actor_name || "システム";
        const actorInitial = Array.from(actorName.trim())[0] || "•";
        const ipAddress = log.ip_address || "—";
        return `
        <tr>
          <td>
            <time class="audit-time" datetime="${escapeHtml(log.created_at || "")}">
              <strong>${escapeHtml(time.date)}</strong>
              <span>${escapeHtml(time.time)}</span>
            </time>
          </td>
          <td>
            <div class="audit-actor">
              <span class="audit-actor-avatar" aria-hidden="true">${escapeHtml(actorInitial)}</span>
              <span class="audit-actor-copy">
                <strong>${escapeHtml(actorName)}</strong>
                <span title="${escapeHtml(log.actor_email || "")}">${escapeHtml(log.actor_email || "自動処理")}</span>
              </span>
            </div>
          </td>
          <td><span class="audit-action-badge audit-action-${category}">${escapeHtml(AUDIT_ACTION_LABELS[log.action] || log.action)}</span></td>
          <td><span class="audit-target">${escapeHtml(formatAuditTarget(log))}</span></td>
          <td class="audit-detail"><div class="audit-detail-list">${renderAuditDetail(log.detail)}</div></td>
          <td><code class="audit-ip" title="${escapeHtml(ipAddress)}">${escapeHtml(ipAddress)}</code></td>
        </tr>
      `;
      },
    )
    .join("");
}

async function updateReservationStatus(id, status, note) {
  clearMessage(els.adminApprovalMessage);
  try {
    await api(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, admin_note: note }),
    });
    showMessage(els.adminApprovalMessage, status === "approved" ? "予約を承認しました。" : "予約を却下しました。", "ok");
    await loadAdminData();
    await loadReservations();
  } catch (error) {
    showMessage(els.adminApprovalMessage, error.message, "warn");
  }
}

async function adminDeleteReservation(id) {
  clearMessage(els.adminReservationMessage);
  await api(`/api/admin/reservations/${id}`, { method: "DELETE" });
  showMessage(els.adminReservationMessage, "予約を削除しました。", "ok");
  try {
    await loadAdminData();
    await loadReservations();
  } catch {
    showToast("予約は削除されましたが、画面の再読み込みに失敗しました。", "warn");
  }
}

function renderUsers() {
  const query = state.userSearch.trim().toLocaleLowerCase("ja-JP");
  const visibleUsers = state.users.filter((user) => {
    if (!query) return true;
    return [user.name, user.email, user.department || ""].some((value) => String(value).toLocaleLowerCase("ja-JP").includes(query));
  });
  els.userListCount.textContent = `${visibleUsers.length}名のユーザー`;
  els.userTableBody.innerHTML = visibleUsers.length
    ? visibleUsers
    .map(
      (user) => `
        <tr>
          <td>
            <div class="user-name-cell">
              <span class="user-row-avatar${safeAvatarDataUrl(user.avatar_data_url) ? " has-image" : ""}" aria-hidden="true">${avatarMarkup(user)}</span>
              <strong>${escapeHtml(user.name)}</strong>
            </div>
          </td>
          <td>
            <a class="user-email-link" href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a>
          </td>
          <td>
            <span class="user-department">${escapeHtml(user.department || "未設定")}</span>
          </td>
          <td>
            <span class="role-pill ${user.role === "admin" ? "admin" : "user"}">${user.role === "admin" ? "管理者" : "一般"}</span>
          </td>
          <td>
            <span class="status-pill ${user.is_active ? "active" : "disabled"}">${user.is_active ? "有効" : "停止"}</span>
            ${user.must_change_password ? `<span class="status-pill pending">初回変更待ち</span>` : ""}
          </td>
          <td>
            <button class="icon-action-button" data-edit-user="${user.id}" type="button" title="${escapeHtml(user.name)}を編集" aria-label="${escapeHtml(user.name)}を編集">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 16.5-.75 3.25L7.5 19l10.75-10.75-2.5-2.5L5 16.5Z"/><path d="m14.75 6.75 2.5 2.5M12 19.5h7.5"/></svg>
            </button>
          </td>
        </tr>
      `,
    )
    .join("")
    : `<tr><td class="empty-cell" colspan="6">条件に一致するユーザーはいません。</td></tr>`;
}

async function createUser(event) {
  event.preventDefault();
  clearMessage(els.userMessage);
  if (state.editingUserId) {
    const editingUser = state.users.find((user) => user.id === state.editingUserId);
    if (!editingUser) return;
    const payload = {
      name: els.userNameInput.value.trim(),
      email: els.userEmailInput.value.trim(),
      department: els.userDepartmentInput.value.trim(),
    };
    if (editingUser.id !== state.user.id) {
      payload.role = els.userRoleSelect.value;
    }
    if (els.userPasswordInput.value) {
      payload.password = els.userPasswordInput.value;
    }
    const updated = await updateUser(editingUser.id, payload);
    if (updated) closeUserEditor();
    return;
  }
  try {
    await api("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({
        name: els.userNameInput.value.trim(),
        email: els.userEmailInput.value.trim(),
        department: els.userDepartmentInput.value.trim(),
        password: els.userPasswordInput.value,
        role: els.userRoleSelect.value,
      }),
    });
    showMessage(els.userMessage, "ユーザーを追加しました。", "ok");
    await loadAdminData();
    closeUserEditor();
  } catch (error) {
    showMessage(els.userMessage, error.message, "warn");
  }
}

async function updateUser(userId, payload) {
  clearMessage(els.userMessage);
  try {
    await api(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    showMessage(els.userMessage, "ユーザー情報を更新しました。", "ok");
    await loadAdminData();
    const currentUser = state.users.find((user) => user.id === state.user.id);
    if (currentUser) {
      state.user = currentUser;
      if (state.user.must_change_password) {
        showForcePassword();
      } else {
        showApp();
      }
    }
    return true;
  } catch (error) {
    showMessage(els.userMessage, error.message, "warn");
    await loadAdminData();
    return false;
  }
}

function openUserEditor(userId = null) {
  const user = userId ? state.users.find((item) => item.id === userId) : null;
  state.editingUserId = user?.id || null;
  els.userForm.reset();
  clearMessage(els.userMessage);
  const isEditing = Boolean(user);
  const isSelf = user?.id === state.user?.id;
  els.userEditorTitle.textContent = isEditing ? "ユーザーを編集" : "ユーザーを追加";
  els.userEditorSubtitle.textContent = isEditing ? "氏名、メールアドレス、部署、権限、利用状態を更新します。" : "新しい利用者の初期情報を登録します。";
  els.userPasswordLabel.textContent = isEditing ? "新しいパスワード（変更する場合のみ）" : "初期パスワード";
  els.userPasswordInput.required = !isEditing;
  els.userEditorSubmitButton.textContent = isEditing ? "変更を保存" : "ユーザーを追加";
  els.userRoleSelect.disabled = Boolean(isEditing && isSelf);
  els.userEditorStatusActions.hidden = !isEditing || isSelf;
  els.userEditorDeleteActions.hidden = true;
  els.userDeleteHelp.textContent = "";
  els.openUserDeleteConfirmButton.disabled = true;

  if (user) {
    els.userNameInput.value = user.name;
    els.userEmailInput.value = user.email;
    els.userDepartmentInput.value = user.department || "";
    els.userRoleSelect.value = user.role;
    els.toggleUserStatusButton.textContent = user.is_active ? "このユーザーを停止" : "このユーザーを有効化";
    els.toggleUserStatusButton.dataset.userId = user.id;
    els.toggleUserStatusButton.dataset.nextActive = user.is_active ? "false" : "true";

    const canDelete = !isSelf && user.role !== "admin" && !user.is_active;
    els.userEditorDeleteActions.hidden = isSelf || user.role === "admin";
    if (!els.userEditorDeleteActions.hidden) {
      els.userDeleteHelp.textContent = canDelete
        ? "停止済みで、予約・参加履歴がない一般ユーザーのみ削除できます。削除後は元に戻せません。"
        : "削除するには、先にこのユーザーを停止してください。予約・参加履歴がある場合も削除できません。";
      els.openUserDeleteConfirmButton.disabled = !canDelete;
      els.openUserDeleteConfirmButton.dataset.userId = String(user.id);
    }
  }
  els.userEditorModal.hidden = false;
  els.userNameInput.focus();
}

function closeUserEditor() {
  els.userEditorModal.hidden = true;
  state.editingUserId = null;
  els.userForm.reset();
  els.userPasswordInput.required = true;
  els.userRoleSelect.disabled = false;
  els.userEditorStatusActions.hidden = true;
  els.userEditorDeleteActions.hidden = true;
  closeUserDeleteConfirm();
}

function canDeleteUser(user) {
  return Boolean(
    user
    && state.user
    && user.id !== state.user.id
    && user.role !== "admin"
    && !user.is_active,
  );
}

function openUserDeleteConfirm(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!canDeleteUser(user)) {
    showMessage(els.userMessage, "削除できるのは、停止済みで予約・参加履歴のない一般ユーザーのみです。", "warn");
    return;
  }

  state.deletingUserId = user.id;
  els.userDeleteConfirmText.classList.remove("dialog-error");
  els.userDeleteConfirmText.textContent = `「${user.name}（${user.email}）」を完全に削除します。この操作は元に戻せません。`;
  els.confirmUserDeleteButton.disabled = false;
  els.userDeleteConfirmModal.hidden = false;
  els.confirmUserDeleteButton.focus();
}

function closeUserDeleteConfirm() {
  if (!els.userDeleteConfirmModal) return;
  els.userDeleteConfirmModal.hidden = true;
  state.deletingUserId = null;
  els.confirmUserDeleteButton.disabled = false;
  els.userDeleteConfirmText.classList.remove("dialog-error");
}

async function confirmUserDeleted(userId) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const users = await api(`/api/admin/users?deleted_user=${userId}&refresh=${Date.now()}-${attempt}`, {
      cache: "no-store",
    });
    state.users = users;
    renderUsers();
    if (!users.some((item) => item.id === userId)) {
      return true;
    }
    if (attempt < 2) {
      await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  return false;
}

async function deleteUser() {
  const user = state.users.find((item) => item.id === state.deletingUserId);
  if (!canDeleteUser(user)) {
    els.userDeleteConfirmText.textContent = "削除できるのは、停止済みで予約・参加履歴のない一般ユーザーのみです。";
    els.userDeleteConfirmText.classList.add("dialog-error");
    return;
  }

  els.confirmUserDeleteButton.disabled = true;
  els.userDeleteConfirmText.textContent = `「${user.name}」を削除しています...`;
  try {
    const deletedUserId = user.id;
    const result = await api(`/api/admin/users/${deletedUserId}`, { method: "DELETE" });
    if (!result?.ok) {
      throw new Error("削除APIから完了確認を取得できませんでした。");
    }
    if (result.deleted_user_id != null && Number(result.deleted_user_id) !== deletedUserId) {
      throw new Error("削除APIの対象ユーザーが一致しませんでした。");
    }

    state.users = state.users.filter((item) => item.id !== deletedUserId);
    renderUsers();
    const deleted = await confirmUserDeleted(deletedUserId);
    if (!deleted) {
      const versionResult = await api(`/api/version?refresh=${Date.now()}`, { cache: "no-store" }).catch(() => ({}));
      const activeVersion = versionResult?.version || "不明";
      throw new Error(`削除結果をデータベースで確認できませんでした。現在のAPI：${activeVersion}。APIコンテナを再構築してください。`);
    }
    await loadAdminData();
    if (state.users.some((item) => item.id === deletedUserId)) {
      throw new Error("削除後の再読込でユーザーが復元されました。APIコンテナを再構築してください。");
    }
    closeUserDeleteConfirm();
    closeUserEditor();
    showToast("ユーザーを完全に削除しました。");
  } catch (error) {
    const deploymentHint = [404, 405].includes(error.status)
      ? " APIコンテナを最新版で再構築してください。"
      : "";
    els.userDeleteConfirmText.textContent = `${error.message}${deploymentHint}`;
    els.userDeleteConfirmText.classList.add("dialog-error");
    els.confirmUserDeleteButton.disabled = false;
  }
}

function openAuthDialog(dialog, emailInput) {
  const loginEmail = els.loginEmail.value.trim();
  if (loginEmail) {
    emailInput.value = loginEmail;
  }
  dialog.hidden = false;
  window.setTimeout(() => emailInput.focus(), 0);
}

function closeAuthDialog(dialog, form, message, opener) {
  dialog.hidden = true;
  form.reset();
  clearMessage(message);
  opener.focus();
}

async function changePassword(event) {
  event.preventDefault();
  clearMessage(els.passwordMessage);

  if (!els.passwordEmailInput.value.trim()) {
    showMessage(els.passwordMessage, "メールアドレスを入力してください。", "warn");
    return;
  }
  if (els.newPasswordInput.value !== els.confirmPasswordInput.value) {
    showMessage(els.passwordMessage, "新しいパスワードが一致しません。", "warn");
    return;
  }

  try {
    await api("/api/auth/change-password-public", {
      method: "POST",
      body: JSON.stringify({
        email: els.passwordEmailInput.value.trim(),
        current_password: els.currentPasswordInput.value,
        new_password: els.newPasswordInput.value,
      }),
    });
    els.passwordForm.reset();
    showMessage(els.passwordMessage, "パスワードを変更しました。", "ok");
  } catch (error) {
    showMessage(els.passwordMessage, error.message, "warn");
  }
}

async function sendForgotPasswordCode() {
  clearMessage(els.forgotPasswordMessage);
  if (!els.forgotEmailInput.value.trim()) {
    showMessage(els.forgotPasswordMessage, "メールアドレスを入力してください。", "warn");
    return;
  }

  try {
    await api("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: els.forgotEmailInput.value.trim() }),
    });
    showMessage(
      els.forgotPasswordMessage,
      "確認コードを送信しました。メールを確認し、下の欄に入力してください。",
      "ok",
    );
  } catch (error) {
    const message =
      error.message === "Not Found"
        ? "パスワード再設定APIがまだ更新されていません。管理者に連絡して、APIコンテナを再構築してください。"
        : error.message;
    showMessage(els.forgotPasswordMessage, message, "warn");
  }
}

async function resetForgottenPassword(event) {
  event.preventDefault();
  clearMessage(els.forgotPasswordMessage);

  const code = els.resetCodeInput.value.trim();
  if (code.length !== 6) {
    showMessage(els.forgotPasswordMessage, "6桁の確認コードを入力してください。", "warn");
    return;
  }
  if (els.resetNewPasswordInput.value !== els.resetConfirmPasswordInput.value) {
    showMessage(els.forgotPasswordMessage, "新しいパスワードが一致しません。", "warn");
    return;
  }

  try {
    await api("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        email: els.forgotEmailInput.value.trim(),
        code,
        new_password: els.resetNewPasswordInput.value,
      }),
    });
    els.forgotPasswordForm.reset();
    showMessage(els.forgotPasswordMessage, "パスワードを再設定しました。新しいパスワードでログインしてください。", "ok");
  } catch (error) {
    const message =
      error.message === "Not Found"
        ? "パスワード再設定APIがまだ更新されていません。管理者に連絡して、APIコンテナを再構築してください。"
        : error.message;
    showMessage(els.forgotPasswordMessage, message, "warn");
  }
}

async function completeInitialPassword(event) {
  event.preventDefault();
  clearMessage(els.forcePasswordMessage);

  if (els.forceNewPasswordInput.value !== els.forceConfirmPasswordInput.value) {
    showMessage(els.forcePasswordMessage, "新しいパスワードが一致しません。", "warn");
    return;
  }

  try {
    const data = await api("/api/auth/complete-initial-password", {
      method: "POST",
      body: JSON.stringify({ new_password: els.forceNewPasswordInput.value }),
    });
    state.user = data.user;
    els.forcePasswordForm.reset();
    showApp();
    await loadInitialData();
  } catch (error) {
    showMessage(els.forcePasswordMessage, error.message, "warn");
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearLoginError();
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: els.loginEmail.value.trim(),
        password: els.loginPassword.value,
      }),
    });
    state.user = data.user;
    els.loginPassword.value = "";
    if (state.user.must_change_password) {
      showForcePassword();
      return;
    }
    showApp();
    await loadInitialData();
  } catch {
    showLoginError("メールアドレスまたはパスワードが正しくありません。");
  }
});

els.logoutButton.addEventListener("click", openLogoutConfirm);
els.messageCenterButton.addEventListener("click", openMessageDrawer);
els.closeMessageDrawerButton.addEventListener("click", closeMessageDrawer);
els.messageDrawerBackdrop.addEventListener("click", closeMessageDrawer);
els.markAllMessagesReadButton.addEventListener("click", markAllMessagesRead);
els.adminMessageForm.addEventListener("submit", sendAdminMessage);
els.messageInboxList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-message-id]");
  if (!card) return;
  markMessageRead(Number(card.dataset.messageId));
});
els.profileButton.addEventListener("click", openProfile);
els.headerProfileButton.addEventListener("click", openProfile);
els.closeProfileButton.addEventListener("click", closeProfile);
els.profileModal.addEventListener("click", (event) => {
  if (event.target === els.profileModal) closeProfile();
});
els.profileAvatarButton.addEventListener("click", () => els.profileAvatarInput.click());
els.profileAvatarSelectButton.addEventListener("click", () => els.profileAvatarInput.click());
els.profileAvatarInput.addEventListener("change", selectProfileAvatar);
els.profileAvatarRemoveButton.addEventListener("click", () => {
  state.profileAvatarDataUrl = null;
  syncProfileAvatarPreview();
  clearMessage(els.profileMessage);
  showMessage(els.profileMessage, "プロフィール画像を削除します。「設定を保存」で反映されます。", "ok");
});
els.profileForm.addEventListener("submit", saveProfile);
els.profilePasswordButton.addEventListener("click", () => {
  closeProfile();
  els.passwordEmailInput.value = state.user?.email || "";
  openAuthDialog(els.passwordDialog, els.passwordEmailInput);
});
els.closeLogoutConfirmButton.addEventListener("click", closeLogoutConfirm);
els.cancelLogoutButton.addEventListener("click", closeLogoutConfirm);
els.confirmLogoutButton.addEventListener("click", confirmLogout);
els.logoutConfirmModal.addEventListener("click", (event) => {
  if (event.target === els.logoutConfirmModal) closeLogoutConfirm();
});

els.forceLogoutButton.addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST" }).catch(() => {});
  els.forcePasswordForm.reset();
  showLogin();
});

els.reservationForm.addEventListener("submit", createReservation);
els.reservationForm.addEventListener("input", updateReservationLiveSummary);
els.reservationForm.addEventListener("change", updateReservationLiveSummary);

els.schedule.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-reservation]");
  if (!button) return;
  event.stopPropagation();
  openReservationDeleteConfirm(
    button.dataset.deleteReservation,
    state.user?.role === "admin" ? "admin" : "user",
    button,
  );
});

els.reservationSection.addEventListener("click", (event) => {
  if (event.target.closest("[data-delete-reservation]")) return;
  openReservationDetailFromEvent(event);
});

els.adminSection.addEventListener("click", (event) => {
  openReservationDetailFromEvent(event);
});

els.dashboardSection.addEventListener("click", (event) => {
  if (event.target.closest("[data-dashboard-create]")) {
    showReservationPage();
    window.requestAnimationFrame(() => els.titleInput.focus());
    return;
  }
  openReservationDetailFromEvent(event);
});

els.timelineSection?.addEventListener("click", (event) => {
  openReservationDetailFromEvent(event);
});

els.calendarSection?.addEventListener("click", async (event) => {
  const roomFilterButton = event.target.closest("[data-calendar-room-filter]");
  if (roomFilterButton) {
    state.calendarRoomFilter = roomFilterButton.dataset.calendarRoomFilter || "all";
    renderCalendarPage();
    return;
  }

  if (event.target.closest("[data-calendar-create]")) {
    els.dateInput.value = state.selectedDate;
    updateDatePolicy();
    showReservationPage();
    window.requestAnimationFrame(() => els.titleInput.focus());
    return;
  }

  const dayButton = event.target.closest("[data-calendar-date]");
  if (dayButton) {
    state.selectedDate = dayButton.dataset.calendarDate;
    els.dateInput.value = state.selectedDate;
    updateDatePolicy();
    setPageHeading("カレンダー", state.selectedDate);
    if (calendarMonthStart(state.selectedDate) !== state.calendarMonth) {
      state.calendarMonth = calendarMonthStart(state.selectedDate);
      await Promise.all([loadReservations(), loadCalendarReservations()]);
    } else {
      await loadReservations();
      renderCalendarPage();
    }
    return;
  }

  openReservationDetailFromEvent(event);
});

els.reservationModal.addEventListener("click", async (event) => {
  if (event.target === els.reservationModal || event.target.closest("[data-close-modal]")) {
    closeReservationDetail();
    return;
  }

  const deleteButton = event.target.closest("[data-detail-delete]");
  if (deleteButton) {
    openReservationDeleteConfirm(
      deleteButton.dataset.detailDelete,
      state.user?.role === "admin" ? "admin" : "user",
      deleteButton,
    );
    return;
  }

  const decisionButton = event.target.closest("[data-detail-decision]");
  if (decisionButton) {
    const id = decisionButton.dataset.detailId;
    const status = decisionButton.dataset.detailDecision;
    closeReservationDetail();
    await updateReservationStatus(id, status, "");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.messageDrawer.hidden) {
    closeMessageDrawer();
    els.messageCenterButton.focus();
    return;
  }
  if (event.key === "Escape" && !els.reservationDeleteConfirmModal.hidden) {
    closeReservationDeleteConfirm();
    return;
  }
  if (event.key === "Escape" && !els.logoutConfirmModal.hidden) {
    closeLogoutConfirm();
    els.logoutButton.focus();
    return;
  }
  if (event.key === "Escape" && !els.profileModal.hidden) {
    closeProfile();
    els.profileButton.focus();
    return;
  }
  if (event.key === "Escape" && !els.passwordDialog.hidden) {
    closeAuthDialog(els.passwordDialog, els.passwordForm, els.passwordMessage, els.openPasswordDialogButton);
    return;
  }
  if (event.key === "Escape" && !els.forgotPasswordDialog.hidden) {
    closeAuthDialog(els.forgotPasswordDialog, els.forgotPasswordForm, els.forgotPasswordMessage, els.openForgotPasswordDialogButton);
    return;
  }
  if (event.key === "Escape" && !els.userEditorModal.hidden) {
    closeUserEditor();
    return;
  }
  if (event.key === "Escape" && !els.reservationModal.hidden) {
    closeReservationDetail();
    return;
  }

  if (event.key !== "Enter" && event.key !== " ") return;
  const detailTarget = event.target.closest?.("[data-reservation-detail]");
  if (!detailTarget) return;
  event.preventDefault();
  openReservationDetail(detailTarget.dataset.reservationDetail);
});

els.todayButton.addEventListener("click", async () => {
  state.viewMode = "day";
  state.selectedDate = today();
  els.dateInput.value = state.selectedDate;
  updateDatePolicy();
  await loadReservations();
});

els.weekButton.addEventListener("click", async () => {
  state.viewMode = "week";
  state.selectedDate = normalizeDate(els.dateInput.value || today());
  await loadReservations();
});

els.dateInput.addEventListener("change", async () => {
  if (!els.dateInput.value) return;
  state.selectedDate = normalizeDate(els.dateInput.value);
  updateDatePolicy();

  if (!els.calendarSection.hidden) {
    state.calendarMonth = calendarMonthStart(state.selectedDate);
    setPageHeading("カレンダー", state.selectedDate);
    await loadCalendarReservations();
    return;
  }

  if (!els.timelineSection.hidden) {
    setPageHeading("タイムライン", state.selectedDate);
  }
  await loadReservations();
});

els.roomSelect.addEventListener("change", () => {
  renderRoomChoiceGrid();
  renderReservationAvailability();
});

els.roomChoiceGrid?.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-room-choice]");
  if (!choice) return;
  els.roomSelect.value = choice.dataset.roomChoice;
  renderRoomChoiceGrid();
  renderReservationAvailability();
});

els.startTimeSelect.addEventListener("change", () => {
  updateEndTimeOptions();
  updateDurationPolicy();
});
els.endTimeSelect.addEventListener("change", updateDurationPolicy);
els.specialRequestToggle.addEventListener("change", updateDurationPolicy);
els.specialEndTimeSelect.addEventListener("change", updateDurationPolicy);

setInterval(() => {
  if (els.appView.hidden || normalizeDate(els.dateInput.value || state.selectedDate) !== today()) return;
  updateDatePolicy();
  updateDurationPolicy();
  renderSchedule();
  renderOverviewPanels();
  renderDashboard();
}, 60000);

els.adminTabButton.addEventListener("click", async () => {
  await showAdminPage(els.adminTabButton.dataset.adminSideView || "overview");
});

els.dashboardNavButton?.addEventListener("click", showDashboardPage);

els.timelineNavButton?.addEventListener("click", showTimelinePage);
els.calendarNavButton?.addEventListener("click", showCalendarPage);

els.timelineTodayButton?.addEventListener("click", async () => {
  state.viewMode = "day";
  state.selectedDate = today();
  els.dateInput.value = state.selectedDate;
  updateDatePolicy();
  setPageHeading("タイムライン", state.selectedDate);
  await loadReservations();
});

els.timelinePrevButton?.addEventListener("click", () => moveTimelineDate(-1));
els.timelineNextButton?.addEventListener("click", () => moveTimelineDate(1));

els.calendarTodayButton?.addEventListener("click", async () => {
  state.selectedDate = today();
  state.calendarMonth = calendarMonthStart(state.selectedDate);
  els.dateInput.value = state.selectedDate;
  updateDatePolicy();
  setPageHeading("カレンダー", state.selectedDate);
  await loadCalendarReservations();
});

els.calendarPrevButton?.addEventListener("click", () => moveCalendarMonth(-1));
els.calendarNextButton?.addEventListener("click", () => moveCalendarMonth(1));

els.quickReservationButton?.addEventListener("click", () => {
  showReservationPage();
  els.titleInput.focus();
});

els.reservationAnchorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showReservationPage();
    window.requestAnimationFrame(() => {
      els.schedule.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
});

els.sidebarAdminButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    await showAdminPage(button.dataset.adminSideView || "overview");
  });
});

els.adminMenuButtons.forEach((button) => {
  button.addEventListener("click", () => setAdminView(button.dataset.adminView));
});

els.mailTestButton?.addEventListener("click", sendAdminMailTest);
els.dailyReportButton?.addEventListener("click", () => handleReportDownload("daily"));
els.weeklyReportButton?.addEventListener("click", () => handleReportDownload("weekly"));

els.attendeeSearchInput?.addEventListener("input", renderAttendeePicker);
els.selectedAttendeeChips?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-attendee]");
  if (!removeButton) return;
  const id = Number(removeButton.dataset.removeAttendee);
  if (!Number.isInteger(id)) return;
  state.selectedAttendeeIds.delete(id);
  syncParticipantCountWithAttendees();
  renderAttendeePicker();
});
els.attendeeList?.addEventListener("change", (event) => {
  const checkbox = event.target.closest("input[type='checkbox']");
  if (!checkbox) return;
  const id = Number(checkbox.value);
  if (!Number.isInteger(id)) return;

  if (checkbox.checked) {
    state.selectedAttendeeIds.add(id);
  } else {
    state.selectedAttendeeIds.delete(id);
  }

  syncParticipantCountWithAttendees();
  renderAttendeePicker();
});

els.recurrenceSelect?.addEventListener("change", () => {
  const enabled = els.recurrenceSelect.value === "weekly";
  if (els.recurrenceCountSelect) {
    els.recurrenceCountSelect.disabled = !enabled;
    if (!enabled) {
      els.recurrenceCountSelect.value = "1";
    }
  }
  if (els.recurrenceHint) {
    els.recurrenceHint.textContent = enabled
      ? "毎週の繰り返し予約は特別申請として管理者承認が必要です。"
      : "例：毎週月曜日の部門定例をまとめて作成できます。";
  }
  updateDurationPolicy();
});

els.recurrenceCountSelect?.addEventListener("change", updateDurationPolicy);

els.reservationTabButton.addEventListener("click", () => {
  showReservationPage();
});

els.userForm.addEventListener("submit", createUser);
els.passwordForm.addEventListener("submit", changePassword);
els.forgotSendCodeButton.addEventListener("click", sendForgotPasswordCode);
els.forgotPasswordForm.addEventListener("submit", resetForgottenPassword);
els.forcePasswordForm.addEventListener("submit", completeInitialPassword);

els.openPasswordDialogButton.addEventListener("click", () => {
  openAuthDialog(els.passwordDialog, els.passwordEmailInput);
});
els.openForgotPasswordDialogButton.addEventListener("click", () => {
  openAuthDialog(els.forgotPasswordDialog, els.forgotEmailInput);
});
els.closePasswordDialogButton.addEventListener("click", () => {
  closeAuthDialog(els.passwordDialog, els.passwordForm, els.passwordMessage, els.openPasswordDialogButton);
});
els.closeForgotPasswordDialogButton.addEventListener("click", () => {
  closeAuthDialog(els.forgotPasswordDialog, els.forgotPasswordForm, els.forgotPasswordMessage, els.openForgotPasswordDialogButton);
});
els.passwordDialog.addEventListener("click", (event) => {
  if (event.target === els.passwordDialog) {
    closeAuthDialog(els.passwordDialog, els.passwordForm, els.passwordMessage, els.openPasswordDialogButton);
  }
});
els.forgotPasswordDialog.addEventListener("click", (event) => {
  if (event.target === els.forgotPasswordDialog) {
    closeAuthDialog(els.forgotPasswordDialog, els.forgotPasswordForm, els.forgotPasswordMessage, els.openForgotPasswordDialogButton);
  }
});

els.userTableBody.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-user]");
  if (editButton) {
    openUserEditor(Number(editButton.dataset.editUser));
    return;
  }
});

els.userSearchInput.addEventListener("input", () => {
  state.userSearch = els.userSearchInput.value;
  renderUsers();
});

els.openUserCreateDialogButton.addEventListener("click", () => openUserEditor());
els.closeUserEditorButton.addEventListener("click", closeUserEditor);
els.cancelUserEditorButton.addEventListener("click", closeUserEditor);
els.userEditorModal.addEventListener("click", (event) => {
  if (event.target === els.userEditorModal) closeUserEditor();
});
els.toggleUserStatusButton.addEventListener("click", async () => {
  const saved = await updateUser(
    Number(els.toggleUserStatusButton.dataset.userId),
    { is_active: els.toggleUserStatusButton.dataset.nextActive === "true" },
  );
  if (saved) closeUserEditor();
});
els.openUserDeleteConfirmButton?.addEventListener("click", () => {
  openUserDeleteConfirm(Number(els.openUserDeleteConfirmButton.dataset.userId));
});
els.closeUserDeleteConfirmButton?.addEventListener("click", closeUserDeleteConfirm);
els.cancelUserDeleteButton?.addEventListener("click", closeUserDeleteConfirm);
els.userDeleteConfirmModal?.addEventListener("click", (event) => {
  if (event.target === els.userDeleteConfirmModal) closeUserDeleteConfirm();
});
els.confirmUserDeleteButton?.addEventListener("click", deleteUser);
els.closeReservationDeleteConfirmButton?.addEventListener("click", () => closeReservationDeleteConfirm());
els.cancelReservationDeleteButton?.addEventListener("click", () => closeReservationDeleteConfirm());
els.confirmReservationDeleteButton?.addEventListener("click", confirmReservationDelete);
els.reservationDeleteConfirmModal?.addEventListener("click", (event) => {
  if (event.target === els.reservationDeleteConfirmModal) closeReservationDeleteConfirm();
});

function handleApprovalDecision(event, container) {
  const button = event.target.closest("[data-admin-decision]");
  if (!button) return;
  event.stopPropagation();
  const noteInput = container.querySelector(`[data-admin-note="${button.dataset.adminDecision}"]`);
  updateReservationStatus(button.dataset.adminDecision, button.dataset.nextStatus, noteInput?.value.trim() || "");
}

els.pendingTableBody.addEventListener("click", (event) => {
  handleApprovalDecision(event, els.pendingTableBody);
});

els.reviewedApprovalList?.addEventListener("click", (event) => {
  handleApprovalDecision(event, els.reviewedApprovalList);
});

els.adminReservationTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-admin-delete-reservation]");
  if (!button) return;
  event.stopPropagation();
  openReservationDeleteConfirm(button.dataset.adminDeleteReservation, "admin", button);
});

els.adminReservationSearchInput?.addEventListener("input", renderAdminReservations);

els.adminReservationFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.adminReservationFilter = button.dataset.adminReservationFilter || "all";
    renderAdminReservations();
  });
});

els.auditSearchInput?.addEventListener("input", () => {
  state.auditSearch = els.auditSearchInput.value;
  renderAuditLogs();
});

els.auditFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.auditFilter = button.dataset.auditFilter || "all";
    renderAuditLogs();
  });
});

els.adminReservationReportButton?.addEventListener("click", () => {
  setAdminView("reports");
  els.reportDateInput?.focus();
});

fillTimeSelects();
loadMe();
