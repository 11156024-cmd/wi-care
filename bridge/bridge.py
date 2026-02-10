"""
Wi-Care Python Bridge v1.0
ESP32 ↔ SQLite ↔ Node.js 的資料橋接器

支援模式：
  1. HTTP  - 輪詢 ESP32 HTTP /status 端點（預設）
  2. SERIAL - 讀取 ESP32 USB 序列輸出
  3. SIM    - 模擬模式（無硬體開發用）

功能：
  - 讀取 ESP32 movement_score 感測數據
  - 寫入 SQLite sensor_data 資料表
  - 推送到 Node.js 後端 (POST /api/sensor-data/push)
  - 可選：Gemini AI 跌倒分析
  - 可選：LINE 推播通知

使用範例：
  python bridge.py                     # HTTP 模式
  python bridge.py --mode serial       # 序列埠模式
  python bridge.py --mode sim          # 模擬模式
  python bridge.py --esp32-ip 192.168.1.100  # 指定 IP
"""

import argparse
import json
import os
import re
import sqlite3
import sys
import time
from datetime import datetime
from pathlib import Path

# ---------- 可選依賴 ----------
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("[WARN] requests 未安裝，無法推送到後端。執行: pip install requests")

try:
    import serial
    import serial.tools.list_ports
    HAS_SERIAL = True
except ImportError:
    HAS_SERIAL = False

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

# ---------- 設定 ----------
DEFAULT_CONFIG = {
    "esp32_ip": os.getenv("ESP32_IP", "172.20.10.9"),
    "esp32_port": int(os.getenv("ESP32_PORT", "8080")),
    "backend_url": os.getenv("BACKEND_URL", "http://localhost:3001"),
    "device_id": os.getenv("DEVICE_ID", "ESP32-001"),
    "serial_port": os.getenv("SERIAL_PORT", ""),
    "serial_baud": int(os.getenv("SERIAL_BAUD", "115200")),
    "poll_interval": float(os.getenv("POLL_INTERVAL", "2.0")),
    "db_path": str(Path(__file__).parent.parent / "data" / "wicare.db"),
    "gemini_api_key": os.getenv("GEMINI_API_KEY", ""),
    "line_token": os.getenv("LINE_CHANNEL_TOKEN", ""),
    "line_user_id": os.getenv("LINE_USER_ID", ""),
    "fall_threshold": float(os.getenv("FALL_THRESHOLD", "70.0")),
}


class WiCareBridge:
    """ESP32 資料橋接器"""

    def __init__(self, config: dict, mode: str = "http"):
        self.config = config
        self.mode = mode
        self.running = False
        self.db = None
        self.serial_conn = None
        self.gemini_model = None
        self.data_buffer = []  # 最近 N 筆數據用於 AI 分析
        self.buffer_size = 30
        self.last_fall_time = 0
        self.fall_cooldown = 30  # 秒

        self._init_db()
        if config["gemini_api_key"] and HAS_GEMINI:
            self._init_gemini()

    # ============================
    # 資料庫
    # ============================
    def _init_db(self):
        """連接 SQLite 資料庫"""
        db_path = self.config["db_path"]
        db_dir = os.path.dirname(db_path)
        if not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

        self.db = sqlite3.connect(db_path)
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("PRAGMA foreign_keys=ON")

        # 確認 sensor_data 資料表存在
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                movement_score REAL NOT NULL,
                motion_detected INTEGER DEFAULT 0,
                threshold REAL,
                raw_csi TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                elderly_id INTEGER,
                device_id TEXT,
                type TEXT NOT NULL,
                severity TEXT DEFAULT 'info',
                message TEXT,
                ai_analysis TEXT,
                data TEXT DEFAULT '{}',
                is_false_alarm INTEGER DEFAULT 0,
                resolved_at DATETIME,
                resolved_by INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.db.commit()
        print(f"[DB] 已連接: {db_path}")

    def save_sensor_data(self, device_id: str, score: float, motion: bool, threshold: float = None):
        """儲存感測器數據到 SQLite"""
        self.db.execute(
            "INSERT INTO sensor_data (device_id, movement_score, motion_detected, threshold) VALUES (?,?,?,?)",
            (device_id, score, 1 if motion else 0, threshold)
        )
        self.db.commit()

        # 推送到 Node.js 後端
        self._push_to_backend(device_id, score, motion, threshold)

    def _push_to_backend(self, device_id: str, score: float, motion: bool, threshold: float = None):
        """推送數據到 Node.js 後端"""
        if not HAS_REQUESTS:
            return
        try:
            url = f"{self.config['backend_url']}/api/sensor-data/push"
            payload = {
                "device_id": device_id,
                "movement_score": score,
                "motion_detected": motion,
                "threshold": threshold,
            }
            # AI 分析結果 (如果有)
            if self.data_buffer and len(self.data_buffer) >= 10:
                ai = self.analyze_with_ai()
                if ai:
                    payload["ai_analysis"] = ai

            requests.post(url, json=payload, timeout=3)
        except requests.RequestException:
            pass  # 後端可能未啟動，靜默失敗

    # ============================
    # ESP32 資料讀取
    # ============================
    def read_http(self) -> dict | None:
        """HTTP 模式：輪詢 ESP32 /status"""
        if not HAS_REQUESTS:
            print("[ERROR] 需要 requests 套件: pip install requests")
            return None

        url = f"http://{self.config['esp32_ip']}:{self.config['esp32_port']}/status"
        try:
            r = requests.get(url, timeout=3)
            if r.status_code == 200:
                return r.json()
        except requests.RequestException as e:
            print(f"[HTTP] 連線失敗: {e}")
        return None

    def read_serial(self) -> dict | None:
        """Serial 模式：讀取 USB 序列"""
        if not HAS_SERIAL:
            print("[ERROR] 需要 pyserial 套件: pip install pyserial")
            return None

        if not self.serial_conn:
            port = self.config["serial_port"]
            if not port:
                # 自動偵測
                ports = serial.tools.list_ports.comports()
                for p in ports:
                    if "CP210" in (p.description or "") or "CH340" in (p.description or "") or "USB" in (p.description or ""):
                        port = p.device
                        break
                if not port:
                    print("[SERIAL] 找不到 ESP32 序列埠")
                    return None

            try:
                self.serial_conn = serial.Serial(port, self.config["serial_baud"], timeout=2)
                print(f"[SERIAL] 已連接: {port} @ {self.config['serial_baud']} baud")
                time.sleep(2)  # 等待開機
            except serial.SerialException as e:
                print(f"[SERIAL] 連接失敗: {e}")
                return None

        try:
            line = self.serial_conn.readline().decode("utf-8", errors="ignore").strip()
            if not line:
                return None

            # 嘗試解析 ESPectre 輸出格式
            # 格式: [timestamp][espectre:045]: Movement: 0.234 | Motion: ON | Threshold: 1.40
            match = re.search(r"Movement:\s*([\d.]+)", line)
            if match:
                score = float(match.group(1))
                motion = "Motion: ON" in line or "Motion: YES" in line
                threshold_match = re.search(r"Threshold:\s*([\d.]+)", line)
                threshold = float(threshold_match.group(1)) if threshold_match else None
                return {
                    "movement_score": score,
                    "motion_detected": motion,
                    "threshold": threshold,
                    "status": "fall" if motion else "safe",
                    "raw": line,
                }

            # 嘗試解析 JSON 格式
            if line.startswith("{"):
                data = json.loads(line)
                return data

        except (serial.SerialException, json.JSONDecodeError) as e:
            print(f"[SERIAL] 讀取錯誤: {e}")
        return None

    def read_simulation(self) -> dict:
        """模擬模式：產生測試數據"""
        import math
        import random

        t = time.time()
        # 基礎正弦波 + 隨機噪音
        base = math.sin(t * 0.5) * 20 + 30
        noise = random.gauss(0, 5)
        score = max(0, min(100, base + noise))

        # 隨機跌倒事件 (約每 2 分鐘一次)
        is_fall = random.random() < 0.008
        if is_fall:
            score = random.uniform(75, 98)

        return {
            "movement_score": round(score, 2),
            "motion_detected": is_fall,
            "threshold": self.config["fall_threshold"],
            "status": "fall" if is_fall else "safe",
        }

    # ============================
    # Gemini AI 分析
    # ============================
    def _init_gemini(self):
        """初始化 Gemini AI"""
        try:
            genai.configure(api_key=self.config["gemini_api_key"])
            self.gemini_model = genai.GenerativeModel("gemini-2.0-flash")
            print("[AI] Gemini AI 已初始化")
        except Exception as e:
            print(f"[AI] Gemini 初始化失敗: {e}")
            self.gemini_model = None

    def analyze_with_ai(self) -> str | None:
        """使用 Gemini AI 分析最近的感測數據"""
        if not self.gemini_model or len(self.data_buffer) < 10:
            return None

        try:
            scores = [d["movement_score"] for d in self.data_buffer[-20:]]
            motions = sum(1 for d in self.data_buffer[-20:] if d.get("motion_detected"))
            avg = sum(scores) / len(scores)
            mx = max(scores)

            prompt = f"""你是一個 WiFi CSI 感測跌倒偵測 AI 助手。分析以下 movement_score 序列，判斷是否有跌倒風險。
回覆格式：一行簡短結論 + 風險等級 (低/中/高/危險)

資料摘要：
- 最近 {len(scores)} 筆 movement_score: {scores[-10:]}
- 平均值: {avg:.2f}
- 最大值: {mx:.2f}
- 偵測到動作次數: {motions}
- 跌倒閾值: {self.config['fall_threshold']}

請分析："""

            response = self.gemini_model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"[AI] 分析失敗: {e}")
            return None

    # ============================
    # LINE 推播
    # ============================
    def send_line_alert(self, score: float, ai_analysis: str = None):
        """發送 LINE 跌倒警報"""
        if not HAS_REQUESTS or not self.config["line_token"] or not self.config["line_user_id"]:
            return

        now = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
        text = f"🚨 Wi-Care 跌倒警報\n時間: {now}\n感測分數: {score:.1f}\n設備: {self.config['device_id']}"
        if ai_analysis:
            text += f"\nAI 分析: {ai_analysis}"

        try:
            requests.post(
                "https://api.line.me/v2/bot/message/push",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.config['line_token']}",
                },
                json={
                    "to": self.config["line_user_id"],
                    "messages": [{"type": "text", "text": text}],
                },
                timeout=5,
            )
            print("[LINE] ✅ 推播成功")
        except Exception as e:
            print(f"[LINE] ❌ 推播失敗: {e}")

    # ============================
    # 主迴圈
    # ============================
    def run(self):
        """啟動數據收集迴圈"""
        self.running = True
        read_fn = {
            "http": self.read_http,
            "serial": self.read_serial,
            "sim": self.read_simulation,
        }.get(self.mode)

        if not read_fn:
            print(f"[ERROR] 不支援的模式: {self.mode}")
            return

        print(f"\n{'='*50}")
        print(f"  Wi-Care Bridge v1.0")
        print(f"  模式: {self.mode.upper()}")
        print(f"  設備: {self.config['device_id']}")
        if self.mode == "http":
            print(f"  ESP32: {self.config['esp32_ip']}:{self.config['esp32_port']}")
        elif self.mode == "serial":
            print(f"  序列: {self.config['serial_port'] or 'AUTO'}")
        print(f"  輪詢: {self.config['poll_interval']}s")
        print(f"  閾值: {self.config['fall_threshold']}")
        print(f"  AI:   {'✅ Gemini' if self.gemini_model else '❌'}")
        print(f"  LINE: {'✅' if self.config['line_token'] else '❌'}")
        print(f"  DB:   {self.config['db_path']}")
        print(f"{'='*50}\n")

        consecutive_failures = 0

        try:
            while self.running:
                data = read_fn()

                if data is None:
                    consecutive_failures += 1
                    if consecutive_failures > 10 and self.mode != "sim":
                        print(f"[WARN] 連續 {consecutive_failures} 次讀取失敗")
                    time.sleep(self.config["poll_interval"])
                    continue

                consecutive_failures = 0
                score = data.get("movement_score", 0)
                motion = data.get("motion_detected", False)
                threshold = data.get("threshold")

                # 加入緩衝區
                self.data_buffer.append(data)
                if len(self.data_buffer) > self.buffer_size:
                    self.data_buffer.pop(0)

                # 儲存到 SQLite + 推送到後端
                self.save_sensor_data(self.config["device_id"], score, motion, threshold)

                # 狀態輸出
                status = "🔴 FALL" if motion else "🟢 SAFE"
                bar = "█" * int(score / 5) + "░" * (20 - int(score / 5))
                ts = datetime.now().strftime("%H:%M:%S")
                print(f"[{ts}] {status} score={score:6.2f} [{bar}]", end="")

                # 跌倒偵測
                if motion or score > self.config["fall_threshold"]:
                    now = time.time()
                    if now - self.last_fall_time > self.fall_cooldown:
                        self.last_fall_time = now
                        print(" ⚠️  跌倒警報!", end="")

                        # AI 分析
                        ai = self.analyze_with_ai()
                        if ai:
                            print(f"\n  AI: {ai}", end="")

                        # LINE 推播
                        self.send_line_alert(score, ai)

                        # 儲存事件
                        self.db.execute(
                            "INSERT INTO events (device_id,type,severity,message,ai_analysis) VALUES (?,?,?,?,?)",
                            (self.config["device_id"], "fall_alert", "critical",
                             f"跌倒偵測 score={score:.1f}", ai)
                        )
                        self.db.commit()

                print()
                time.sleep(self.config["poll_interval"])

        except KeyboardInterrupt:
            print("\n\n[Bridge] 停止中...")
        finally:
            self.cleanup()

    def cleanup(self):
        """清理資源"""
        self.running = False
        if self.serial_conn:
            self.serial_conn.close()
            print("[SERIAL] 序列埠已關閉")
        if self.db:
            self.db.close()
            print("[DB] 資料庫連線已關閉")


def auto_detect_serial_ports():
    """列出可用序列埠"""
    if not HAS_SERIAL:
        print("需要安裝 pyserial: pip install pyserial")
        return
    ports = serial.tools.list_ports.comports()
    if not ports:
        print("找不到任何序列埠")
        return
    print("可用序列埠:")
    for p in ports:
        print(f"  {p.device} - {p.description} [{p.hwid}]")


def main():
    parser = argparse.ArgumentParser(description="Wi-Care ESP32 Bridge")
    parser.add_argument("--mode", choices=["http", "serial", "sim"], default="http", help="資料讀取模式")
    parser.add_argument("--esp32-ip", default=None, help="ESP32 IP 位址")
    parser.add_argument("--esp32-port", type=int, default=None, help="ESP32 連接埠")
    parser.add_argument("--serial-port", default=None, help="序列埠 (例: COM3, /dev/ttyUSB0)")
    parser.add_argument("--device-id", default=None, help="設備 ID")
    parser.add_argument("--interval", type=float, default=None, help="輪詢間隔 (秒)")
    parser.add_argument("--threshold", type=float, default=None, help="跌倒閾值")
    parser.add_argument("--backend", default=None, help="後端 URL")
    parser.add_argument("--list-ports", action="store_true", help="列出序列埠")
    args = parser.parse_args()

    if args.list_ports:
        auto_detect_serial_ports()
        return

    config = dict(DEFAULT_CONFIG)
    if args.esp32_ip: config["esp32_ip"] = args.esp32_ip
    if args.esp32_port: config["esp32_port"] = args.esp32_port
    if args.serial_port: config["serial_port"] = args.serial_port
    if args.device_id: config["device_id"] = args.device_id
    if args.interval: config["poll_interval"] = args.interval
    if args.threshold: config["fall_threshold"] = args.threshold
    if args.backend: config["backend_url"] = args.backend

    bridge = WiCareBridge(config, mode=args.mode)
    bridge.run()


if __name__ == "__main__":
    main()
