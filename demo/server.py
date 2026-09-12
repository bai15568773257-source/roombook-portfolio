#!/usr/bin/env python3
"""Local, read-only UI preview with fictional fixtures and no backend services."""

import argparse
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
from pathlib import Path
import re
from urllib.parse import parse_qs, unquote, urlsplit
from zoneinfo import ZoneInfo


SITE_DIR = (Path(__file__).resolve().parent.parent / "site").resolve()
READ_ONLY_MESSAGE = (
    "DEMO：架空データを使用した閲覧専用プレビューです。"
    "予約・変更・削除・メール送信・CSV出力は実行できません。"
)
BANNER = """
<style>
  html { scroll-padding-top: 70px; }
  body { padding-top: 56px !important; }
  #portfolio-demo-banner {
    position: fixed; inset: 0 0 auto; z-index: 2147483647;
    box-sizing: border-box; min-height: 56px; padding: 10px 22px;
    display: flex; align-items: center; justify-content: center; gap: 14px;
    background: #12384a; color: #fff; border-bottom: 2px solid #48d5b8;
    font: 500 13px/1.5 system-ui, sans-serif; text-align: center;
  }
  #portfolio-demo-banner strong {
    padding: 3px 9px; border: 1px solid #69e0c8; border-radius: 5px;
    color: #9df5e1; letter-spacing: .1em; white-space: nowrap;
  }
  @media (max-width: 600px) {
    body { padding-top: 78px !important; }
    #portfolio-demo-banner { min-height: 78px; padding: 8px 12px; font-size: 12px; }
  }
</style>
<aside id="portfolio-demo-banner" role="note" aria-label="デモの説明">
  <strong>DEMO</strong>
  <span>架空データの画面プレビュー・閲覧専用｜保存・変更・送信はできません。</span>
</aside>
"""


def make_fixtures():
    """Produce fictional examples, anchored to the current Tokyo date for the UI."""
    today = datetime.now(ZoneInfo("Asia/Tokyo")).date()
    users = [
        {
            "id": index,
            "email": f"demo{index}@example.test",
            "name": "デモ管理者" if index == 1 else f"サンプル利用者 {chr(63 + index)}",
            "department": "デモ運営" if index == 1 else ["企画チーム", "開発チーム", "サポートチーム"][(index - 2) % 3],
            "avatar_data_url": None,
            "role": "admin" if index == 1 else "user",
            "must_change_password": False,
            "is_active": True,
        }
        for index in range(1, 7)
    ]
    rooms = [
        {"id": index, "name": f"Room {chr(64 + index)}", "display_order": index}
        for index in range(1, 7)
    ]
    reservations = []

    def booking(room_id, day_offset, start, end, title, owner_id, status="approved", reason=None):
        day = (today + timedelta(days=day_offset)).isoformat()
        owner = users[owner_id - 1]
        guests = [users[(owner_id + 1) % len(users)], users[(owner_id + 2) % len(users)]]
        reservations.append({
            "id": len(reservations) + 1,
            "room_id": room_id,
            "room_name": rooms[room_id - 1]["name"],
            "user_id": owner_id,
            "user_name": owner["name"],
            "user_email": owner["email"],
            "start_at": f"{day}T{start}:00",
            "end_at": f"{day}T{end}:00",
            "date": day,
            "start_time": start,
            "end_time": end,
            "purpose": title,
            "title": title,
            "department": owner["department"],
            "reserver_name": owner["name"],
            "participant_count": len(guests) + 1,
            "notes": "画面確認用の架空の会議です。実在する人物・組織とは関係ありません。",
            "status": status,
            "request_reason": reason,
            "admin_note": None,
            "approval_required": reason is not None,
            "can_delete": False,
            "attendees": [
                {"id": guest["id"], "user_id": guest["id"], "name": guest["name"], "email": guest["email"]}
                for guest in guests
            ],
        })

    booking(1, 0, "09:00", "10:00", "サンプル：朝の進捗共有", 2)
    booking(2, 0, "10:30", "12:00", "サンプル：企画レビュー", 3)
    booking(3, 0, "13:00", "14:00", "サンプル：仕様の確認", 1)
    booking(1, 0, "14:30", "15:30", "サンプル：チーム定例", 4)
    booking(4, 0, "16:00", "17:00", "サンプル：振り返り", 5)
    booking(5, 1, "13:00", "15:00", "サンプル：ワークショップ", 3, "pending", "デモ用：検討時間を確保するため。")
    booking(6, 2, "10:00", "11:00", "サンプル：週次ミーティング", 2, "pending", "デモ用：週次の繰り返し予約。")
    for day_offset in [-3, -2, -1, 1, 2, 3, 5, 7]:
        booking((day_offset % 6) + 1, day_offset, "10:00", "11:00", "サンプル：プロジェクト相談", (day_offset % 5) + 1)

    messages = [{
        "id": 1,
        "sender_name": "デモ管理者",
        "recipient_user_id": None,
        "recipient_name": "全員",
        "title": "閲覧専用デモへようこそ",
        "body": "表示されるユーザー・予約・操作履歴はすべて架空です。メニューを切り替えて画面をご覧いただけます。",
        "created_at": f"{today.isoformat()}T08:30:00",
        "is_read": True,
    }]
    audit_logs = [{
        "id": index,
        "created_at": f"{today.isoformat()}T08:{45 + index:02d}:00",
        "actor_email": users[index - 1]["email"],
        "actor_name": users[index - 1]["name"],
        "action": "reservation.created",
        "target_type": "reservation",
        "target_id": index,
        "detail": json.dumps({"title": reservations[index - 1]["title"], "status": "approved", "notes": "架空の操作履歴"}, ensure_ascii=False),
        "ip_address": None,
    } for index in range(1, 5)]
    return {"users": users, "rooms": rooms, "reservations": reservations, "messages": messages, "audit_logs": audit_logs}


FIXTURES = make_fixtures()


def expected_api_version():
    source = (SITE_DIR / "app.js").read_text(encoding="utf-8")
    match = re.search(r'const EXPECTED_API_VERSION\s*=\s*"([^"\n]+)"', source)
    return match.group(1) if match else "local-ui-preview"


class PreviewHandler(BaseHTTPRequestHandler):
    server_version = "RoomBookLocalPreview/1.0"

    def respond(self, code, content, content_type="application/json; charset=utf-8", extra_headers=None):
        if not isinstance(content, bytes):
            content = json.dumps(content, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; form-action 'none'")
        for name, value in (extra_headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(content)

    def valid_host(self):
        expected = str(self.server.server_address[1])
        host = self.headers.get("Host", "").lower()
        return host in {f"127.0.0.1:{expected}", f"localhost:{expected}"}

    def reject_write(self):
        self.close_connection = True
        self.respond(405, {"detail": READ_ONLY_MESSAGE}, extra_headers={"Allow": "GET, HEAD"})

    do_POST = reject_write
    do_PATCH = reject_write
    do_DELETE = reject_write
    do_PUT = reject_write

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        if not self.valid_host():
            self.respond(403, {"detail": "このプレビューには http://127.0.0.1:ポート番号 でアクセスしてください。"})
            return
        request = urlsplit(self.path)
        path = unquote(request.path)
        query = parse_qs(request.query)
        if path.startswith("/api/"):
            self.api_get(path, query)
            return

        candidate = (SITE_DIR / path.lstrip("/")).resolve()
        if path in {"/", "/index.html"}:
            candidate = SITE_DIR / "index.html"
        if not candidate.is_relative_to(SITE_DIR) or not candidate.is_file() or candidate.suffix not in {".html", ".js", ".css", ".svg", ".png", ".jpg", ".webp", ".ico"}:
            self.respond(404, {"detail": "このデモで提供する画面ファイルが見つかりません。"})
            return
        content = candidate.read_bytes()
        if candidate == SITE_DIR / "index.html":
            page = content.decode("utf-8")
            page = re.sub(r"(<body\b[^>]*>)", lambda match: match.group(1) + BANNER, page, count=1)
            content = page.encode("utf-8")
        content_type = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"
        if content_type.startswith("text/") or candidate.suffix in {".js", ".svg"}:
            content_type += "; charset=utf-8"
        self.respond(200, content, content_type)

    def api_get(self, path, query):
        users = FIXTURES["users"]
        routes = {
            "/api/health": {"ok": True, "timezone": "Asia/Tokyo", "demo": True},
            "/api/version": {"version": expected_api_version(), "demo": True},
            "/api/auth/me": {"user": users[0]},
            "/api/rooms": FIXTURES["rooms"],
            "/api/users/directory": [{key: user[key] for key in ("id", "email", "name")} for user in users],
            "/api/admin/users": users,
            "/api/admin/reservations": FIXTURES["reservations"],
            "/api/messages": FIXTURES["messages"],
            "/api/admin/messages": FIXTURES["messages"],
            "/api/admin/audit-logs": FIXTURES["audit_logs"],
            "/api/calendar/holidays": [],
            "/api/admin/mail/status": {
                "mail_provider": "demo-disabled", "mail_configured": False,
                "graph_configured": False, "graph_from_email": "",
                "smtp_configured": False, "approval_notice_enabled": False,
                "approval_notice_configured": False, "reminder_enabled": False,
                "smtp_host": "", "smtp_port": 587, "smtp_user": "",
                "smtp_from": "", "admin_notification_email": "",
            },
        }
        if path == "/api/reservations":
            start = query.get("start", [""])[0]
            end = query.get("end", ["9999-12-31"])[0]
            self.respond(200, [item for item in FIXTURES["reservations"] if start <= item["date"] < end])
        elif path == "/api/admin/reports/usage.csv":
            # The real GET endpoint also saves a report and records an audit event.
            self.respond(405, {"detail": READ_ONLY_MESSAGE})
        elif path in routes:
            self.respond(200, routes[path])
        else:
            self.respond(404, {"detail": "このAPIは閲覧専用プレビューでは提供していません。実環境への接続は行いません。"})

    def log_message(self, message, *args):
        # Never log request bodies, cookies or authorization headers.
        print(f"[local-demo] {message % args}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765, help="Local port (default: 8765). Host is always 127.0.0.1.")
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("port must be between 1 and 65535")
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), PreviewHandler)
    except OSError as exc:
        parser.exit(1, f"Local demo could not start on port {args.port}: {exc}\n")
    print(f"DEMO / 架空データ・閲覧専用: http://127.0.0.1:{args.port}/", flush=True)
    print("No database, credentials, email or external API is used. Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
