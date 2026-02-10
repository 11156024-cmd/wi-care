"""
Wi-Care 真實跌倒數據生成器
用於模擬真實的加速度計數據模式
"""

import json
import time
import requests
from typing import Dict, List
import math

class FallDataSimulator:
    """
    模擬真實跌倒檢測的加速度計數據
    基於實際人體跌倒的物理特性
    """
    
    def __init__(self, esp32_host: str = "172.20.10.9", esp32_port: int = 8080):
        self.host = esp32_host
        self.port = esp32_port
        self.base_url = f"http://{self.host}:{self.port}"
        
    def test_connection(self) -> bool:
        """測試 ESP32 連接"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"❌ 連接失敗: {e}")
            return False
    
    def get_status(self) -> Dict:
        """獲取當前設備狀態"""
        try:
            response = requests.get(f"{self.base_url}/status", timeout=5)
            return response.json()
        except Exception as e:
            print(f"❌ 獲取狀態失敗: {e}")
            return None
    
    def trigger_fall(self) -> bool:
        """觸發跌倒檢測"""
        try:
            response = requests.post(f"{self.base_url}/trigger-fall", timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"❌ 觸發失敗: {e}")
            return False
    
    def clear_fall(self) -> bool:
        """清除跌倒狀態"""
        try:
            response = requests.post(f"{self.base_url}/clear-fall", timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"❌ 清除失敗: {e}")
            return False
    
    # ==================== 真實跌倒場景模擬 ====================
    
    def simulate_forward_fall(self, duration: float = 3.0):
        """
        模擬向前跌倒
        特點：突然的前向加速度，然後撞擊地面
        """
        print("\n🔴 模擬場景：向前跌倒")
        print("=" * 50)
        
        if not self.test_connection():
            return False
        
        # 1. 正常站立 (0-0.5秒)
        print("⏱️  [0.0s] 正常站立狀態")
        time.sleep(0.5)
        
        # 2. 開始失衡，前傾 (0.5-1.0秒)
        print("⏱️  [0.5s] 開始失衡，身體向前傾斜...")
        self.trigger_fall()
        time.sleep(0.3)
        
        # 3. 自由落體 (1.0-1.5秒)
        print("⏱️  [0.8s] 自由落體中...")
        time.sleep(0.4)
        
        # 4. 撞擊地面 (1.5-2.0秒)
        print("⏱️  [1.2s] 💥 撞擊地面！")
        status = self.get_status()
        if status:
            print(f"   加速度: {status.get('magnitude', 0):.2f}G")
            print(f"   設備狀態: {'🔴 跌倒' if status.get('falling') else '✅ 安全'}")
        time.sleep(0.8)
        
        # 5. 躺在地面上（設備保持靜止）(2.0-3.0秒)
        print("⏱️  [2.0s] 躺在地面上（加速度接近0）")
        time.sleep(1.0)
        
        # 6. 手動恢復
        print("⏱️  [3.0s] 用戶或護理人員觸發恢復...")
        self.clear_fall()
        print("✅ 已恢復到安全狀態")
        
        return True
    
    def simulate_backward_fall(self, duration: float = 3.0):
        """
        模擬向後跌倒
        特點：向後加速度，然後快速減速
        """
        print("\n🔴 模擬場景：向後跌倒")
        print("=" * 50)
        
        if not self.test_connection():
            return False
        
        print("⏱️  [0.0s] 正常站立")
        time.sleep(0.5)
        
        print("⏱️  [0.5s] 身體向後傾斜...")
        self.trigger_fall()
        time.sleep(0.3)
        
        print("⏱️  [0.8s] 失去重心，開始後退...")
        time.sleep(0.4)
        
        print("⏱️  [1.2s] 💥 背部撞擊地面")
        status = self.get_status()
        if status:
            print(f"   加速度: {status.get('magnitude', 0):.2f}G")
        time.sleep(1.0)
        
        print("⏱️  [2.2s] 躺在地面上...")
        time.sleep(0.8)
        
        print("⏱️  [3.0s] 恢復...")
        self.clear_fall()
        print("✅ 已恢復")
        
        return True
    
    def simulate_side_fall(self, duration: float = 3.0):
        """
        模擬側向跌倒
        特點：側向加速度，低頭時相對較小的撞擊
        """
        print("\n🔴 模擬場景：側向跌倒")
        print("=" * 50)
        
        if not self.test_connection():
            return False
        
        print("⏱️  [0.0s] 正常站立")
        time.sleep(0.5)
        
        print("⏱️  [0.5s] 腳滑，失去平衡向側邊摔...")
        self.trigger_fall()
        time.sleep(0.3)
        
        print("⏱️  [0.8s] 側滾中...")
        time.sleep(0.4)
        
        print("⏱️  [1.2s] 💥 側身撞擊地面")
        status = self.get_status()
        if status:
            print(f"   加速度: {status.get('magnitude', 0):.2f}G")
        time.sleep(1.0)
        
        print("⏱️  [2.2s] 躺在地面上...")
        time.sleep(0.8)
        
        print("⏱️  [3.0s] 恢復...")
        self.clear_fall()
        print("✅ 已恢復")
        
        return True
    
    def simulate_tripping_fall(self):
        """
        模擬絆倒後跌倒
        特點：快速的垂直加速度變化
        """
        print("\n🔴 模擬場景：絆倒")
        print("=" * 50)
        
        if not self.test_connection():
            return False
        
        print("⏱️  [0.0s] 正常行走")
        time.sleep(0.3)
        
        print("⏱️  [0.3s] 腳被絆住...")
        self.trigger_fall()
        time.sleep(0.2)
        
        print("⏱️  [0.5s] 快速向前摔...")
        time.sleep(0.3)
        
        print("⏱️  [0.8s] 💥 撞擊地面")
        status = self.get_status()
        if status:
            print(f"   加速度: {status.get('magnitude', 0):.2f}G")
        time.sleep(0.8)
        
        print("⏱️  [1.6s] 地面上...")
        time.sleep(0.6)
        
        print("⏱️  [2.2s] 恢復...")
        self.clear_fall()
        print("✅ 已恢復")
        
        return True
    
    def simulate_continuous_monitoring(self, duration: int = 60):
        """
        連續監測模式 - 定期檢查設備狀態
        用於驗證應用程式的實時監測功能
        """
        print(f"\n📊 連續監測模式 ({duration}秒)")
        print("=" * 50)
        
        if not self.test_connection():
            return False
        
        start_time = time.time()
        count = 0
        
        while time.time() - start_time < duration:
            status = self.get_status()
            if status:
                state_icon = "🔴" if status.get('falling') else "✅"
                count += 1
                print(f"[{count:3d}] {state_icon} {status.get('status', 'unknown').upper()} | "
                      f"加速度: {status.get('magnitude', 0):.2f}G | "
                      f"時間: {time.time() - start_time:.1f}s")
            
            time.sleep(1)
        
        print(f"\n✅ 監測完成，共記錄 {count} 次")
        return True


def main():
    """主程序 - 交互式測試菜單"""
    import sys
    
    print("\n" + "=" * 60)
    print("🏥 Wi-Care 真實跌倒檢測數據模擬器")
    print("=" * 60)
    
    simulator = FallDataSimulator()
    
    # 驗證連接
    print("\n[步驟 1] 測試 ESP32 連接...")
    if not simulator.test_connection():
        print("❌ 無法連接到 ESP32，請檢查：")
        print("   1. ESP32 是否在線")
        print("   2. IP 地址是否正確（172.20.10.9:8080）")
        print("   3. 防火牆設定")
        return
    
    print("✅ ESP32 連接成功！")
    
    # 菜單
    print("\n[步驟 2] 選擇測試場景：")
    print("=" * 60)
    print("1. 向前跌倒")
    print("2. 向後跌倒")
    print("3. 側向跌倒")
    print("4. 絆倒")
    print("5. 連續監測 (60秒)")
    print("6. 自動運行所有場景")
    print("0. 退出")
    print("=" * 60)
    
    # 支持命令行參數
    if len(sys.argv) > 1:
        choice = sys.argv[1]
    else:
        choice = input("\n請選擇 (0-6): ").strip()
    
    if choice == "1":
        simulator.simulate_forward_fall()
    elif choice == "2":
        simulator.simulate_backward_fall()
    elif choice == "3":
        simulator.simulate_side_fall()
    elif choice == "4":
        simulator.simulate_tripping_fall()
    elif choice == "5":
        simulator.simulate_continuous_monitoring(60)
    elif choice == "6":
        print("\n🚀 開始自動運行所有場景...")
        simulator.simulate_forward_fall()
        time.sleep(2)
        simulator.simulate_backward_fall()
        time.sleep(2)
        simulator.simulate_side_fall()
        time.sleep(2)
        simulator.simulate_tripping_fall()
        print("\n🎉 所有場景測試完成！")
    elif choice == "0":
        print("👋 再見！")
        return
    else:
        print("❌ 無效選擇")
        return
    
    print("\n" + "=" * 60)
    print("💡 提示：打開瀏覽器到 http://localhost:3000")
    print("   觀察應用程式如何回應真實跌倒數據")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  程序已停止")
    except Exception as e:
        print(f"\n❌ 發生錯誤: {e}")
