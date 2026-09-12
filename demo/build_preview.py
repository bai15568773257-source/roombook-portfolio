#!/usr/bin/env python3
"""Build an isolated, no-login fictional-user preview for static hosting.

Run from any directory: python3 demo/build_preview.py
Only the explicit site asset allowlist below is copied. Neither backend code,
environment files, database files, uploads, nor reports enter the generated site.
"""

from pathlib import Path
import re
import shutil


ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = ROOT / "docs"
ASSETS = ("app.js", "i18n.js", "styles.css", "favicon.svg", "logo.svg", "logo-light.svg", "logo-dark.svg")

PREVIEW_STYLE = """
<style id="portfolioPreviewStyles">
  :root { --preview-banner-height: 76px; }
  body { padding-top: var(--preview-banner-height) !important; }
  html { scroll-padding-top: calc(var(--preview-banner-height) + 16px); }
  .app-sidebar { top: var(--preview-banner-height) !important; height: calc(100vh - var(--preview-banner-height)) !important; }
  #portfolio-preview-banner {
    position: fixed; inset: 0 0 auto; z-index: 2147483647;
    min-height: var(--preview-banner-height); box-sizing: border-box;
    display: flex; align-items: center; justify-content: center; gap: 18px;
    padding: 12px 22px; border-bottom: 2px solid #54dcb6;
    background: #12384a; color: #fff; font: 500 13px/1.5 system-ui, sans-serif;
  }
  #portfolio-preview-banner strong { color: #a5f3d5; white-space: nowrap; letter-spacing: .04em; }
  #portfolio-preview-banner small { display: block; color: #d2e8ec; font-size: 11px; }
  #portfolio-preview-banner a { color: #fff; white-space: nowrap; text-underline-offset: 3px; }
  #portfolio-preview-notice {
    position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%);
    z-index: 2147483646; width: min(540px, calc(100% - 32px));
    box-sizing: border-box; padding: 15px 20px; border-radius: 12px;
    border: 1px solid #54dcb6; background: #12384a; color: #fff;
    box-shadow: 0 12px 30px #0003; font: 500 14px/1.6 system-ui, sans-serif;
  }
  #loginView, #forcePasswordView, #passwordDialog, #forgotPasswordDialog,
  #logoutButton, #logoutConfirmModal, #profileModal, #profilePasswordButton,
  #headerProfileButton, #adminSection, #adminSidebarNav, #adminTabButton,
  #adminMessageComposer, #adminSentMessageSection, #userEditorModal {
    display: none !important;
  }
  #profileButton { cursor: default; }
  #reservationForm::before {
    content: "フォームの操作感をご覧いただけます。入力内容は保存・送信されません。";
    grid-column: 1 / -1; padding: 12px 16px; border-radius: 10px;
    background: #12384a; color: #fff; font-size: 13px; line-height: 1.6;
  }
  @media (max-width: 900px) { .app-sidebar { height: auto !important; } }
  @media (max-width: 600px) {
    :root { --preview-banner-height: 104px; }
    #portfolio-preview-banner { gap: 8px 12px; flex-wrap: wrap; justify-content: flex-start; padding: 10px 14px; font-size: 12px; }
    #portfolio-preview-banner > span { flex: 1; min-width: 190px; }
    #portfolio-preview-banner small { font-size: 10px; }
    #portfolio-preview-banner a { font-size: 11px; }
  }
</style>
"""

BANNER = """
<aside id="portfolio-preview-banner" role="note" aria-label="一般ユーザーの公開デモ" data-i18n-ignore>
  <strong>RoomBook DEMO</strong>
  <span>一般ユーザーとして体験・ログイン不要<br>すべて架空データ／閲覧専用・保存や送信はできません。
    <small>General-user preview · Fictional data · Read only · 一般使用者預覽・虛構資料</small>
  </span>
  <a href="https://github.com/bai15568773257-source/roombook-portfolio" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
</aside>
<div id="portfolio-preview-notice" role="status" aria-live="polite" data-i18n-ignore hidden></div>
<noscript><p style="padding:24px">このプレビューを表示するには JavaScript を有効にしてください。実際のアカウントでのログインは不要です。</p></noscript>
"""


def build():
    assets_out = OUT
    assets_out.mkdir(parents=True, exist_ok=True)
    for name in ASSETS:
        shutil.copyfile(SITE / name, assets_out / name)

    app_source = (SITE / "app.js").read_text(encoding="utf-8")
    version_match = re.search(r'const EXPECTED_API_VERSION\s*=\s*"([^"\n]+)"', app_source)
    if not version_match:
        raise ValueError("Cannot identify the UI API version; refusing to build a mismatched preview.")
    shim = (ROOT / "demo" / "preview.js").read_text(encoding="utf-8")
    shim = shim.replace("__EXPECTED_API_VERSION__", version_match.group(1))
    (assets_out / "preview.js").write_text(shim, encoding="utf-8")

    page = (SITE / "index.html").read_text(encoding="utf-8")
    page = page.replace("<title>RoomBook 会議室予約システム</title>", "<title>RoomBook | 一般ユーザー・公開デモ</title>")
    page = page.replace('<meta charset="utf-8" />', '''<meta charset="utf-8" />
    <meta name="description" content="会議室予約システム RoomBook の一般ユーザー向けポートフォリオ。ログイン不要・架空データのみ・閲覧専用。" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'" />''')

    def asset_url(match):
        name = match.group(2)
        if name not in ASSETS:
            raise ValueError(f"Unexpected absolute asset URL: {name}")
        return f'{match.group(1)}="./{name}{match.group(3) or ""}"'

    page = re.sub(r'(src|href)="/([^"?]+)(\?[^"\n]*)?"', asset_url, page)
    page = page.replace("</head>", PREVIEW_STYLE + "\n  </head>", 1)
    page = page.replace("<body>", "<body>\n" + BANNER, 1)
    page = page.replace('<script src="./i18n.js', '<script src="./preview.js" defer></script>\n    <script src="./i18n.js', 1)
    if page.count('src="./preview.js"') != 1:
        raise ValueError("Preview shim was not inserted exactly once.")
    (OUT / "index.html").write_text(page, encoding="utf-8")
    (OUT / ".nojekyll").write_text("# Serve this generated preview as plain static files.\n", encoding="utf-8")
    print(f"Built {OUT / 'index.html'} with {len(ASSETS) + 1} allowlisted assets.")


if __name__ == "__main__":
    build()
