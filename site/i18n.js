(function () {
  "use strict";

  const STORAGE_KEY = "meeting-language";
  const SUPPORTED_LANGUAGES = ["ja", "zh", "en"];
  const LOCALES = { ja: "ja-JP", zh: "zh-CN", en: "en-US" };
  const HTML_LANGS = { ja: "ja", zh: "zh-CN", en: "en" };
  const LANGUAGE_PICKER_STYLE_BUILD = "20260727-reservation-delete-confirm-v35";
  const LANGUAGE_META = {
    ja: { code: "JP", label: "日本語" },
    zh: { code: "ZH", label: "中文" },
    en: { code: "EN", label: "English" },
  };
  const ATTRIBUTE_NAMES = ["aria-label", "title", "placeholder"];
  const textOriginals = new WeakMap();
  const attributeOriginals = new WeakMap();
  const lastAppliedText = new WeakMap();
  const lastAppliedAttributes = new WeakMap();
  let currentLanguage = readSavedLanguage();
  let mutationLock = false;
  let observer = null;
  let initialized = false;

  const COPY_ENTRIES = [
    ["会議室予約システム", "会议室预约系统", "Meeting Room Booking"],
    ["社内アカウントでログインしてください。", "请使用公司内部账号登录。", "Sign in with your company account."],
    ["メールアドレス", "邮箱地址", "Email address"],
    ["パスワード", "密码", "Password"],
    ["ログイン", "登录", "Sign in"],
    ["アカウントのサポート", "账号帮助", "Account support"],
    ["パスワードを変更する", "修改密码", "Change password"],
    ["パスワードを忘れた場合", "忘记密码", "Forgot password"],
    ["パスワードを変更", "修改密码", "Change password"],
    ["現在のパスワード", "当前密码", "Current password"],
    ["新しいパスワード", "新密码", "New password"],
    ["新しいパスワード確認", "确认新密码", "Confirm new password"],
    ["現在のパスワードを確認して、新しいパスワードへ変更します。", "验证当前密码后设置新密码。", "Verify your current password, then set a new one."],
    ["登録メールアドレスへ確認コードを送信し、新しいパスワードを設定します。", "向已登记邮箱发送验证码并设置新密码。", "Send a verification code to your registered email and set a new password."],
    ["メールアドレスを入力して、確認コードを送信してください。", "请输入邮箱地址并发送验证码。", "Enter your email address and send a verification code."],
    ["確認コードを送信", "发送验证码", "Send verification code"],
    ["メールで届いた6桁のコードと新しいパスワードを入力してください。", "请输入邮件中的6位验证码和新密码。", "Enter the 6-digit code from your email and a new password."],
    ["確認コード", "验证码", "Verification code"],
    ["6桁のコード", "6位验证码", "6-digit code"],
    ["パスワードを再設定", "重置密码", "Reset password"],
    ["初期パスワードの変更", "修改初始密码", "Change initial password"],
    ["初回ログインのため、ご自身だけが知っている新しいパスワードを設定してください。", "首次登录，请设置只有您本人知道的新密码。", "For your first sign-in, set a new password known only to you."],
    ["8文字以上で、初期パスワードとは異なるものを設定してください。", "请设置至少8个字符且不同于初始密码的密码。", "Use at least 8 characters and choose a password different from the initial one."],
    ["設定して続行", "保存并继续", "Save and continue"],
    ["閉じる", "关闭", "Close"],
    ["メインナビゲーション", "主导航", "Main navigation"],
    ["会議室予約メニュー", "会议室预约菜单", "Meeting room menu"],
    ["予約", "预约", "Bookings"],
    ["管理", "管理", "Administration"],
    ["管理・承認", "管理与审批", "Administration"],
    ["ダッシュボード", "仪表盘", "Dashboard"],
    ["新規予約", "新建预约", "New booking"],
    ["タイムライン", "时间轴", "Timeline"],
    ["カレンダー", "日历", "Calendar"],
    ["予約管理", "预约管理", "Booking management"],
    ["承認管理", "审批管理", "Approval management"],
    ["ユーザー管理", "用户管理", "User management"],
    ["個人設定を開く", "打开个人设置", "Open profile settings"],
    ["個人設定", "个人设置", "Profile settings"],
    ["ログアウト", "退出登录", "Sign out"],
    ["表示言語", "显示语言", "Display language"],
    ["表示モード", "显示模式", "Display mode"],
    ["表示モードを変更", "切换显示模式", "Change display mode"],
    ["ライト", "浅色", "Light"],
    ["ダーク", "深色", "Dark"],
    ["自動", "自动", "System"],
    ["常に明るく表示", "始终使用浅色", "Always use light mode"],
    ["常に暗く表示", "始终使用深色", "Always use dark mode"],
    ["端末設定に合わせる", "跟随设备设置", "Match device settings"],
    ["ライト：常に明るく表示", "浅色：始终使用浅色", "Light: always use light mode"],
    ["ダーク：常に暗く表示", "深色：始终使用深色", "Dark: always use dark mode"],
    ["メッセージ", "消息", "Messages"],
    ["メッセージを開く", "打开消息", "Open messages"],
    ["予約状況", "预约状态", "Booking status"],
    ["承認待ち", "待审批", "Pending approval"],
    ["本日の予約", "今日预约", "Today's bookings"],
    ["有効ユーザー", "有效用户", "Active users"],
    ["承認済み予約", "已批准预约", "Approved bookings"],
    ["未処理なし", "无待处理事项", "Nothing pending"],
    ["現在利用可能", "当前可用", "Currently available"],
    ["登録済み", "已登记", "Registered"],
    ["フロア概要", "楼层概览", "Floor overview"],
    ["本日の会議室利用状況", "今日会议室使用情况", "Today's room usage"],
    ["タイムラインで見る →", "在时间轴中查看 →", "View timeline →"],
    ["本日の予定", "今日安排", "Today's schedule"],
    ["自分の予定", "我的安排", "My schedule"],
    ["時刻順", "按时间排序", "By time"],
    ["承認待ちの申請", "待审批申请", "Pending requests"],
    ["特別申請状況", "特殊申请状态", "Special request status"],
    ["すべて確認 →", "查看全部 →", "View all →"],
    ["自分が予約・参加する会議", "自己预约或参与的会议", "Meetings you organize or attend"],
    ["管理者の承認後に予約が確定します。", "管理员批准后预约才会确认。", "The booking is confirmed after administrator approval."],
    ["審査中", "审核中", "Under review"],
    ["本日の予約を作成します。", "创建今天的预约。", "Create a booking for today."],
    ["会議名と予約者情報", "会议名称和预约人信息", "Meeting and organizer"],
    ["基本情報", "基本信息", "Basic information"],
    ["予約内容を入力してください", "请输入预约内容", "Enter booking details"],
    ["会議件名", "会议主题", "Meeting title"],
    ["会議件名を入力", "请输入会议主题", "Enter a meeting title"],
    ["部署", "部门", "Department"],
    ["部署名を入力", "请输入部门名称", "Enter department"],
    ["予約者", "预约人", "Organizer"],
    ["予約者名を入力", "请输入预约人姓名", "Enter organizer name"],
    ["日時と会議室", "日期、时间和会议室", "Date, time and room"],
    ["空き状況を確認して選択", "确认空闲情况后选择", "Check availability and select"],
    ["会議室", "会议室", "Meeting room"],
    ["会議室を選択してください", "请选择会议室", "Select a meeting room"],
    ["日付", "日期", "Date"],
    ["開始", "开始", "Start"],
    ["終了", "结束", "End"],
    ["参加者", "参与者", "Attendees"],
    ["人数とメンバーを設定", "设置人数和成员", "Set attendees and count"],
    ["参加人数", "参与人数", "Attendee count"],
    ["参加者（任意）", "参与者（可选）", "Attendees (optional)"],
    ["氏名・メールで検索", "按姓名或邮箱搜索", "Search by name or email"],
    ["選択した参加者にも予約・承認・開始前通知を送信します。", "也会向已选参与者发送预约、审批和会前通知。", "Selected attendees also receive booking, approval, and reminder notifications."],
    ["詳細設定", "详细设置", "Additional settings"],
    ["繰り返し・備考・特別申請", "重复、备注和特殊申请", "Recurrence, notes, and special requests"],
    ["繰り返し予約（任意）", "重复预约（可选）", "Recurring booking (optional)"],
    ["なし", "无", "None"],
    ["毎週", "每周", "Weekly"],
    ["回数", "次数", "Occurrences"],
    ["備考", "备注", "Notes"],
    ["設備、来客、会議準備などを入力", "请输入设备、访客、会议准备等信息", "Enter equipment, visitors, or preparation notes"],
    ["90分超過・繰り返し予約を申請する", "申请超过90分钟或重复预约", "Request a long or recurring booking"],
    ["特別申請欄", "特殊申请", "Special request"],
    ["特別申請理由", "特殊申请理由", "Reason for special request"],
    ["上記の時間で特別申請を提出します。", "按上述时间提交特殊申请。", "Submit a special request for the time above."],
    ["予約を作成", "创建预约", "Create booking"],
    ["空き状況", "空闲情况", "Availability"],
    ["会議室・日付・時間がここに表示されます。", "会议室、日期和时间将在此显示。", "Room, date, and time appear here."],
    ["会議室別の予約状況を表示します。", "按会议室显示预约情况。", "View bookings by meeting room."],
    ["予約スケジュール", "预约时间表", "Booking schedule"],
    ["30分刻み", "30分钟间隔", "30-minute intervals"],
    ["今日", "今天", "Today"],
    ["日付を切り替える", "切换日期", "Change date"],
    ["前日", "前一天", "Previous day"],
    ["翌日", "后一天", "Next day"],
    ["月間カレンダー", "月历", "Monthly calendar"],
    ["会議室の色で予定をすばやく確認できます。", "可通过会议室颜色快速确认安排。", "Use room colors to scan bookings quickly."],
    ["今月", "本月", "This month"],
    ["月を切り替える", "切换月份", "Change month"],
    ["前月", "上个月", "Previous month"],
    ["翌月", "下个月", "Next month"],
    ["会議室で絞り込む", "按会议室筛选", "Filter by room"],
    ["選択日の予約", "所选日期的预约", "Bookings for selected date"],
    ["管理・承認ダッシュボード", "管理与审批仪表盘", "Administration dashboard"],
    ["長時間予約の承認、予約状況の確認、ユーザー管理を行います。", "处理长时间预约审批、查看预约状态并管理用户。", "Approve long bookings, review booking status, and manage users."],
    ["管理者モード", "管理员模式", "Administrator mode"],
    ["システム全体を管理", "管理整个系统", "Manage the full system"],
    ["管理メニュー", "管理菜单", "Administration menu"],
    ["総覧", "总览", "Overview"],
    ["状況確認", "状态概览", "Status overview"],
    ["承認", "审批", "Approvals"],
    ["予約監査", "预约审查", "Booking audit"],
    ["件待ち", "项待处理", "pending"],
    ["件", "条", "items"],
    ["名", "名", "users"],
    ["操作ログ", "操作日志", "Activity log"],
    ["履歴確認", "查看历史", "Review history"],
    ["メール設定", "邮件设置", "Email settings"],
    ["送信確認", "发送测试", "Delivery check"],
    ["レポート", "报表", "Reports"],
    ["CSV出力", "导出CSV", "Export CSV"],
    ["管理者用の本日概要", "管理员今日概览", "Today's admin overview"],
    ["本日の会議室概要", "今日会议室概览", "Today's room overview"],
    ["本日の会議室利用状況を全社分で確認します。", "查看全公司的今日会议室使用情况。", "Review today's room usage across the company."],
    ["管理対象の予約を時刻順に表示します。", "按时间显示管理范围内的预约。", "Show managed bookings in chronological order."],
    ["メール送信テスト", "邮件发送测试", "Email delivery test"],
    ["パスワード再設定、承認通知、開始前通知の送信設定を確認できます。", "检查密码重置、审批通知和会前通知的发送设置。", "Check delivery settings for password reset, approval, and reminder emails."],
    ["テストメールを送信", "发送测试邮件", "Send test email"],
    ["利用レポート", "使用报表", "Usage report"],
    ["会議室利用率、部署別予約数、長時間申請数をCSVで出力できます。", "可将会议室使用率、各部门预约数和长时间申请数导出为CSV。", "Export room usage, department booking counts, and long-request counts to CSV."],
    ["基準日", "基准日期", "Reference date"],
    ["日次CSVを作成", "生成每日CSV", "Create daily CSV"],
    ["週次CSVを作成", "生成每周CSV", "Create weekly CSV"],
    ["作成したCSVはダウンロードされ、NAS の reports フォルダにも保存されます。", "生成的CSV将自动下载，并保存到NAS的reports文件夹。", "Generated CSV files are downloaded and also saved in the NAS reports folder."],
    ["90分を超える予約と繰り返し予約の特別申請を確認・処理できます。", "查看并处理超过90分钟和重复预约的特殊申请。", "Review and process special requests for long and recurring bookings."],
    ["承認待ちの申請を確認してください", "请确认待审批申请", "Review pending requests"],
    ["申請内容を確認して、承認または却下を選択してください。", "请确认申请内容并选择批准或驳回。", "Review the request and choose approve or reject."],
    ["未処理の特別申請を日時順に表示します。", "按日期时间显示未处理的特殊申请。", "Show unprocessed special requests by date and time."],
    ["審査済みの特別申請", "已审核特殊申请", "Reviewed special requests"],
    ["全ユーザーの予約を確認・管理できます。", "查看并管理所有用户的预约。", "Review and manage bookings for all users."],
    ["件名・担当者で検索", "按主题或负责人搜索", "Search title or owner"],
    ["すべて", "全部", "All"],
    ["承認済", "已批准", "Approved"],
    ["承認待", "待审批", "Pending"],
    ["却下", "已驳回", "Rejected"],
    ["予約状態の絞り込み", "按预约状态筛选", "Filter by booking status"],
    ["操作者・操作・詳細を検索", "搜索操作人、操作或详情", "Search actor, action, or details"],
    ["操作ログの分類", "操作日志分类", "Activity categories"],
    ["認証", "认证", "Authentication"],
    ["その他", "其他", "Other"],
    ["日時", "日期时间", "Date and time"],
    ["担当者", "负责人", "Owner"],
    ["状態", "状态", "Status"],
    ["操作者", "操作人", "Actor"],
    ["操作", "操作", "Action"],
    ["対象", "对象", "Target"],
    ["詳細", "详情", "Details"],
    ["直近60件", "最近60条", "Latest 60"],
    ["ログイン、予約、承認、ユーザー管理などの操作履歴を確認できます。", "可查看登录、预约、审批和用户管理等操作记录。", "Review activity history for sign-ins, bookings, approvals, and user management."],
    ["ユーザー", "用户", "Users"],
    ["レポート出力", "导出报表", "Report export"],
    ["プロフィール更新", "更新个人资料", "Profile update"],
    ["予約作成", "创建预约", "Booking created"],
    ["集計期間", "统计周期", "Reporting period"],
    ["週次", "每周", "Weekly"],
    ["日次", "每日", "Daily"],
    ["ファイル", "文件", "File"],
    ["NAS保存", "NAS保存", "NAS storage"],
    ["保存済み", "已保存", "Saved"],
    ["参照ID", "参考ID", "Reference ID"],
    ["未設定", "未设置", "Not set"],
    ["プロフィール画像", "头像", "Profile image"],
    ["画像を更新", "已更新图片", "Image updated"],
    ["名前・メールで検索", "按姓名或邮箱搜索", "Search name or email"],
    ["ユーザー追加", "添加用户", "Add user"],
    ["ユーザー一覧", "用户列表", "User list"],
    ["アカウント、権限、利用状態を管理します。", "管理账号、权限和使用状态。", "Manage accounts, roles, and access status."],
    ["氏名", "姓名", "Name"],
    ["権限", "权限", "Role"],
    ["ステータス", "状态", "Status"],
    ["一般", "普通用户", "User"],
    ["管理者", "管理员", "Administrator"],
    ["有効", "有效", "Active"],
    ["停止", "停用", "Suspended"],
    ["新しい利用者の初期情報を登録します。", "登记新用户的初始信息。", "Register the initial information for a new user."],
    ["初期パスワード", "初始密码", "Initial password"],
    ["ユーザーを追加", "添加用户", "Add user"],
    ["キャンセル", "取消", "Cancel"],
    ["ユーザー削除", "删除用户", "Delete user"],
    ["ユーザーを削除しますか？", "要删除该用户吗？", "Delete this user?"],
    ["この操作は元に戻せません。予約・参加履歴があるユーザーは削除できません。", "此操作无法撤销。有预约或参与记录的用户不能删除。", "This action cannot be undone. Users with booking or attendance history cannot be deleted."],
    ["完全に削除する", "彻底删除", "Delete permanently"],
    ["このユーザーを削除", "删除此用户", "Delete this user"],
    ["プロフィール", "个人资料", "Profile"],
    ["表示名・部署・プロフィール画像を更新できます。", "可更新显示名称、部门和头像。", "Update your display name, department, and profile image."],
    ["プロフィール画像を選択", "选择头像", "Choose profile image"],
    ["画像を選択", "选择图片", "Choose image"],
    ["画像を削除", "删除图片", "Remove image"],
    ["JPEG・PNG・WebP／正方形に自動調整", "JPEG、PNG、WebP／自动裁剪为正方形", "JPEG, PNG, or WebP / automatically cropped square"],
    ["JPEG・PNG・WebP／全体が収まるよう高画質で調整", "JPEG、PNG、WebP／高质量保留完整图片", "JPEG, PNG, or WebP / high-quality fit without cropping"],
    ["例：営業部", "例如：营业部", "Example: Sales"],
    ["設定を保存", "保存设置", "Save settings"],
    ["ログアウトしますか？", "要退出登录吗？", "Sign out?"],
    ["ログイン画面に戻ります。よろしいですか？", "即将返回登录页面，是否继续？", "You will return to the sign-in screen. Continue?"],
    ["予約詳細", "预约详情", "Booking details"],
    ["システムメッセージ", "系統訊息", "System Messages"],
    ["管理者からのお知らせを確認できます。", "查看管理员发送的通知。", "Review messages from administrators."],
    ["新しいメッセージ", "新消息", "New message"],
    ["個人または全員へ送信します。", "发送给个人或全体用户。", "Send to one person or everyone."],
    ["送信先", "收件人", "Recipient"],
    ["全ユーザー", "所有用户", "All users"],
    ["件名", "主题", "Subject"],
    ["本文", "正文", "Message"],
    ["例：システムメンテナンスのお知らせ", "例：系统维护通知", "Example: System maintenance notice"],
    ["ユーザーへ伝える内容を入力", "请输入要发送给用户的内容", "Enter the message for users"],
    ["メッセージを送信", "发送消息", "Send message"],
    ["受信メッセージ", "收到的消息", "Inbox"],
    ["新しい未読メッセージはありません。", "没有新的未读消息。", "There are no new unread messages."],
    ["すべて既読", "全部标为已读", "Mark all read"],
    ["最近の送信", "最近发送", "Recently sent"],
    ["通知", "通知", "Notifications"],
    ["自分の特別申請や予約結果を確認できます。", "可查看自己的特殊申请和预约结果。", "Review your special requests and booking results."],
    ["90分を超える会議の審査状況を確認できます。", "可查看超过90分钟会议的审核状态。", "Review approval status for meetings longer than 90 minutes."],
    ["当日の予約時間から稼働率を確認できます。", "根据当天预约时间查看使用率。", "Review utilization based on today's booked time."],
    ["自分が予約した会議だけを時刻順に表示します。", "仅按时间显示自己预约的会议。", "Show only your bookings in chronological order."],
    ["氏名またはメールを2文字以上入力してください。", "请输入至少2个字符的姓名或邮箱。", "Enter at least 2 characters of a name or email."],
    ["選択済みの参加者は上に表示されます。", "已选择的参与者会显示在上方。", "Selected attendees appear above."],
    ["種類", "类型", "Type"],
    ["例：毎週月曜日の部門定例をまとめて作成できます。", "例：可一次创建每周一的部门例会。", "Example: create a weekly Monday department meeting in one step."],
    ["会議件名を入力してください", "请输入会议主题", "Enter a meeting title"],
    ["この日の予約済み時間はありません。", "当天没有已预约时段。", "There are no booked time slots for this day."],
    ["予約スケジュールに反映済みです。", "已显示在预约时间表中。", "Already reflected in the booking schedule."],
    ["特別申請が承認されました", "特殊申请已批准", "Special request approved"],
    ["人数未設定", "人数未设置", "Count not set"],
    ["人数未入力", "未填写人数", "Count missing"],
    ["選択中", "已选择", "Selected"],
    ["選択", "选择", "Select"],
    ["特別申請：未提出", "特殊申请：未提交", "Special request: not submitted"],
    ["特別申請：不可", "特殊申请：不可用", "Special request: unavailable"],
    ["特別申請", "特殊申请", "Special request"],
    ["承認済み", "已批准", "Approved"],
    ["申請終了", "申请结束", "Request ended"],
    ["本日", "今天", "Today"],
    ["今週", "本周", "This week"],
    ["毎週のみ", "仅每周", "Weekly only"],
    ["予定", "安排", "Schedule"],
    ["空き", "空闲", "Available"],
    ["終日空き", "全天空闲", "Available all day"],
    ["予約済み", "已预约", "Booked"],
    ["稼働率", "使用率", "Utilization"],
    ["本日は終日空いています", "今天全天空闲", "Available all day today"],
    ["この日の予定はありません。", "当天没有安排。", "No schedule for this day."],
    ["通知はありません。", "没有通知。", "No notifications."],
    ["該当するユーザーはありません。", "没有符合条件的用户。", "No matching users."],
    ["条件に一致する予約データはありません。", "没有符合条件的预约。", "No bookings match the selected conditions."],
    ["承認待ちの申請はありません", "没有待审批申请", "No pending requests"],
    ["承認待ちの申請はありません。", "没有待审批申请。", "There are no pending requests."],
    ["次回", "下一场", "Next"],
    ["本日の予定はありません", "今天没有安排", "No schedule today"],
    ["空いている会議室から、新しい予定を登録できます。", "可从空闲会议室创建新安排。", "Create a new booking from an available room."],
    ["新しい予約を作成", "创建新预约", "Create a new booking"],
    ["海の日", "海之日", "Marine Day"],
    ["新しい特別申請が届くと、ここに表示されます。", "新的特殊申请到达后会显示在这里。", "New special requests will appear here."],
    ["処理中…", "处理中…", "Processing…"],
    ["CSV作成中…", "正在生成CSV…", "Creating CSV…"],
    ["予約を削除", "删除预约", "Delete booking"],
    ["予約削除の確認", "确认删除预约", "Confirm booking deletion"],
    ["予約取消の確認", "确认取消预约", "Confirm booking cancellation"],
    ["この予約を削除しますか？", "要删除此预约吗？", "Delete this booking?"],
    ["この予約を取り消しますか？", "要取消此预约吗？", "Cancel this booking?"],
    ["削除する予約を確認してください。", "请确认要删除的预约。", "Review the booking you are about to delete."],
    ["取り消す予約を確認してください。", "请确认要取消的预约。", "Review the booking you are about to cancel."],
    ["対象の予約", "目标预约", "Selected booking"],
    ["この操作は元に戻せません", "此操作无法撤销", "This action cannot be undone"],
    ["予約内容を確認してから実行してください。", "请确认预约内容后再执行。", "Review the booking details before continuing."],
    ["削除しています...", "正在删除...", "Deleting..."],
    ["取り消しています...", "正在取消...", "Cancelling..."],
    ["予約は取り消されましたが、画面の再読み込みに失敗しました。", "预约已取消，但页面刷新失败。", "The booking was cancelled, but the page could not be refreshed."],
    ["予約は削除されましたが、画面の再読み込みに失敗しました。", "预约已删除，但页面刷新失败。", "The booking was deleted, but the page could not be refreshed."],
    ["編集", "编辑", "Edit"],
    ["変更を保存", "保存更改", "Save changes"],
    ["ユーザーを編集", "编辑用户", "Edit user"],
    ["このユーザーを停止", "停用该用户", "Suspend this user"],
    ["このユーザーを有効化", "启用该用户", "Activate this user"],
    ["月", "一", "Mon"],
    ["火", "二", "Tue"],
    ["水", "三", "Wed"],
    ["木", "四", "Thu"],
    ["金", "五", "Fri"],
    ["土", "六", "Sat"],
    ["日", "日", "Sun"]
  ];

  const COPY = {
    zh: new Map(COPY_ENTRIES.map(([ja, zh]) => [ja, zh])),
    en: new Map(COPY_ENTRIES.map(([ja, , en]) => [ja, en])),
  };

  const LANGUAGE_MESSAGES = {
    ja: "表示言語を日本語に変更しました。",
    zh: "显示语言已切换为中文。",
    en: "Display language changed to English.",
  };

  function readSavedLanguage() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return SUPPORTED_LANGUAGES.includes(saved) ? saved : "ja";
    } catch (_) {
      return "ja";
    }
  }

  function locale() {
    return LOCALES[currentLanguage] || LOCALES.ja;
  }

  function translatePattern(source) {
    if (currentLanguage === "ja" || !source) return source;
    const isZh = currentLanguage === "zh";
    let match = source.match(/^(\d+)\s*件待ち$/);
    if (match) return isZh ? `${match[1]}项待处理` : `${match[1]} pending`;
    match = source.match(/^(\d+)\s*件の予約$/);
    if (match) return isZh ? `${match[1]}条预约` : `${match[1]} booking${match[1] === "1" ? "" : "s"}`;
    match = source.match(/^(\d+)\s*件を表示$/);
    if (match) return isZh ? `显示${match[1]}条` : `${match[1]} result${match[1] === "1" ? "" : "s"}`;
    match = source.match(/^(\d+)\s*件$/);
    if (match) return isZh ? `${match[1]}条` : `${match[1]} item${match[1] === "1" ? "" : "s"}`;
    match = source.match(/^(\d+)\s*件の未読メッセージがあります。$/);
    if (match) return isZh ? `有${match[1]}条未读消息。` : `You have ${match[1]} unread message${match[1] === "1" ? "" : "s"}.`;
    match = source.match(/^(\d+)\s*名のユーザー$/);
    if (match) return isZh ? `${match[1]}名用户` : `${match[1]} user${match[1] === "1" ? "" : "s"}`;
    match = source.match(/^(\d+)\s*名選択中$/);
    if (match) return isZh ? `已选择${match[1]}人` : `${match[1]} selected`;
    match = source.match(/^(\d+)\s*名$/);
    if (match) return isZh ? `${match[1]}人` : `${match[1]} people`;
    match = source.match(/^(\d+)回$/);
    if (match) return isZh ? `${match[1]}次` : `${match[1]} time${match[1] === "1" ? "" : "s"}`;
    match = source.match(/^予約 #(\d+)$/);
    if (match) return isZh ? `预约 #${match[1]}` : `Booking #${match[1]}`;
    match = source.match(/^ユーザー #(\d+)$/);
    if (match) return isZh ? `用户 #${match[1]}` : `User #${match[1]}`;
    match = source.match(/^(\d+)分$/);
    if (match) return isZh ? `${match[1]}分钟` : `${match[1]} min`;
    match = source.match(/^(\d+)% 予約済み$/);
    if (match) return isZh ? `已预约 ${match[1]}%` : `${match[1]}% booked`;
    match = source.match(/^次回 (.+)$/);
    if (match) return isZh ? `下一场 ${match[1]}` : `Next ${match[1]}`;
    match = source.match(/^(.+) の予約を作成します。$/);
    if (match) return isZh ? `创建${match[1]}的预约。` : `Create a booking for ${match[1]}.`;
    match = source.match(/^(.+) は空いています$/);
    if (match) return isZh ? `${match[1]}空闲` : `${match[1]} is available`;
    match = source.match(/^(.+) は勤務日です。現在時刻を過ぎた時間は選択できません。予約可能時間は(.+)です。$/);
    if (match) {
      return isZh
        ? `${match[1]}为工作日。已超过当前时间的时段不可选择。可预约时间为${match[2]}。`
        : `${match[1]} is a working day. Times earlier than now cannot be selected. Available hours: ${match[2]}.`;
    }
    match = source.match(/^(.+) は勤務日です。(.*)$/);
    if (match) {
      const suffix = isZh
        ? "已超过当前时间的时段不可选择。"
        : "Times earlier than the current time cannot be selected.";
      return `${match[1]} ${isZh ? "为工作日。" : "is a working day. "}${suffix}`;
    }
    match = source.match(/^(\d+)分の通常予約です。90分を超える場合は特別申請欄を使用してください。$/);
    if (match) return isZh ? `这是${match[1]}分钟的普通预约。超过90分钟时请使用特殊申请。` : `This is a standard ${match[1]}-minute booking. Use a special request for more than 90 minutes.`;
    match = source.match(/^特別申請：(.+)$/);
    if (match) return isZh ? `特殊申请：${translate(match[1])}` : `Special request: ${translate(match[1])}`;
    match = source.match(/^(.+) ・ (\d{1,2}:\d{2})〜(\d{1,2}:\d{2}) ・ (.+) ・ (\d+)名$/);
    if (match) {
      const count = isZh ? `${match[5]}人` : `${match[5]} people`;
      return `${match[1]} · ${match[2]}–${match[3]} · ${match[4]} · ${count}`;
    }
    match = source.match(/^表示モード：(.+)。変更する$/);
    if (match) return isZh ? `显示模式：${translate(match[1])}。点击切换` : `Display mode: ${translate(match[1])}. Change`;
    match = source.match(/^自動：端末設定に合わせる。現在は(.+)$/);
    if (match) return isZh ? `自动：跟随设备设置。当前为${translate(match[1])}` : `System: match device settings. Currently ${translate(match[1])}`;
    match = source.match(/^(.+)を編集$/);
    if (match) return isZh ? `编辑${match[1]}` : `Edit ${match[1]}`;
    match = source.match(/^表示モードを「(.+)」に変更しました。(.*)$/);
    if (match) {
      const suffix = match[2].replace(/^（現在：(.+)）$/, (_, mode) => isZh ? `（当前：${translate(mode)}）` : `(current: ${translate(mode)})`);
      return isZh ? `显示模式已切换为“${translate(match[1])}”。${suffix}` : `Display mode changed to “${translate(match[1])}”. ${suffix}`;
    }
    match = source.match(/^端末設定に合わせる（現在：(.+)）$/);
    if (match) return isZh ? `跟随设备设置（当前：${translate(match[1])}）` : `Match device settings (current: ${translate(match[1])})`;
    match = source.match(/^自動・(.+)$/);
    if (match) return isZh ? `自动・${translate(match[1])}` : `System · ${translate(match[1])}`;
    match = source.match(/^(\d+)年(\d+)月$/);
    if (match) return isZh ? `${match[1]}年${match[2]}月` : `${new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "Asia/Tokyo" }).format(new Date(`${match[1]}-${String(match[2]).padStart(2, "0")}-01T00:00:00+09:00`))}`;
    return source;
  }

  function translate(source) {
    const normalized = String(source ?? "").trim();
    if (!normalized || currentLanguage === "ja") return normalized;
    return COPY[currentLanguage].get(normalized) || translatePattern(normalized);
  }

  function translatedTextWithWhitespace(source) {
    const leading = source.match(/^\s*/)?.[0] || "";
    const trailing = source.match(/\s*$/)?.[0] || "";
    const core = source.trim();
    if (!core) return source;
    return `${leading}${translate(core)}${trailing}`;
  }

  function shouldIgnore(element) {
    return !element
      || element.closest("script, style, [data-i18n-ignore]")
      || element.matches("input[type='date'], input[type='time']");
  }

  function isUserContent(element) {
    return Boolean(element?.closest(
      ".profile-copy strong, .user-name-cell strong, .admin-reservation-title strong, "
      + ".admin-reservation-owner strong, .admin-reservation-owner small, .timeline-booking strong, "
      + ".today-agenda-item > div > strong, .calendar-event, .calendar-agenda-title-row strong, "
      + ".dashboard-pending-item strong",
    ));
  }

  function translateTextNode(node, refreshOriginal = false) {
    const parent = node.parentElement;
    if (!node.nodeValue || shouldIgnore(parent) || isUserContent(parent)) return;
    const current = node.nodeValue;
    if (refreshOriginal && lastAppliedText.get(node) === current) {
      lastAppliedText.delete(node);
      return;
    }
    const currentCore = current.trim();
    if (!currentCore) return;
    const knownJapanese = COPY.zh.has(currentCore) || COPY.en.has(currentCore) || translatePattern(currentCore) !== currentCore;
    if (!textOriginals.has(node) || refreshOriginal || knownJapanese) {
      textOriginals.set(node, current);
    }
    const original = textOriginals.get(node);
    const next = currentLanguage === "ja" ? original : translatedTextWithWhitespace(original);
    if (node.nodeValue !== next) {
      lastAppliedText.set(node, next);
      node.nodeValue = next;
    }
  }

  function translateAttributes(element, refreshOriginal = false) {
    if (!(element instanceof Element) || shouldIgnore(element)) return;
    let originals = attributeOriginals.get(element);
    if (!originals) {
      originals = {};
      attributeOriginals.set(element, originals);
    }
    let lastApplied = lastAppliedAttributes.get(element);
    if (!lastApplied) {
      lastApplied = {};
      lastAppliedAttributes.set(element, lastApplied);
    }
    ATTRIBUTE_NAMES.forEach((name) => {
      if (!element.hasAttribute(name)) return;
      const current = element.getAttribute(name);
      if (refreshOriginal && lastApplied[name] === current) {
        delete lastApplied[name];
        return;
      }
      const knownJapanese = COPY.zh.has(current) || COPY.en.has(current) || translatePattern(current) !== current;
      if (!(name in originals) || refreshOriginal || knownJapanese) originals[name] = current;
      const original = originals[name];
      const next = currentLanguage === "ja" ? original : translate(original);
      if (current !== next) {
        lastApplied[name] = next;
        element.setAttribute(name, next);
      }
    });
  }

  function translateTree(root, refreshOriginal = false) {
    if (!root) return;
    mutationLock = true;
    try {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root, refreshOriginal);
        return;
      }
      if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
      if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root, refreshOriginal);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, refreshOriginal);
        else translateAttributes(node, refreshOriginal);
        node = walker.nextNode();
      }
    } finally {
      mutationLock = false;
    }
  }

  function translateDocument() {
    translateTree(document.body);
    document.title = currentLanguage === "zh"
      ? "RoomBook 会议室预约系统"
      : currentLanguage === "en"
        ? "RoomBook Meeting Room Booking"
        : "RoomBook 会議室予約システム";
    syncCoreLabels();
  }

  function syncCoreLabels() {
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.setAttribute("aria-label", currentLanguage === "zh" ? "显示语言" : currentLanguage === "en" ? "Display language" : "表示言語");
    });
    document.querySelectorAll("[data-language-menu-button]").forEach((button) => {
      button.setAttribute("aria-label", currentLanguage === "zh" ? "选择显示语言" : currentLanguage === "en" ? "Choose display language" : "表示言語を選択");
    });
    const fixedLabels = [
      ["#logoutButton", "ログアウト"],
      ["#profileButton", "個人設定を開く"],
      ["#headerProfileButton", "個人設定を開く"],
      ["#messageCenterButton", "メッセージを開く"],
      ["#closeMessageDrawerButton", "閉じる"],
    ];
    fixedLabels.forEach(([selector, japanese]) => {
      const element = document.querySelector(selector);
      if (element) element.setAttribute("aria-label", translate(japanese));
    });
    const profileButton = document.querySelector("#headerProfileButton");
    if (profileButton) profileButton.title = translate("個人設定");
    const messageButton = document.querySelector("#messageCenterButton");
    if (messageButton) messageButton.title = translate("メッセージ");

    const themeButton = document.querySelector("#themeMenuButton");
    const themeMode = document.documentElement.dataset.themeMode || "system";
    const effectiveMode = document.documentElement.dataset.theme === "dark" ? "ダーク" : "ライト";
    const themeModeLabel = themeMode === "light" ? "ライト" : themeMode === "dark" ? "ダーク" : "自動";
    const visibleLabel = themeMode === "system" ? `自動・${effectiveMode}` : themeModeLabel;
    if (themeButton) {
      themeButton.title = translate("表示モードを変更");
      themeButton.setAttribute("aria-label", translatePattern(`表示モード：${visibleLabel}。変更する`));
    }
    const systemButton = document.querySelector("#themeSystemButton");
    if (systemButton) {
      systemButton.setAttribute("aria-label", translatePattern(`自動：端末設定に合わせる。現在は${effectiveMode}`));
    }
  }

  function startObserver() {
    if (observer || typeof MutationObserver !== "function") return;
    observer = new MutationObserver((mutations) => {
      if (mutationLock) return;
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target, true);
          return;
        }
        if (mutation.type === "attributes") {
          translateAttributes(mutation.target, true);
          return;
        }
        mutation.addedNodes.forEach((node) => translateTree(node, true));
      });
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTE_NAMES,
    });
  }

  function syncSelectors() {
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      if (select.value !== currentLanguage) select.value = currentLanguage;
    });
    const currentMeta = LANGUAGE_META[currentLanguage];
    document.querySelectorAll("[data-language-current]").forEach((label) => {
      label.textContent = currentMeta.label;
    });
    document.querySelectorAll("[data-language-option]").forEach((option) => {
      const active = option.dataset.languageOption === currentLanguage;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-checked", String(active));
    });
  }

  function closeLanguagePickers(exceptPicker = null) {
    document.querySelectorAll("[data-language-picker]").forEach((picker) => {
      if (picker === exceptPicker) return;
      const button = picker.querySelector("[data-language-menu-button]");
      const menu = picker.querySelector("[data-language-menu]");
      if (menu) menu.hidden = true;
      picker.classList.remove("is-open");
      button?.setAttribute("aria-expanded", "false");
    });
  }

  function languageMenuMarkup() {
    const options = SUPPORTED_LANGUAGES.map((language) => {
      const meta = LANGUAGE_META[language];
      return `
        <button class="language-option" type="button" role="menuitemradio" aria-checked="false" data-language-option="${language}">
          <span class="language-option-code" aria-hidden="true">${meta.code}</span>
          <span class="language-option-label">${meta.label}</span>
          <span class="language-option-check" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="m6.5 12.5 3.4 3.4 7.6-8"/></svg>
          </span>
        </button>
      `;
    }).join("");
    return `
      <button class="language-menu-button" type="button" aria-haspopup="menu" aria-expanded="false" data-language-menu-button>
        <span class="language-menu-globe" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.8 12h16.4M12 3.5c2.1 2.3 3.15 5.1 3.15 8.5S14.1 18.2 12 20.5M12 3.5C9.9 5.8 8.85 8.6 8.85 12s1.05 6.2 3.15 8.5"/></svg>
        </span>
        <span class="language-menu-current" data-language-current>日本語</span>
        <span class="language-menu-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m8 10 4 4 4-4"/></svg>
        </span>
      </button>
      <div class="language-menu" role="menu" data-language-menu hidden>
        <div class="language-options">${options}</div>
      </div>
    `;
  }

  function customLanguageStylesAvailable() {
    const marker = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--meeting-language-picker-build")
      .trim()
      .replace(/^["']|["']$/g, "");
    return marker === LANGUAGE_PICKER_STYLE_BUILD;
  }

  function upgradeLanguagePickers() {
    if (!customLanguageStylesAvailable()) {
      document.documentElement.dataset.languagePickerMode = "native";
      return;
    }
    document.documentElement.dataset.languagePickerMode = "custom";
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      const sourceControl = select.closest(".language-select-control");
      if (!sourceControl || sourceControl.matches("[data-language-picker]")) return;
      const picker = document.createElement("div");
      picker.className = `${sourceControl.className} language-picker`;
      picker.dataset.languagePicker = "";
      picker.dataset.i18nIgnore = "";
      picker.innerHTML = languageMenuMarkup();
      select.hidden = true;
      select.classList.add("language-native-select");
      select.setAttribute("aria-hidden", "true");
      select.tabIndex = -1;
      picker.append(select);
      sourceControl.replaceWith(picker);
    });
  }

  function initLanguagePickerEvents() {
    document.querySelectorAll("[data-language-picker]").forEach((picker) => {
      const button = picker.querySelector("[data-language-menu-button]");
      const menu = picker.querySelector("[data-language-menu]");
      const options = [...picker.querySelectorAll("[data-language-option]")];
      button?.addEventListener("click", (event) => {
        event.stopPropagation();
        const opening = menu?.hidden ?? false;
        closeLanguagePickers(opening ? picker : null);
        if (!menu) return;
        menu.hidden = !opening;
        picker.classList.toggle("is-open", opening);
        button.setAttribute("aria-expanded", String(opening));
        if (opening) options.find((option) => option.classList.contains("is-active"))?.focus();
      });
      menu?.addEventListener("click", (event) => event.stopPropagation());
      options.forEach((option) => {
        option.addEventListener("click", () => {
          applyLanguage(option.dataset.languageOption, { announce: true });
          closeLanguagePickers();
          button?.focus();
        });
      });
      menu?.addEventListener("keydown", (event) => {
        const activeIndex = options.indexOf(document.activeElement);
        if (event.key === "Escape") {
          event.preventDefault();
          closeLanguagePickers();
          button?.focus();
          return;
        }
        if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        options[(activeIndex + direction + options.length) % options.length]?.focus();
      });
    });
    document.addEventListener("click", () => closeLanguagePickers());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeLanguagePickers();
    });
  }

  function applyLanguage(language, { persist = true, announce = false } = {}) {
    const nextLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : "ja";
    currentLanguage = nextLanguage;
    document.documentElement.lang = HTML_LANGS[nextLanguage];
    document.documentElement.dataset.language = nextLanguage;
    if (persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, nextLanguage);
      } catch (_) {
        // Local storage is optional; language switching must still work.
      }
    }
    syncSelectors();
    translateDocument();
    window.dispatchEvent(new CustomEvent("meeting:languagechange", {
      detail: { language: nextLanguage, announce },
    }));
  }

  function init() {
    if (initialized || !document.body) return;
    initialized = true;
    upgradeLanguagePickers();
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.addEventListener("change", () => applyLanguage(select.value, { announce: true }));
    });
    initLanguagePickerEvents();
    applyLanguage(currentLanguage, { persist: false });
    startObserver();
  }

  function formatDate(dateString, style = "short") {
    const normalized = String(dateString || "").replaceAll("/", "-");
    const date = new Date(`${normalized}T00:00:00+09:00`);
    const options = style === "full"
      ? { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }
      : style === "month"
        ? { year: "numeric", month: "long", timeZone: "Asia/Tokyo" }
        : { month: "short", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" };
    return new Intl.DateTimeFormat(locale(), options).format(date);
  }

  window.MEETING_I18N = {
    init,
    applyLanguage,
    translate,
    translateDocument,
    formatDate,
    get language() {
      return currentLanguage;
    },
    get locale() {
      return locale();
    },
    get languageChangedMessage() {
      return LANGUAGE_MESSAGES[currentLanguage];
    },
  };
}());
