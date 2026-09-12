import base64
import binascii
import csv
import io
import json
import os
import secrets
import smtplib
import time
from datetime import date, datetime, time as dt_time, timedelta
from email.message import EmailMessage
from pathlib import Path
from threading import Thread
from typing import Optional
from urllib import parse, request as urlrequest
from urllib.error import HTTPError, URLError
from zoneinfo import ZoneInfo

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    create_engine,
    delete as sa_delete,
    inspect,
    or_,
    select,
    text,
)
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.dialects.mysql import MEDIUMTEXT
from sqlalchemy.orm import Session, declarative_base, relationship, sessionmaker

TOKYO = ZoneInfo("Asia/Tokyo")
APP_VERSION = "20260727-api-report-profile-v27"
LEGACY_ADMIN_EMAIL = "legacy-admin@example.com"
DEFAULT_ADMIN_EMAIL = "admin@example.com"
COOKIE_NAME = "meeting_session"
ROOM_NAMES = ["Room A", "Room B", "Room C", "Room D", "Room E", "Room F"]
MIN_RESERVATION_MINUTES = 30
STANDARD_RESERVATION_MINUTES = 90
MAX_REQUEST_MINUTES = 600
MAX_AVATAR_BYTES = 256 * 1024
ALLOWED_AVATAR_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
BUSINESS_START = dt_time(9, 0)
BUSINESS_END = dt_time(19, 0)
BUSINESS_DAY_MINUTES = (
    BUSINESS_END.hour * 60
    + BUSINESS_END.minute
    - BUSINESS_START.hour * 60
    - BUSINESS_START.minute
)
ACTIVE_RESERVATION_STATUSES = ("approved",)
VALID_RESERVATION_STATUSES = {"approved", "pending", "rejected"}
RESERVATION_STATUS_ALIASES = {
    "承認済み": "approved",
    "承認待ち": "pending",
    "却下": "rejected",
}
JAPAN_HOLIDAYS = {
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
}

DB_HOST = os.getenv("DB_HOST", "meeting-db")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "meeting")
DB_USER = os.getenv("DB_USER", "meeting_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "720"))
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
_ADMIN_EMAIL_FROM_ENV = os.getenv("ADMIN_EMAIL", DEFAULT_ADMIN_EMAIL).strip()
ADMIN_EMAIL = (
    DEFAULT_ADMIN_EMAIL
    if not _ADMIN_EMAIL_FROM_ENV or _ADMIN_EMAIL_FROM_ENV.lower() == LEGACY_ADMIN_EMAIL
    else _ADMIN_EMAIL_FROM_ENV
)
ADMIN_NAME = os.getenv("ADMIN_NAME", "Demo Administrator")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8080").strip()
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or ADMIN_EMAIL).strip()
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
MAIL_PROVIDER = os.getenv("MAIL_PROVIDER", "auto").strip().lower()
GRAPH_TENANT_ID = os.getenv("GRAPH_TENANT_ID", "").strip()
GRAPH_CLIENT_ID = os.getenv("GRAPH_CLIENT_ID", "").strip()
GRAPH_CLIENT_SECRET = os.getenv("GRAPH_CLIENT_SECRET", "")
GRAPH_FROM_EMAIL = os.getenv("GRAPH_FROM_EMAIL", SMTP_FROM or ADMIN_EMAIL).strip()
MAIL_APPROVAL_REQUEST_ENABLED = os.getenv("MAIL_APPROVAL_REQUEST_ENABLED", "true").lower() == "true"
ADMIN_NOTIFICATION_EMAIL = os.getenv("ADMIN_NOTIFICATION_EMAIL", ADMIN_EMAIL).strip()
MAIL_REMINDER_ENABLED = os.getenv("MAIL_REMINDER_ENABLED", "false").lower() == "true"
MAIL_REMINDER_MINUTES = int(os.getenv("MAIL_REMINDER_MINUTES", "5"))
MAIL_REMINDER_INTERVAL_SECONDS = int(os.getenv("MAIL_REMINDER_INTERVAL_SECONDS", "60"))
PASSWORD_RESET_CODE_MINUTES = int(os.getenv("PASSWORD_RESET_CODE_MINUTES", "15"))
REPORT_DIR = os.getenv("REPORT_DIR", "/data/reports").strip()

if not DB_PASSWORD:
    raise RuntimeError("DB_PASSWORD is required.")
if not JWT_SECRET or len(JWT_SECRET) < 32:
    raise RuntimeError("JWT_SECRET must be at least 32 characters.")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    "?charset=utf8mb4"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False, default="")
    role = Column(String(20), nullable=False, default="user")
    password_hash = Column(String(255), nullable=False)
    must_change_password = Column(Boolean, nullable=False, default=False)
    reset_code_hash = Column(String(255), nullable=True)
    reset_code_expires_at = Column(DateTime, nullable=True)
    avatar_data_url = Column(Text().with_variant(MEDIUMTEXT(), "mysql"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=lambda: now_tokyo())

    reservations = relationship("Reservation", back_populates="user", foreign_keys="Reservation.user_id")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    display_order = Column(Integer, nullable=False, default=0)

    reservations = relationship("Reservation", back_populates="room", foreign_keys="Reservation.room_id")


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="RESTRICT"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    start_at = Column(DateTime, nullable=False)
    end_at = Column(DateTime, nullable=False)
    purpose = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False, default="")
    department = Column(String(100), nullable=False, default="")
    reserver_name = Column(String(100), nullable=False, default="")
    participant_count = Column(Integer, nullable=False, default=1)
    notes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="approved")
    request_reason = Column(Text, nullable=True)
    admin_note = Column(Text, nullable=True)
    decided_at = Column(DateTime, nullable=True)
    decided_by_user_id = Column(Integer, nullable=True)
    reminder_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: now_tokyo())

    room = relationship("Room", back_populates="reservations", foreign_keys=[room_id])
    user = relationship("User", back_populates="reservations", foreign_keys=[user_id])
    attendees = relationship(
        "ReservationAttendee",
        back_populates="reservation",
        cascade="all, delete-orphan",
        foreign_keys="ReservationAttendee.reservation_id",
    )

    __table_args__ = (
        Index("idx_reservations_room_time", "room_id", "start_at", "end_at"),
        Index("idx_reservations_user_time", "user_id", "start_at"),
        UniqueConstraint("room_id", "start_at", "end_at", name="uq_room_exact_time"),
    )


class ReservationAttendee(Base):
    __tablename__ = "reservation_attendees"

    id = Column(Integer, primary_key=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: now_tokyo())

    reservation = relationship("Reservation", back_populates="attendees", foreign_keys=[reservation_id])
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("reservation_id", "user_id", name="uq_reservation_attendee_user"),
        Index("idx_reservation_attendees_reservation", "reservation_id"),
        Index("idx_reservation_attendees_user", "user_id"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    actor_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_email = Column(String(255), nullable=True)
    actor_name = Column(String(100), nullable=True)
    action = Column(String(80), nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(Integer, nullable=True)
    detail = Column(Text, nullable=True)
    ip_address = Column(String(80), nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: now_tokyo())

    actor = relationship("User", foreign_keys=[actor_user_id])

    __table_args__ = (
        Index("idx_audit_logs_created_at", "created_at"),
        Index("idx_audit_logs_actor", "actor_user_id", "created_at"),
        Index("idx_audit_logs_action", "action", "created_at"),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    sender_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(120), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: now_tokyo())

    sender = relationship("User", foreign_keys=[sender_user_id])
    recipient = relationship("User", foreign_keys=[recipient_user_id])
    read_receipts = relationship(
        "MessageRead",
        back_populates="message",
        cascade="all, delete-orphan",
        passive_deletes=True,
        foreign_keys="MessageRead.message_id",
    )

    __table_args__ = (
        Index("idx_messages_recipient_created", "recipient_user_id", "created_at"),
        Index("idx_messages_sender_created", "sender_user_id", "created_at"),
    )


class MessageRead(Base):
    __tablename__ = "message_reads"

    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    read_at = Column(DateTime, nullable=False, default=lambda: now_tokyo())

    message = relationship("Message", back_populates="read_receipts", foreign_keys=[message_id])
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="uq_message_read_user"),
        Index("idx_message_reads_user", "user_id", "message_id"),
    )


class LoginIn(BaseModel):
    email: str
    password: str


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class PublicPasswordChangeIn(PasswordChangeIn):
    email: str


class CompleteInitialPasswordIn(BaseModel):
    new_password: str = Field(min_length=8)


class ForgotPasswordIn(BaseModel):
    email: str


class ResetPasswordIn(BaseModel):
    email: str
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8)


class MailTestIn(BaseModel):
    email: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    department: str = ""
    avatar_data_url: Optional[str] = None
    role: str
    must_change_password: bool = False
    is_active: bool = True


class UserDirectoryOut(BaseModel):
    id: int
    email: str
    name: str


class UserCreate(BaseModel):
    email: str
    name: str
    department: str = Field(default="", max_length=100)
    password: str = Field(min_length=8)
    role: str = "user"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = Field(default=None, max_length=100)
    role: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=8)
    is_active: Optional[bool] = None


class ProfileUpdateIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    department: str = Field(default="", max_length=100)
    avatar_data_url: Optional[str] = Field(default=None, max_length=400_000)


class MessageCreateIn(BaseModel):
    recipient_user_id: Optional[int] = None
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=2000)


class MessageOut(BaseModel):
    id: int
    sender_name: str
    recipient_user_id: Optional[int] = None
    recipient_name: str
    title: str
    body: str
    created_at: str
    is_read: bool = False


class RoomOut(BaseModel):
    id: int
    name: str
    display_order: int


class ReservationCreate(BaseModel):
    room_id: int
    date: str
    start_time: str
    end_time: str
    purpose: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    reserver_name: Optional[str] = None
    participant_count: int = Field(ge=1, le=999)
    notes: Optional[str] = None
    request_reason: Optional[str] = None
    attendee_user_ids: list[int] = Field(default_factory=list)
    recurrence: str = "none"
    recurrence_count: int = Field(default=1, ge=1, le=12)


class ReservationDecision(BaseModel):
    status: str
    admin_note: Optional[str] = None


class ReservationAttendeeOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: str


class ReservationOut(BaseModel):
    id: int
    room_id: int
    room_name: str
    user_id: int
    user_name: str
    user_email: str
    start_at: str
    end_at: str
    date: str
    start_time: str
    end_time: str
    purpose: str
    title: str
    department: str
    reserver_name: str
    participant_count: int
    notes: Optional[str] = None
    status: str
    request_reason: Optional[str] = None
    admin_note: Optional[str] = None
    approval_required: bool = False
    can_delete: bool
    attendees: list[ReservationAttendeeOut] = Field(default_factory=list)


class HolidayOut(BaseModel):
    date: str
    name: str


class AuditLogOut(BaseModel):
    id: int
    created_at: str
    actor_email: Optional[str] = None
    actor_name: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    detail: Optional[str] = None
    ip_address: Optional[str] = None


class ReportExportIn(BaseModel):
    period: str = "daily"
    target_date: Optional[str] = None


app = FastAPI(title="RoomBook Meeting Room API")


def now_tokyo() -> datetime:
    return datetime.now(TOKYO).replace(tzinfo=None)


def mail_reminder_configured() -> bool:
    return MAIL_REMINDER_ENABLED and mail_configured()


def smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_FROM)


def graph_configured() -> bool:
    return bool(GRAPH_TENANT_ID and GRAPH_CLIENT_ID and GRAPH_CLIENT_SECRET and GRAPH_FROM_EMAIL)


def active_mail_provider() -> str:
    if MAIL_PROVIDER == "graph":
        return "graph" if graph_configured() else ""
    if MAIL_PROVIDER == "smtp":
        return "smtp" if smtp_configured() else ""
    if graph_configured():
        return "graph"
    if smtp_configured():
        return "smtp"
    return ""


def mail_configured() -> bool:
    return bool(active_mail_provider())


def current_mail_from() -> str:
    return GRAPH_FROM_EMAIL if active_mail_provider() == "graph" else SMTP_FROM


def approval_notice_configured() -> bool:
    return MAIL_APPROVAL_REQUEST_ENABLED and mail_configured() and bool(ADMIN_NOTIFICATION_EMAIL)


def split_email_list(value: str) -> list[str]:
    return [item.strip() for item in value.replace(";", ",").split(",") if item.strip()]


def send_email_via_smtp(to_email: str, subject: str, body: str) -> None:
    message = EmailMessage()
    message["From"] = SMTP_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    smtp_class = smtplib.SMTP_SSL if SMTP_USE_SSL else smtplib.SMTP
    with smtp_class(SMTP_HOST, SMTP_PORT, timeout=20) as smtp:
        if SMTP_USE_TLS and not SMTP_USE_SSL:
            smtp.starttls()
        if SMTP_USER and SMTP_PASSWORD:
            smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.send_message(message)


def graph_access_token() -> str:
    token_url = f"https://login.microsoftonline.com/{GRAPH_TENANT_ID}/oauth2/v2.0/token"
    data = parse.urlencode(
        {
            "client_id": GRAPH_CLIENT_ID,
            "client_secret": GRAPH_CLIENT_SECRET,
            "grant_type": "client_credentials",
            "scope": "https://graph.microsoft.com/.default",
        }
    ).encode("utf-8")
    req = urlrequest.Request(
        token_url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urlrequest.urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Graph token request failed: HTTP {exc.code} {error_body}") from exc
    except URLError as exc:
        raise RuntimeError(f"Graph token request failed: {exc.reason}") from exc

    token = payload.get("access_token")
    if not token:
        raise RuntimeError("Graph token response did not include access_token.")
    return token


def send_email_via_graph(to_email: str, subject: str, body: str) -> None:
    token = graph_access_token()
    sender = parse.quote(GRAPH_FROM_EMAIL)
    url = f"https://graph.microsoft.com/v1.0/users/{sender}/sendMail"
    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "Text", "content": body},
            "toRecipients": [{"emailAddress": {"address": to_email}}],
        },
        "saveToSentItems": False,
    }
    req = urlrequest.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urlrequest.urlopen(req, timeout=20) as resp:
            if resp.status not in (200, 202):
                raise RuntimeError(f"Graph sendMail returned HTTP {resp.status}.")
    except HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Graph sendMail failed: HTTP {exc.code} {error_body}") from exc
    except URLError as exc:
        raise RuntimeError(f"Graph sendMail failed: {exc.reason}") from exc


def send_email(to_email: str, subject: str, body: str) -> None:
    provider = active_mail_provider()
    if provider == "graph":
        send_email_via_graph(to_email, subject, body)
        return
    if provider == "smtp":
        send_email_via_smtp(to_email, subject, body)
        return
    raise RuntimeError("Mail delivery is not configured.")


def normalized_unique_emails(values: list[str]) -> list[str]:
    seen = set()
    emails = []
    for value in values:
        email = (value or "").strip().lower()
        if not email or email in seen:
            continue
        seen.add(email)
        emails.append(email)
    return emails


def send_email_many(to_emails: list[str], subject: str, body: str) -> None:
    for email in normalized_unique_emails(to_emails):
        send_email(email, subject, body)


def reservation_recipient_emails(reservation: "Reservation") -> list[str]:
    emails = [reservation.user.email if reservation.user else ""]
    emails.extend(attendee.email for attendee in reservation.attendees)
    return normalized_unique_emails(emails)


def build_approval_request_body(reservation: "Reservation", room_name: str, applicant: "User") -> str:
    applicant_name = reservation.reserver_name or applicant.name
    return "\n".join(
        [
            "長時間会議の承認申請が提出されました。",
            "管理者ページで内容を確認し、承認または却下してください。",
            "",
            f"会議件名：{reservation.title or reservation.purpose}",
            f"会議室：{room_name}",
            f"日時：{reservation.start_at.strftime('%Y/%m/%d %H:%M')} - {reservation.end_at.strftime('%H:%M')}",
            f"申請者：{applicant_name}",
            f"メール：{applicant.email}",
            f"部署：{reservation.department or '-'}",
            f"参加人数：{reservation.participant_count or '-'}名",
            f"申請理由：{reservation.request_reason or '-'}",
            "",
            f"管理者ページ：{APP_BASE_URL}",
            "",
            "RoomBook 会議室予約システム",
        ]
    )


def send_approval_request_notice(reservation: "Reservation", room_name: str, applicant: "User") -> None:
    if not approval_notice_configured():
        print("approval request mail is disabled or mail delivery is not configured.", flush=True)
        return

    subject = f"【RoomBook】長時間会議の承認申請：{reservation.title or reservation.purpose}"
    body = build_approval_request_body(reservation, room_name, applicant)
    for email in split_email_list(ADMIN_NOTIFICATION_EMAIL):
        send_email(email, subject, body)


def attendee_summary(reservation: "Reservation") -> str:
    if not reservation.attendees:
        return "-"
    return "、".join(f"{attendee.name} <{attendee.email}>" for attendee in reservation.attendees)


def build_reservation_notice_body(reservation: "Reservation", lead: str) -> str:
    return "\n".join(
        [
            lead,
            "",
            f"会議件名：{reservation.title or reservation.purpose}",
            f"会議室：{reservation.room.name}",
            f"日時：{reservation.start_at.strftime('%Y/%m/%d %H:%M')} - {reservation.end_at.strftime('%H:%M')}",
            f"予約者：{reservation.reserver_name or reservation.user.name}",
            f"部署：{reservation.department or '-'}",
            f"参加人数：{reservation.participant_count or '-'}名",
            f"参加者：{attendee_summary(reservation)}",
            f"備考：{reservation.notes or '-'}",
            "",
            f"システムURL：{APP_BASE_URL}",
            "",
            "RoomBook 会議室予約システム",
        ]
    )


def send_reservation_notice(reservation: "Reservation", subject_prefix: str, lead: str) -> None:
    if not mail_configured():
        return
    subject = f"【RoomBook】{subject_prefix}：{reservation.title or reservation.purpose}"
    send_email_many(reservation_recipient_emails(reservation), subject, build_reservation_notice_body(reservation, lead))


def build_password_reset_body(code: str) -> str:
    return "\n".join(
        [
            "RoomBook 会議室予約システムのパスワード再設定コードです。",
            "",
            f"確認コード：{code}",
            f"有効期限：{PASSWORD_RESET_CODE_MINUTES}分",
            "",
            "このメールに心当たりがない場合は、管理者へ連絡してください。",
            "",
            "RoomBook 会議室予約システム",
        ]
    )


def build_reminder_body(reservation: "Reservation") -> str:
    return "\n".join(
        [
            "会議開始5分前のお知らせです。",
            "",
            f"会議件名：{reservation.title or reservation.purpose}",
            f"会議室：{reservation.room.name}",
            f"日時：{reservation.start_at.strftime('%Y/%m/%d %H:%M')} - {reservation.end_at.strftime('%H:%M')}",
            f"予約者：{reservation.reserver_name or reservation.user.name}",
            f"部署：{reservation.department or '-'}",
            f"参加人数：{reservation.participant_count or '-'}名",
            f"参加者：{attendee_summary(reservation)}",
            "",
            "RoomBook 会議室予約システム",
        ]
    )


def send_due_reminders_once() -> None:
    if not mail_reminder_configured():
        return

    now = now_tokyo()
    window_end = now + timedelta(minutes=MAIL_REMINDER_MINUTES)
    with SessionLocal() as db:
        reservations = db.scalars(
            select(Reservation)
            .join(Reservation.user)
            .join(Reservation.room)
            .where(
                Reservation.status == "approved",
                Reservation.reminder_sent_at.is_(None),
                Reservation.start_at > now,
                Reservation.start_at <= window_end,
                User.email != "",
            )
            .order_by(Reservation.start_at)
            .limit(50)
        ).all()

        for reservation in reservations:
            try:
                subject = f"【会議開始5分前】{reservation.title or reservation.purpose}"
                send_email_many(reservation_recipient_emails(reservation), subject, build_reminder_body(reservation))
                reservation.reminder_sent_at = now_tokyo()
                db.commit()
            except Exception as exc:
                db.rollback()
                print(f"meeting reminder mail failed: reservation_id={reservation.id} error={exc}", flush=True)


def reminder_worker() -> None:
    while True:
        try:
            send_due_reminders_once()
        except Exception as exc:
            print(f"meeting reminder worker failed: {exc}", flush=True)
        time.sleep(MAIL_REMINDER_INTERVAL_SECONDS)


def start_reminder_worker() -> None:
    if not mail_reminder_configured():
        print("meeting reminder mail is disabled or mail delivery is not configured.", flush=True)
        return
    worker = Thread(target=reminder_worker, daemon=True)
    worker.start()
    print("meeting reminder mail worker started.", flush=True)


def wait_for_database() -> None:
    for _ in range(60):
        try:
            with engine.connect() as connection:
                connection.exec_driver_sql("SELECT 1")
            return
        except OperationalError:
            time.sleep(2)
    raise RuntimeError("Database is not ready.")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_token(user: User) -> str:
    expires_at = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": expires_at,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=JWT_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/", samesite="lax")


def user_to_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        department=user.department or "",
        avatar_data_url=user.avatar_data_url,
        role=user.role,
        must_change_password=bool(user.must_change_password),
        is_active=user.is_active,
    )


def normalize_avatar_data_url(value: Optional[str]) -> Optional[str]:
    if value is None or not value.strip():
        return None

    data_url = value.strip()
    try:
        metadata, encoded = data_url.split(",", 1)
        mime_type, encoding = metadata[5:].split(";", 1)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="プロフィール画像のデータ形式が正しくありません。") from exc

    mime_type = mime_type.lower()
    if not metadata.startswith("data:") or encoding.lower() != "base64" or mime_type not in ALLOWED_AVATAR_MIME_TYPES:
        raise HTTPException(status_code=400, detail="プロフィール画像は JPEG、PNG、WebP のみ使用できます。")

    try:
        decoded = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=400, detail="プロフィール画像を読み取れませんでした。") from exc

    if not decoded:
        raise HTTPException(status_code=400, detail="プロフィール画像が空です。")
    if len(decoded) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=400, detail="プロフィール画像が大きすぎます。別の画像を選択してください。")

    signatures = {
        "image/jpeg": decoded.startswith(b"\xff\xd8\xff"),
        "image/png": decoded.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": len(decoded) >= 12 and decoded.startswith(b"RIFF") and decoded[8:12] == b"WEBP",
    }
    if not signatures[mime_type]:
        raise HTTPException(status_code=400, detail="プロフィール画像の内容とファイル形式が一致しません。")

    canonical = base64.b64encode(decoded).decode("ascii")
    return f"data:{mime_type};base64,{canonical}"


def message_to_out(message: Message, is_read: bool = False) -> MessageOut:
    return MessageOut(
        id=message.id,
        sender_name=message.sender.name if message.sender else "RoomBook 管理者",
        recipient_user_id=message.recipient_user_id,
        recipient_name=message.recipient.name if message.recipient else "全員",
        title=message.title,
        body=message.body,
        created_at=message.created_at.isoformat(),
        is_read=is_read,
    )


def holiday_name(day: date) -> Optional[str]:
    return JAPAN_HOLIDAYS.get(day.isoformat())


def non_working_day_label(day: date) -> Optional[str]:
    holiday = holiday_name(day)
    if holiday:
        return holiday
    if day.weekday() == 5:
        return "土曜日"
    if day.weekday() == 6:
        return "日曜日"
    return None


def reservation_minutes(start_at: datetime, end_at: datetime) -> int:
    return int((end_at - start_at).total_seconds() // 60)


def request_ip(request: Optional[Request]) -> Optional[str]:
    if not request:
        return None
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def audit_detail(value: Optional[dict | str]) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        return value[:4000]
    return json.dumps(value, ensure_ascii=False, default=str)[:4000]


def add_audit_log(
    db: Session,
    action: str,
    actor: Optional[User] = None,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    detail: Optional[dict | str] = None,
    request: Optional[Request] = None,
    actor_email: Optional[str] = None,
    actor_name: Optional[str] = None,
) -> None:
    db.add(
        AuditLog(
            actor_user_id=actor.id if actor else None,
            actor_email=(actor.email if actor else actor_email),
            actor_name=(actor.name if actor else actor_name),
            action=action,
            target_type=target_type,
            target_id=target_id,
            detail=audit_detail(detail),
            ip_address=request_ip(request),
        )
    )


def audit_to_out(log: AuditLog) -> AuditLogOut:
    return AuditLogOut(
        id=log.id,
        created_at=log.created_at.isoformat(),
        actor_email=log.actor_email,
        actor_name=log.actor_name,
        action=log.action,
        target_type=log.target_type,
        target_id=log.target_id,
        detail=log.detail,
        ip_address=log.ip_address,
    )


def ensure_user_schema() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    statements = []
    if "must_change_password" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE")
    if "department" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN department VARCHAR(100) NOT NULL DEFAULT ''")
    if "reset_code_hash" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN reset_code_hash VARCHAR(255) NULL")
    if "reset_code_expires_at" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN reset_code_expires_at DATETIME NULL")
    if "avatar_data_url" not in columns:
        statements.append("ALTER TABLE users ADD COLUMN avatar_data_url MEDIUMTEXT NULL")

    if statements:
        with engine.begin() as connection:
            for statement in statements:
                connection.exec_driver_sql(statement)


def ensure_reservation_schema() -> None:
    inspector = inspect(engine)
    if "reservations" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("reservations")}
    statements = []
    if "participant_count" not in columns:
        statements.append("ALTER TABLE reservations ADD COLUMN participant_count INT NOT NULL DEFAULT 1")
    if "title" not in columns:
        statements.append("ALTER TABLE reservations ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT ''")
    if "department" not in columns:
        statements.append("ALTER TABLE reservations ADD COLUMN department VARCHAR(100) NOT NULL DEFAULT ''")
    if "reserver_name" not in columns:
        statements.append("ALTER TABLE reservations ADD COLUMN reserver_name VARCHAR(100) NOT NULL DEFAULT ''")
    if "notes" not in columns:
        statements.append("ALTER TABLE reservations ADD COLUMN notes TEXT NULL")
    if "status" not in columns:
        statements.append("ALTER TABLE reservations ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'approved'")
    if "request_reason" not in columns:
        statements.append("ALTER TABLE reservations ADD COLUMN request_reason TEXT NULL")
    if "admin_note" not in columns:
        statements.append("ALTER TABLE reservations ADD COLUMN admin_note TEXT NULL")
    if "decided_at" not in columns:
        statements.append("ALTER TABLE reservations ADD COLUMN decided_at DATETIME NULL")
    if "decided_by_user_id" not in columns:
        statements.append("ALTER TABLE reservations ADD COLUMN decided_by_user_id INT NULL")
    if "reminder_sent_at" not in columns:
        statements.append("ALTER TABLE reservations ADD COLUMN reminder_sent_at DATETIME NULL")

    if statements or "status" in columns:
        with engine.begin() as connection:
            for statement in statements:
                connection.exec_driver_sql(statement)
            connection.exec_driver_sql("UPDATE reservations SET status = TRIM(LOWER(status)) WHERE status IS NOT NULL")
            connection.exec_driver_sql("UPDATE reservations SET status = 'approved' WHERE status = '承認済み'")
            connection.exec_driver_sql("UPDATE reservations SET status = 'pending' WHERE status = '承認待ち'")
            connection.exec_driver_sql("UPDATE reservations SET status = 'rejected' WHERE status = '却下'")
            connection.exec_driver_sql(
                """
                UPDATE reservations
                SET status = 'pending', admin_note = NULL, decided_at = NULL, decided_by_user_id = NULL
                WHERE status = 'approved'
                  AND decided_by_user_id IS NULL
                  AND (
                    TIMESTAMPDIFF(MINUTE, start_at, end_at) > 90
                    OR (request_reason IS NOT NULL AND TRIM(request_reason) <> '')
                  )
                """
            )


def normalize_reservation_status(value: Optional[str]) -> str:
    raw_value = (value or "approved").strip()
    if raw_value in RESERVATION_STATUS_ALIASES:
        return RESERVATION_STATUS_ALIASES[raw_value]
    normalized = raw_value.lower()
    if normalized in VALID_RESERVATION_STATUSES:
        return normalized
    return "pending"


def reservation_requires_approval(reservation: Reservation) -> bool:
    return (
        reservation_minutes(reservation.start_at, reservation.end_at) > STANDARD_RESERVATION_MINUTES
        or bool((reservation.request_reason or "").strip())
    )


def effective_reservation_status(reservation: Reservation) -> str:
    status = normalize_reservation_status(reservation.status)
    if status == "approved" and reservation_requires_approval(reservation) and not reservation.decided_by_user_id:
        return "pending"
    return status


def normalize_long_request_records(db: Session) -> None:
    result = db.execute(
        text(
            """
            UPDATE reservations
            SET status = 'pending', admin_note = NULL, decided_at = NULL, decided_by_user_id = NULL
            WHERE status = 'approved'
              AND decided_by_user_id IS NULL
              AND (
                TIMESTAMPDIFF(MINUTE, start_at, end_at) > :standard_minutes
                OR (request_reason IS NOT NULL AND TRIM(request_reason) <> '')
              )
            """
        ),
        {"standard_minutes": STANDARD_RESERVATION_MINUTES},
    )
    if result.rowcount:
        db.commit()


def reservation_to_out(reservation: Reservation, current_user: User) -> ReservationOut:
    can_delete = current_user.role == "admin" or reservation.user_id == current_user.id
    start_at = reservation.start_at
    end_at = reservation.end_at
    return ReservationOut(
        id=reservation.id,
        room_id=reservation.room_id,
        room_name=reservation.room.name,
        user_id=reservation.user_id,
        user_name=reservation.user.name,
        user_email=reservation.user.email,
        start_at=start_at.isoformat(),
        end_at=end_at.isoformat(),
        date=start_at.date().isoformat(),
        start_time=start_at.strftime("%H:%M"),
        end_time=end_at.strftime("%H:%M"),
        purpose=reservation.purpose,
        title=reservation.title or reservation.purpose,
        department=reservation.department or "",
        reserver_name=reservation.reserver_name or reservation.user.name,
        participant_count=reservation.participant_count,
        notes=reservation.notes,
        status=effective_reservation_status(reservation),
        request_reason=reservation.request_reason,
        admin_note=reservation.admin_note,
        approval_required=reservation_requires_approval(reservation),
        can_delete=can_delete,
        attendees=[
            ReservationAttendeeOut(
                id=attendee.id,
                user_id=attendee.user_id,
                name=attendee.name,
                email=attendee.email,
            )
            for attendee in reservation.attendees
        ],
    )


def report_period_range(period: str, target_date: Optional[str]) -> tuple[str, date, date]:
    normalized_period = (period or "daily").strip().lower()
    if normalized_period not in {"daily", "weekly"}:
        raise HTTPException(status_code=400, detail="レポート期間が正しくありません。")

    try:
        base_date = date.fromisoformat(target_date) if target_date else now_tokyo().date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="日付の形式が正しくありません。") from exc

    if normalized_period == "weekly":
        start_date = base_date - timedelta(days=base_date.weekday())
        end_date = start_date + timedelta(days=7)
    else:
        start_date = base_date
        end_date = start_date + timedelta(days=1)
    return normalized_period, start_date, end_date


def report_business_days(start_date: date, end_date: date) -> list[date]:
    days = []
    current = start_date
    while current < end_date:
        if not non_working_day_label(current):
            days.append(current)
        current += timedelta(days=1)
    return days


def business_minutes_between(start_at: datetime, end_at: datetime) -> int:
    start = max(start_at.time(), BUSINESS_START)
    end = min(end_at.time(), BUSINESS_END)
    if end <= start:
        return 0
    return reservation_minutes(datetime.combine(start_at.date(), start), datetime.combine(start_at.date(), end))


def report_attendees_text(reservation: Reservation) -> str:
    if not reservation.attendees:
        return ""
    return " / ".join(f"{attendee.name} <{attendee.email}>" for attendee in reservation.attendees)


def build_usage_report_csv(db: Session, period: str, target_date: Optional[str]) -> tuple[str, str, Optional[str]]:
    normalized_period, start_date, end_date = report_period_range(period, target_date)
    start_at = datetime.combine(start_date, dt_time.min)
    end_at = datetime.combine(end_date, dt_time.min)
    reservations = db.scalars(
        select(Reservation)
        .join(Reservation.room)
        .join(Reservation.user)
        .where(Reservation.start_at < end_at, Reservation.end_at > start_at)
        .order_by(Reservation.start_at, Room.display_order)
    ).all()

    business_days = report_business_days(start_date, end_date)
    room_minutes = {room_name: 0 for room_name in ROOM_NAMES}
    department_counts: dict[str, int] = {}
    long_request_count = 0
    approved_count = 0
    pending_count = 0
    rejected_count = 0

    for reservation in reservations:
        status = effective_reservation_status(reservation)
        if status == "approved":
            approved_count += 1
            room_minutes[reservation.room.name] = room_minutes.get(reservation.room.name, 0) + business_minutes_between(
                reservation.start_at,
                reservation.end_at,
            )
            department = reservation.department or "未設定"
            department_counts[department] = department_counts.get(department, 0) + 1
        elif status == "pending":
            pending_count += 1
        elif status == "rejected":
            rejected_count += 1
        if reservation_requires_approval(reservation):
            long_request_count += 1

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["RoomBook 会議室予約システム レポート"])
    writer.writerow(["期間", "日次" if normalized_period == "daily" else "週次"])
    writer.writerow(["対象日", start_date.isoformat(), "終了日", (end_date - timedelta(days=1)).isoformat()])
    writer.writerow(["生成日時", now_tokyo().strftime("%Y/%m/%d %H:%M")])
    writer.writerow([])
    writer.writerow(["サマリー"])
    writer.writerow(["承認済み予約", approved_count])
    writer.writerow(["承認待ち", pending_count])
    writer.writerow(["却下", rejected_count])
    writer.writerow(["長時間申請", long_request_count])
    writer.writerow([])
    writer.writerow(["会議室別利用率"])
    writer.writerow(["会議室", "予約分数", "利用率"])
    capacity_minutes = max(1, len(business_days) * BUSINESS_DAY_MINUTES)
    for room_name in ROOM_NAMES:
        minutes = room_minutes.get(room_name, 0)
        writer.writerow([room_name, minutes, f"{round((minutes / capacity_minutes) * 100, 1)}%"])
    writer.writerow([])
    writer.writerow(["部署別予約数"])
    writer.writerow(["部署", "予約数"])
    for department, count in sorted(department_counts.items(), key=lambda item: (-item[1], item[0])):
        writer.writerow([department, count])
    writer.writerow([])
    writer.writerow(["予約明細"])
    writer.writerow(["状態", "日付", "開始", "終了", "会議室", "会議件名", "予約者", "メール", "部署", "参加人数", "参加者", "特別申請理由", "管理メモ"])
    for reservation in reservations:
        status = effective_reservation_status(reservation)
        writer.writerow(
            [
                STATUS_LABELS_FOR_REPORT.get(status, status),
                reservation.start_at.date().isoformat(),
                reservation.start_at.strftime("%H:%M"),
                reservation.end_at.strftime("%H:%M"),
                reservation.room.name,
                reservation.title or reservation.purpose,
                reservation.reserver_name or reservation.user.name,
                reservation.user.email,
                reservation.department or "",
                reservation.participant_count,
                report_attendees_text(reservation),
                reservation.request_reason or "",
                reservation.admin_note or "",
            ]
        )

    suffix = start_date.strftime("%Y%m%d") if normalized_period == "daily" else f"{start_date.strftime('%Y%m%d')}-{(end_date - timedelta(days=1)).strftime('%Y%m%d')}"
    filename = f"meeting-report-{normalized_period}-{suffix}.csv"
    return output.getvalue(), filename, None


STATUS_LABELS_FOR_REPORT = {
    "approved": "承認済み",
    "pending": "承認待ち",
    "rejected": "却下",
}


def save_report_csv(filename: str, csv_text: str) -> str:
    report_dir = Path(REPORT_DIR)
    report_dir.mkdir(parents=True, exist_ok=True)
    path = report_dir / filename
    path.write_text(csv_text, encoding="utf-8-sig")
    return str(path)


def parse_date_time(date_value: str, time_value: str) -> datetime:
    try:
        parsed_date = date.fromisoformat(date_value)
        parsed_time = dt_time.fromisoformat(time_value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="日付または時刻の形式が正しくありません。") from exc
    return datetime.combine(parsed_date, parsed_time)


def validate_business_time(start_at: datetime, end_at: datetime) -> int:
    if start_at.minute not in {0, 30} or end_at.minute not in {0, 30}:
        raise HTTPException(status_code=400, detail="時刻は30分単位で選択してください。")
    if start_at.time() < BUSINESS_START or end_at.time() > BUSINESS_END:
        raise HTTPException(status_code=400, detail="予約可能時間は09:00から19:00までです。")

    minutes = reservation_minutes(start_at, end_at)
    if minutes < MIN_RESERVATION_MINUTES:
        raise HTTPException(status_code=400, detail="予約時間は30分以上にしてください。")
    if minutes > MAX_REQUEST_MINUTES:
        raise HTTPException(status_code=400, detail="予約時間は10時間以内にしてください。")
    return minutes


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ログインが必要です。")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ログインが必要です。") from exc

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="ログインが必要です。")
    return user


def require_password_ready(user: User = Depends(get_current_user)) -> User:
    if user.must_change_password:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="初期パスワードの変更が必要です。")
    return user


def require_admin(user: User = Depends(require_password_ready)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="管理者権限が必要です。")
    return user


def sync_configured_admin_account(db: Session) -> None:
    configured_email = ADMIN_EMAIL.lower().strip()
    if not configured_email:
        return

    configured_user = db.scalar(select(User).where(User.email == configured_email))
    legacy_admin = db.scalar(select(User).where(User.email == LEGACY_ADMIN_EMAIL))

    if configured_user:
        configured_user.role = "admin"
        configured_user.is_active = True
        if legacy_admin and legacy_admin.id != configured_user.id:
            legacy_admin.is_active = False
        return

    if legacy_admin:
        legacy_admin.email = configured_email
        legacy_admin.role = "admin"
        legacy_admin.is_active = True
        if ADMIN_NAME.strip():
            legacy_admin.name = ADMIN_NAME.strip()


def init_database() -> None:
    wait_for_database()
    Base.metadata.create_all(bind=engine)
    ensure_user_schema()
    ensure_reservation_schema()
    with SessionLocal() as db:
        for index, room_name in enumerate(ROOM_NAMES, start=1):
            room = db.scalar(select(Room).where(Room.name == room_name))
            if not room:
                db.add(Room(name=room_name, display_order=index))

        has_user = db.scalar(select(User.id).limit(1))
        if not has_user:
            if not ADMIN_EMAIL or not ADMIN_PASSWORD:
                raise RuntimeError("ADMIN_EMAIL and ADMIN_PASSWORD are required for first startup.")
            db.add(
                User(
                    email=ADMIN_EMAIL.lower().strip(),
                    name=ADMIN_NAME.strip() or "Demo Administrator",
                    role="admin",
                    password_hash=hash_password(ADMIN_PASSWORD),
                    must_change_password=False,
                    is_active=True,
                )
            )
        else:
            sync_configured_admin_account(db)
        db.commit()


@app.on_event("startup")
def on_startup() -> None:
    init_database()
    start_reminder_worker()


@app.get("/api/health")
def health():
    return {"ok": True, "timezone": "Asia/Tokyo"}


@app.get("/api/version")
def version():
    return {"version": APP_VERSION}


@app.get("/api/calendar/holidays", response_model=list[HolidayOut])
def get_holidays(year: Optional[int] = None, _: User = Depends(require_password_ready)):
    target_year = year or now_tokyo().year
    return [
        HolidayOut(date=holiday_date, name=name)
        for holiday_date, name in sorted(JAPAN_HOLIDAYS.items())
        if holiday_date.startswith(f"{target_year}-")
    ]


@app.post("/api/auth/login")
def login(data: LoginIn, response: Response, request: Request, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not user.is_active or not verify_password(data.password, user.password_hash):
        add_audit_log(
            db,
            "auth.login_failed",
            actor=user if user else None,
            target_type="user",
            target_id=user.id if user else None,
            detail={"email": email},
            request=request,
            actor_email=email,
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません。",
        )
    set_auth_cookie(response, create_token(user))
    add_audit_log(db, "auth.login", actor=user, target_type="user", target_id=user.id, request=request)
    db.commit()
    return {"user": user_to_out(user)}


@app.post("/api/auth/logout")
def logout(response: Response):
    clear_auth_cookie(response)
    return {"ok": True}


@app.post("/api/auth/change-password-public")
def change_password_public(
    data: PublicPasswordChangeIn,
    request: Request,
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.email == data.email.lower().strip()))
    if not user or not user.is_active or not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="メールアドレスまたは現在のパスワードが正しくありません。")
    if verify_password(data.new_password, user.password_hash):
        raise HTTPException(status_code=400, detail="現在とは異なる新しいパスワードを入力してください。")
    user.password_hash = hash_password(data.new_password)
    user.must_change_password = False
    user.reset_code_hash = None
    user.reset_code_expires_at = None
    add_audit_log(db, "auth.password_changed_public", actor=user, target_type="user", target_id=user.id, request=request)
    db.commit()
    return {"ok": True}


@app.post("/api/auth/forgot-password")
def forgot_password(data: ForgotPasswordIn, request: Request, db: Session = Depends(get_db)):
    if not mail_configured():
        raise HTTPException(status_code=400, detail="メール送信設定が未設定です。管理者に連絡してください。")

    email = data.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))
    if user and user.is_active:
        code = f"{secrets.randbelow(1000000):06d}"
        user.reset_code_hash = hash_password(code)
        user.reset_code_expires_at = now_tokyo() + timedelta(minutes=PASSWORD_RESET_CODE_MINUTES)
        try:
            send_email(user.email, "【RoomBook】パスワード再設定コード", build_password_reset_body(code))
            add_audit_log(db, "auth.password_reset_code_sent", actor=user, target_type="user", target_id=user.id, request=request)
            db.commit()
        except Exception as exc:
            db.rollback()
            print(f"password reset mail failed: user_id={user.id} error={exc}", flush=True)
            raise HTTPException(status_code=500, detail="確認コードを送信できませんでした。管理者に連絡してください。") from exc
    else:
        add_audit_log(db, "auth.password_reset_requested_unknown", target_type="user", detail={"email": email}, request=request, actor_email=email)
        db.commit()

    return {"ok": True, "message": "登録されているメールアドレス宛に確認コードを送信しました。"}


@app.post("/api/auth/reset-password")
def reset_password(data: ResetPasswordIn, request: Request, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    code = data.code.strip()
    user = db.scalar(select(User).where(User.email == email))
    if (
        not user
        or not user.is_active
        or not user.reset_code_hash
        or not user.reset_code_expires_at
        or user.reset_code_expires_at < now_tokyo()
        or not verify_password(code, user.reset_code_hash)
    ):
        raise HTTPException(status_code=400, detail="確認コードが正しくないか、有効期限が切れています。")
    if verify_password(data.new_password, user.password_hash):
        raise HTTPException(status_code=400, detail="現在とは異なる新しいパスワードを入力してください。")

    user.password_hash = hash_password(data.new_password)
    user.must_change_password = False
    user.reset_code_hash = None
    user.reset_code_expires_at = None
    add_audit_log(db, "auth.password_reset_completed", actor=user, target_type="user", target_id=user.id, request=request)
    db.commit()
    return {"ok": True}


@app.get("/api/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"user": user_to_out(current_user)}


@app.patch("/api/profile")
def update_profile(
    data: ProfileUpdateIn,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_ready),
):
    name = data.name.strip()
    department = data.department.strip()
    avatar_was_provided = "avatar_data_url" in data.model_fields_set
    avatar_data_url = normalize_avatar_data_url(data.avatar_data_url) if avatar_was_provided else current_user.avatar_data_url
    if not name:
        raise HTTPException(status_code=400, detail="氏名を入力してください。")

    changes = {}
    if current_user.name != name:
        changes["name"] = {"from": current_user.name, "to": name}
        current_user.name = name
    if (current_user.department or "") != department:
        changes["department"] = {"from": current_user.department or "", "to": department}
        current_user.department = department
    if avatar_was_provided and current_user.avatar_data_url != avatar_data_url:
        changes["avatar"] = {"updated": bool(avatar_data_url)}
        current_user.avatar_data_url = avatar_data_url

    if changes:
        add_audit_log(
            db,
            "profile.updated",
            actor=current_user,
            target_type="user",
            target_id=current_user.id,
            detail=changes,
            request=request,
        )
        db.commit()
        db.refresh(current_user)
    return {"ok": True, "user": user_to_out(current_user)}


@app.post("/api/auth/complete-initial-password")
def complete_initial_password(
    data: CompleteInitialPasswordIn,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if verify_password(data.new_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="初期パスワードとは異なる新しいパスワードを入力してください。")
    current_user.password_hash = hash_password(data.new_password)
    current_user.must_change_password = False
    current_user.reset_code_hash = None
    current_user.reset_code_expires_at = None
    add_audit_log(db, "auth.initial_password_changed", actor=current_user, target_type="user", target_id=current_user.id, request=request)
    db.commit()
    db.refresh(current_user)
    return {"ok": True, "user": user_to_out(current_user)}


@app.post("/api/auth/change-password")
def change_password(
    data: PasswordChangeIn,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="現在のパスワードが正しくありません。")
    if verify_password(data.new_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="現在とは異なる新しいパスワードを入力してください。")
    current_user.password_hash = hash_password(data.new_password)
    current_user.must_change_password = False
    current_user.reset_code_hash = None
    current_user.reset_code_expires_at = None
    add_audit_log(db, "auth.password_changed", actor=current_user, target_type="user", target_id=current_user.id, request=request)
    db.commit()
    return {"ok": True}


@app.get("/api/messages", response_model=list[MessageOut])
def get_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_ready),
):
    messages = db.scalars(
        select(Message)
        .where(or_(Message.recipient_user_id == current_user.id, Message.recipient_user_id.is_(None)))
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(100)
    ).all()
    read_ids = set(
        db.scalars(select(MessageRead.message_id).where(MessageRead.user_id == current_user.id)).all()
    )
    return [message_to_out(message, message.id in read_ids) for message in messages]


@app.post("/api/messages/{message_id}/read")
def read_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_ready),
):
    message = db.get(Message, message_id)
    if not message or message.recipient_user_id not in {None, current_user.id}:
        raise HTTPException(status_code=404, detail="メッセージが見つかりません。")
    existing = db.scalar(
        select(MessageRead).where(
            MessageRead.message_id == message_id,
            MessageRead.user_id == current_user.id,
        )
    )
    if not existing:
        db.add(MessageRead(message_id=message_id, user_id=current_user.id))
        db.commit()
    return {"ok": True, "message_id": message_id}


@app.post("/api/messages/read-all")
def read_all_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_ready),
):
    message_ids = set(
        db.scalars(
            select(Message.id).where(
                or_(Message.recipient_user_id == current_user.id, Message.recipient_user_id.is_(None))
            )
        ).all()
    )
    existing_ids = set(
        db.scalars(
            select(MessageRead.message_id).where(
                MessageRead.user_id == current_user.id,
                MessageRead.message_id.in_(message_ids),
            )
        ).all()
    ) if message_ids else set()
    for message_id in sorted(message_ids - existing_ids):
        db.add(MessageRead(message_id=message_id, user_id=current_user.id))
    if message_ids - existing_ids:
        db.commit()
    return {"ok": True, "read_count": len(message_ids)}


@app.get("/api/admin/messages", response_model=list[MessageOut])
def get_admin_sent_messages(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    messages = db.scalars(
        select(Message)
        .where(Message.sender_user_id == admin.id)
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(60)
    ).all()
    return [message_to_out(message) for message in messages]


@app.post("/api/admin/messages", response_model=MessageOut)
def create_admin_message(
    data: MessageCreateIn,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    title = data.title.strip()
    body = data.body.strip()
    if not title or not body:
        raise HTTPException(status_code=400, detail="件名とメッセージを入力してください。")

    recipient = None
    if data.recipient_user_id is not None:
        recipient = db.get(User, data.recipient_user_id)
        if not recipient or not recipient.is_active:
            raise HTTPException(status_code=404, detail="送信先ユーザーが見つかりません。")

    message = Message(
        sender_user_id=admin.id,
        recipient_user_id=recipient.id if recipient else None,
        title=title,
        body=body,
    )
    db.add(message)
    db.flush()
    add_audit_log(
        db,
        "admin.message_sent",
        actor=admin,
        target_type="message",
        target_id=message.id,
        detail={
            "recipient_user_id": recipient.id if recipient else None,
            "recipient": recipient.email if recipient else "all",
            "title": title,
        },
        request=request,
    )
    db.commit()
    db.refresh(message)
    return message_to_out(message)


@app.get("/api/rooms", response_model=list[RoomOut])
def get_rooms(db: Session = Depends(get_db), current_user: User = Depends(require_password_ready)):
    rooms = db.scalars(select(Room).order_by(Room.display_order)).all()
    return [RoomOut(id=room.id, name=room.name, display_order=room.display_order) for room in rooms]


@app.get("/api/users/directory", response_model=list[UserDirectoryOut])
def get_user_directory(db: Session = Depends(get_db), current_user: User = Depends(require_password_ready)):
    users = db.scalars(
        select(User)
        .where(User.is_active.is_(True))
        .order_by(User.name, User.email)
    ).all()
    return [UserDirectoryOut(id=user.id, name=user.name, email=user.email) for user in users]


@app.get("/api/reservations", response_model=list[ReservationOut])
def get_reservations(
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_ready),
):
    normalize_long_request_records(db)
    today = now_tokyo().date()
    start_date = date.fromisoformat(start) if start else today
    end_date = date.fromisoformat(end) if end else start_date + timedelta(days=1)
    start_at = datetime.combine(start_date, dt_time.min)
    end_at = datetime.combine(end_date, dt_time.min)

    rows = db.scalars(
        select(Reservation)
        .join(Reservation.room)
        .join(Reservation.user)
        .where(
            Reservation.start_at < end_at,
            Reservation.end_at > start_at,
            or_(
                Reservation.status.in_(ACTIVE_RESERVATION_STATUSES),
                Reservation.user_id == current_user.id,
            ),
        )
        .order_by(Reservation.start_at, Room.display_order)
    ).all()
    return [reservation_to_out(row, current_user) for row in rows]


@app.post("/api/reservations", response_model=ReservationOut)
def create_reservation(
    data: ReservationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_ready),
):
    normalize_long_request_records(db)
    title = (data.title or data.purpose or "").strip()
    department = (data.department or "").strip()
    reserver_name = (data.reserver_name or "").strip()
    notes = (data.notes or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="会議件名を入力してください。")
    if not department:
        raise HTTPException(status_code=400, detail="部署を入力してください。")
    if not reserver_name:
        raise HTTPException(status_code=400, detail="予約者を入力してください。")
    if data.participant_count < 1:
        raise HTTPException(status_code=400, detail="参加人数を入力してください。")
    if not notes:
        raise HTTPException(status_code=400, detail="備考を入力してください。")

    recurrence = (data.recurrence or "none").strip().lower()
    if recurrence not in {"none", "weekly"}:
        raise HTTPException(status_code=400, detail="繰り返し設定が正しくありません。")
    recurrence_count = data.recurrence_count if recurrence == "weekly" else 1

    attendee_ids = []
    for attendee_id in data.attendee_user_ids:
        if attendee_id > 0 and attendee_id not in attendee_ids:
            attendee_ids.append(attendee_id)
    if len(attendee_ids) > 100:
        raise HTTPException(status_code=400, detail="参加者は100名以内で選択してください。")

    attendee_users: list[User] = []
    if attendee_ids:
        attendee_users = db.scalars(
            select(User)
            .where(User.id.in_(attendee_ids), User.is_active.is_(True))
            .order_by(User.name, User.email)
        ).all()
        found_ids = {user.id for user in attendee_users}
        missing_ids = [str(attendee_id) for attendee_id in attendee_ids if attendee_id not in found_ids]
        if missing_ids:
            raise HTTPException(status_code=400, detail="選択された参加者の一部が見つかりません。")

    base_start_at = parse_date_time(data.date, data.start_time)
    base_end_at = parse_date_time(data.date, data.end_time)
    if base_end_at <= base_start_at:
        raise HTTPException(status_code=400, detail="終了時刻は開始時刻より後にしてください。")
    if base_start_at <= now_tokyo():
        raise HTTPException(status_code=400, detail="現在時刻を過ぎた時間は予約できません。開始時刻を選び直してください。")
    minutes = validate_business_time(base_start_at, base_end_at)

    occurrences: list[tuple[datetime, datetime]] = []
    for index in range(recurrence_count):
        offset = timedelta(days=7 * index)
        start_at = base_start_at + offset
        end_at = base_end_at + offset
        if start_at <= now_tokyo():
            raise HTTPException(status_code=400, detail="現在時刻を過ぎた時間は予約できません。開始時刻を選び直してください。")
        validate_business_time(start_at, end_at)
        closed_day = non_working_day_label(start_at.date())
        if closed_day:
            raise HTTPException(
                status_code=400,
                detail=f"{start_at.strftime('%Y/%m/%d')} は {closed_day} のため予約できません。勤務日に予約してください。",
            )
        occurrences.append((start_at, end_at))

    request_reason = (data.request_reason or "").strip()
    approval_reasons: list[str] = []
    if minutes > STANDARD_RESERVATION_MINUTES:
        approval_reasons.append("90分を超える予約")
    if recurrence == "weekly":
        approval_reasons.append("繰り返し予約")

    reservation_status = "approved"
    if approval_reasons:
        if not request_reason:
            raise HTTPException(status_code=400, detail="特別申請理由を入力してください。")
        reservation_status = "pending"

    room = db.scalar(select(Room).where(Room.id == data.room_id).with_for_update())
    if not room:
        raise HTTPException(status_code=404, detail="会議室が見つかりません。")

    for start_at, end_at in occurrences:
        conflict = db.scalar(
            select(Reservation)
            .where(
                Reservation.room_id == data.room_id,
                Reservation.start_at < end_at,
                Reservation.end_at > start_at,
                Reservation.status.in_(ACTIVE_RESERVATION_STATUSES),
            )
            .limit(1)
        )
        if conflict:
            conflict_status = "承認待ち" if conflict.status == "pending" else "予約済み"
            raise HTTPException(
                status_code=409,
                detail=(
                    f"{room.name} は {conflict.start_at.strftime('%Y/%m/%d %H:%M')} - "
                    f"{conflict.end_at.strftime('%H:%M')} に{conflict_status}です。"
                ),
            )

    created_reservations: list[Reservation] = []
    for start_at, end_at in occurrences:
        reservation = Reservation(
            room_id=data.room_id,
            user_id=current_user.id,
            start_at=start_at,
            end_at=end_at,
            purpose=title,
            title=title,
            department=department,
            reserver_name=reserver_name,
            participant_count=data.participant_count,
            notes=notes,
            status=reservation_status,
            request_reason=request_reason or None,
        )
        db.add(reservation)
        db.flush()
        for attendee in attendee_users:
            db.add(
                ReservationAttendee(
                    reservation_id=reservation.id,
                    user_id=attendee.id,
                    email=attendee.email,
                    name=attendee.name,
                )
            )
        created_reservations.append(reservation)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="同じ時間帯の予約が既に存在します。") from exc

    for reservation in created_reservations:
        db.refresh(reservation)
        add_audit_log(
            db,
            "reservation.created",
            actor=current_user,
            target_type="reservation",
            target_id=reservation.id,
            detail={
                "room": room.name,
                "title": reservation.title,
                "start_at": reservation.start_at,
                "end_at": reservation.end_at,
                "status": reservation.status,
                "attendees": [attendee.email for attendee in reservation.attendees],
                "recurrence": recurrence,
                "recurrence_count": recurrence_count,
            },
            request=request,
        )
    db.commit()

    for reservation in created_reservations:
        if reservation.status == "pending":
            try:
                send_approval_request_notice(reservation, room.name, current_user)
            except Exception as exc:
                print(f"approval request mail failed: reservation_id={reservation.id} error={exc}", flush=True)
        else:
            try:
                send_reservation_notice(reservation, "会議予約のお知らせ", "会議予約が確定しました。")
            except Exception as exc:
                print(f"reservation notice mail failed: reservation_id={reservation.id} error={exc}", flush=True)

    return reservation_to_out(created_reservations[0], current_user)


@app.delete("/api/reservations/{reservation_id}")
def delete_reservation(
    reservation_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_ready),
):
    reservation = db.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="予約が見つかりません。")
    if current_user.role != "admin" and reservation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="他のユーザーの予約は削除できません。")
    add_audit_log(
        db,
        "reservation.deleted",
        actor=current_user,
        target_type="reservation",
        target_id=reservation.id,
        detail={
            "room": reservation.room.name,
            "title": reservation.title or reservation.purpose,
            "start_at": reservation.start_at,
            "end_at": reservation.end_at,
            "status": reservation.status,
        },
        request=request,
    )
    db.delete(reservation)
    db.commit()
    return {"ok": True}


@app.get("/api/admin/users", response_model=list[UserOut])
def admin_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    users = db.scalars(select(User).order_by(User.id)).all()
    return [user_to_out(user) for user in users]


@app.get("/api/admin/mail/status")
def admin_mail_status(_: User = Depends(require_admin)):
    return {
        "mail_provider": active_mail_provider() or MAIL_PROVIDER,
        "mail_configured": mail_configured(),
        "graph_configured": graph_configured(),
        "graph_from_email": GRAPH_FROM_EMAIL,
        "smtp_configured": smtp_configured(),
        "approval_notice_enabled": MAIL_APPROVAL_REQUEST_ENABLED,
        "approval_notice_configured": approval_notice_configured(),
        "reminder_enabled": MAIL_REMINDER_ENABLED,
        "smtp_host": SMTP_HOST,
        "smtp_port": SMTP_PORT,
        "smtp_user": SMTP_USER,
        "smtp_from": SMTP_FROM,
        "admin_notification_email": ADMIN_NOTIFICATION_EMAIL,
    }


@app.post("/api/admin/mail/test")
def admin_mail_test(data: MailTestIn, current_user: User = Depends(require_admin)):
    if not mail_configured():
        raise HTTPException(status_code=400, detail="Mail delivery is not configured. Please check Graph or SMTP settings.")

    to_email = (data.email or current_user.email or ADMIN_NOTIFICATION_EMAIL).strip()
    if not to_email:
        raise HTTPException(status_code=400, detail="Test email address is empty.")

    subject = "【RoomBook】メール送信テスト"
    body = "\n".join(
        [
            "RoomBook 会議室予約システムのメール送信テストです。",
            "",
            "このメールを受信できていれば、メール送信設定は利用できます。",
            "",
            f"送信方式：{active_mail_provider()}",
            f"送信元：{current_mail_from()}",
            f"送信先：{to_email}",
            f"システムURL：{APP_BASE_URL}",
            "",
            "RoomBook 会議室予約システム",
        ]
    )

    try:
        send_email(to_email, subject, body)
    except Exception as exc:
        print(f"admin mail test failed: to={to_email} error={exc}", flush=True)
        raise HTTPException(status_code=500, detail=f"Mail test failed: {exc}") from exc

    return {"ok": True, "to": to_email}


@app.post("/api/admin/users", response_model=UserOut)
def admin_create_user(data: UserCreate, request: Request, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    role = data.role if data.role in {"admin", "user"} else "user"
    user = User(
        email=data.email.lower().strip(),
        name=data.name.strip(),
        department=data.department.strip(),
        role=role,
        password_hash=hash_password(data.password),
        must_change_password=True,
        is_active=True,
    )
    db.add(user)
    try:
        db.flush()
        add_audit_log(
            db,
            "admin.user_created",
            actor=admin,
            target_type="user",
            target_id=user.id,
            detail={"email": user.email, "name": user.name, "department": user.department, "role": user.role},
            request=request,
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="このメールアドレスは既に登録されています。") from exc
    db.refresh(user)
    return user_to_out(user)


@app.patch("/api/admin/users/{user_id}", response_model=UserOut)
def admin_update_user(
    user_id: int,
    data: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません。")
    if user_id == admin.id and data.is_active is False:
        raise HTTPException(status_code=400, detail="自分自身は停止できません。")
    if user_id == admin.id and data.role == "user":
        raise HTTPException(status_code=400, detail="自分自身の管理者権限は変更できません。")
    changes = {}
    if data.name is not None:
        name = data.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="氏名を入力してください。")
        user.name = name
        changes["name"] = name
    if data.email is not None:
        email = data.email.lower().strip()
        if not email:
            raise HTTPException(status_code=400, detail="メールアドレスを入力してください。")
        user.email = email
        changes["email"] = email
    if data.department is not None:
        department = data.department.strip()
        user.department = department
        changes["department"] = department
    if data.role is not None:
        if data.role not in {"admin", "user"}:
            raise HTTPException(status_code=400, detail="権限が正しくありません。")
        user.role = data.role
        changes["role"] = data.role
    if data.password:
        user.password_hash = hash_password(data.password)
        user.must_change_password = True
        user.reset_code_hash = None
        user.reset_code_expires_at = None
        changes["password_reset_by_admin"] = True
    if data.is_active is not None:
        user.is_active = data.is_active
        changes["is_active"] = data.is_active
    if changes:
        add_audit_log(
            db,
            "admin.user_updated",
            actor=admin,
            target_type="user",
            target_id=user.id,
            detail=changes,
            request=request,
        )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="このメールアドレスは既に登録されています。") from exc
    db.refresh(user)
    return user_to_out(user)


@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int, request: Request, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="自分自身は削除できません。")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません。")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="管理者アカウントは削除できません。")
    if user.is_active:
        raise HTTPException(status_code=400, detail="削除するには、先にユーザーを停止してください。")

    has_owned_reservation = db.scalar(
        select(Reservation.id).where(Reservation.user_id == user.id).limit(1)
    )
    has_attendee_history = db.scalar(
        select(ReservationAttendee.reservation_id)
        .where(ReservationAttendee.user_id == user.id)
        .limit(1)
    )
    if has_owned_reservation or has_attendee_history:
        raise HTTPException(
            status_code=409,
            detail="予約または参加履歴があるため削除できません。履歴保持のため停止状態で管理してください。",
        )

    deleted_user = {"id": user.id, "email": user.email, "name": user.name}
    detached_audit_logs = (
        db.query(AuditLog)
        .filter(AuditLog.actor_user_id == user.id)
        .update({AuditLog.actor_user_id: None}, synchronize_session=False)
    )
    add_audit_log(
        db,
        "admin.user_deleted",
        actor=admin,
        target_type="user",
        target_id=None,
        detail={
            "deleted_user": deleted_user,
            "detached_audit_logs": detached_audit_logs,
        },
        request=request,
    )
    delete_result = db.execute(sa_delete(User).where(User.id == user_id))
    if delete_result.rowcount != 1:
        db.rollback()
        raise HTTPException(status_code=409, detail="ユーザーを削除できませんでした。画面を更新して再度お試しください。")
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="関連する履歴があるため削除できません。停止状態で管理してください。",
        ) from exc

    db.expire_all()
    if db.scalar(select(User.id).where(User.id == user_id).limit(1)) is not None:
        raise HTTPException(status_code=500, detail="削除後のデータベース確認に失敗しました。")
    return {"ok": True, "deleted_user_id": user_id}


@app.get("/api/admin/reservations", response_model=list[ReservationOut])
def admin_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    normalize_long_request_records(db)
    rows = db.scalars(
        select(Reservation)
        .join(Reservation.room)
        .join(Reservation.user)
        .order_by(Reservation.start_at.desc())
        .limit(500)
    ).all()
    return [reservation_to_out(row, current_user) for row in rows]


@app.patch("/api/admin/reservations/{reservation_id}", response_model=ReservationOut)
def admin_update_reservation(
    reservation_id: int,
    data: ReservationDecision,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    reservation = db.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="予約が見つかりません。")
    normalize_long_request_records(db)
    next_status = normalize_reservation_status(data.status)
    if next_status not in {"approved", "rejected"}:
        raise HTTPException(status_code=400, detail="承認状態が正しくありません。")

    if next_status == "approved":
        conflict = db.scalar(
            select(Reservation)
            .where(
                Reservation.id != reservation.id,
                Reservation.room_id == reservation.room_id,
                Reservation.start_at < reservation.end_at,
                Reservation.end_at > reservation.start_at,
                Reservation.status.in_(ACTIVE_RESERVATION_STATUSES),
            )
            .limit(1)
        )
        if conflict:
            raise HTTPException(
                status_code=409,
                detail=f"{reservation.room.name} は {conflict.start_at.strftime('%H:%M')} - {conflict.end_at.strftime('%H:%M')} に予約済みです。",
            )

    reservation.status = next_status
    reservation.admin_note = data.admin_note.strip() if data.admin_note else None
    reservation.decided_at = now_tokyo()
    reservation.decided_by_user_id = current_user.id
    add_audit_log(
        db,
        "admin.reservation_decided",
        actor=current_user,
        target_type="reservation",
        target_id=reservation.id,
        detail={
            "status": next_status,
            "room": reservation.room.name,
            "title": reservation.title,
            "start": reservation.start_at.isoformat(),
            "end": reservation.end_at.isoformat(),
            "admin_note": reservation.admin_note,
        },
        request=request,
    )
    db.commit()
    db.refresh(reservation)
    try:
        if next_status == "approved":
            send_reservation_notice(reservation, "特別申請が承認されました", "長時間会議の特別申請が承認されました。")
        else:
            send_reservation_notice(reservation, "特別申請が却下されました", "長時間会議の特別申請が却下されました。")
    except Exception as exc:
        print(f"reservation decision mail failed: reservation_id={reservation.id} error={exc}", flush=True)
    return reservation_to_out(reservation, current_user)


@app.delete("/api/admin/reservations/{reservation_id}")
def admin_delete_reservation(
    reservation_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    reservation = db.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="予約が見つかりません。")
    add_audit_log(
        db,
        "admin.reservation_deleted",
        actor=current_user,
        target_type="reservation",
        target_id=reservation.id,
        detail={
            "status": reservation.status,
            "room": reservation.room.name,
            "title": reservation.title,
            "start": reservation.start_at.isoformat(),
            "end": reservation.end_at.isoformat(),
        },
        request=request,
    )
    db.delete(reservation)
    db.commit()
    return {"ok": True}


@app.get("/api/admin/reports/usage.csv")
def admin_usage_report_csv(
    request: Request,
    period: str = "daily",
    target_date: Optional[str] = None,
    save: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    report_reference = f"RPT-{now_tokyo().strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(2).upper()}"
    try:
        csv_text, filename, _ = build_usage_report_csv(db, period, target_date)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        print(
            f"report generation failed: reference={report_reference} "
            f"period={period} target_date={target_date} error={exc}",
            flush=True,
        )
        raise HTTPException(
            status_code=500,
            detail=f"CSVの生成に失敗しました。APIログの参照番号 {report_reference} を確認してください。",
        ) from exc

    saved_path = None
    save_error = None
    if save:
        try:
            saved_path = save_report_csv(filename, csv_text)
        except Exception as exc:
            save_error = str(exc)
            print(
                f"report save failed: reference={report_reference} "
                f"filename={filename} report_dir={REPORT_DIR} error={exc}",
                flush=True,
            )

    audit_error = None
    try:
        add_audit_log(
            db,
            "admin.report_exported",
            actor=current_user,
            target_type="report",
            target_id=None,
            detail={
                "period": period,
                "target_date": target_date,
                "filename": filename,
                "saved_path": saved_path,
                "save_error": bool(save_error),
                "reference": report_reference,
            },
            request=request,
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        audit_error = str(exc)
        print(
            f"report audit failed: reference={report_reference} filename={filename} error={exc}",
            flush=True,
        )

    return Response(
        content=f"\ufeff{csv_text}",
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
            "X-Report-Saved": "true" if saved_path else "false",
            "X-Report-Save-Error": "true" if save_error else "false",
            "X-Report-Audit-Error": "true" if audit_error else "false",
            "X-Report-Reference": report_reference,
        },
    )


@app.get("/api/admin/audit-logs", response_model=list[AuditLogOut])
def admin_audit_logs(
    limit: int = 120,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    safe_limit = max(1, min(limit, 300))
    rows = db.scalars(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(safe_limit)
    ).all()
    return [audit_to_out(row) for row in rows]
