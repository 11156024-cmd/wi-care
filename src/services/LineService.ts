/**
 * Wi-Care LINE 訊息服務
 */

// 照護人員資料介面 (本地定義，避免循環導入)
interface CaregiverProfile {
  name: string;
  phone: string;
  relationship?: string;
  lineChannelToken?: string;
  lineUserId?: string;
}

class LineService {
  private readonly API_URL = 'https://api.line.me/v2/bot/message/push';
  
  // 注意：LINE Messaging API 同樣不允許瀏覽器跨域呼叫 (CORS)。
  // 以下程式碼包含 "模擬模式" (前端 Demo 用) 與 "真實模式" (後端用)。
  
  public async sendFallAlert(imageUrl?: string): Promise<boolean> {
    const profileStr = localStorage.getItem('caregiver_profile');
    if (!profileStr) return false;

    const profile: CaregiverProfile = JSON.parse(profileStr);
    
    // Check for Messaging API credentials
    if (!profile.lineChannelToken || !profile.lineUserId) {
      console.warn('LineService: Missing Channel Token or User ID.');
      return false;
    }

    const location = localStorage.getItem('device_setup_config') 
      ? JSON.parse(localStorage.getItem('device_setup_config')!).location 
      : '未知位置';

    const timestamp = new Date().toLocaleString('zh-TW', { hour12: false });

    // Construct Flex Message
    const flexMessage = {
      type: "flex",
      altText: "【緊急警報】偵測到跌倒事件！",
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#ef4444",
          contents: [
            {
              type: "text",
              text: "緊急警報 (EMERGENCY)",
              weight: "bold",
              color: "#ffffff",
              size: "sm"
            },
            {
              type: "text",
              text: "偵測到跌倒事件",
              weight: "bold",
              color: "#ffffff",
              size: "xl",
              margin: "md"
            }
          ]
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "位置",
                      color: "#aaaaaa",
                      size: "sm",
                      flex: 1
                    },
                    {
                      type: "text",
                      text: location,
                      wrap: true,
                      color: "#666666",
                      size: "sm",
                      flex: 4
                    }
                  ]
                },
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "時間",
                      color: "#aaaaaa",
                      size: "sm",
                      flex: 1
                    },
                    {
                      type: "text",
                      text: timestamp,
                      wrap: true,
                      color: "#666666",
                      size: "sm",
                      flex: 4
                    }
                  ]
                }
              ]
            }
          ]
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              height: "sm",
              action: {
                type: "uri",
                label: "撥打緊急電話",
                uri: `tel:${profile.phone}`
              },
              color: "#ef4444"
            },
            {
              type: "button",
              style: "secondary",
              height: "sm",
              action: {
                type: "uri",
                label: "開啟監控畫面",
                uri: "https://wi-care-dashboard.example.com"
              }
            }
          ]
        }
      }
    };

    return this.sendPushMessage(profile.lineChannelToken, profile.lineUserId, [flexMessage]);
  }

  public async sendTestMessage(token: string, userId: string): Promise<boolean> {
    const textMessage = {
      type: "text",
      text: "【Wi-Care 系統連線測試】\n您的 Line Bot 設定正確！系統已準備好發送緊急通知。"
    };
    return this.sendPushMessage(token, userId, [textMessage]);
  }

  private async sendPushMessage(token: string, userId: string, messages: any[]): Promise<boolean> {
    console.log(`[LineService] Preparing to PUSH to User: ${userId}`);
    console.log(`[LineService] Payload:`, messages);

    const body = JSON.stringify({
      to: userId,
      messages: messages
    });

    try {
      // --- 真實後端程式碼 (Backend Code) ---
      // 在您的 Node.js / Python 後端伺服器中，您會這樣呼叫：
      /*
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body
      });
      
      if (!response.ok) {
        const err = await response.json();
        console.error('Line API Error:', err);
        return false;
      }
      return true;
      */

      // --- 前端模擬 (Frontend Simulation) ---
      // 因為瀏覽器有 CORS 限制，我們這裡只模擬發送成功
      await new Promise(resolve => setTimeout(resolve, 800)); 
      
      console.group('%c[LINE Bot Mock]', 'color: #00b900; background: #222; padding: 4px; border-radius: 4px;');
      console.log('Status: 200 OK (Simulated)');
      console.log('To:', userId);
      console.log('Messages:', messages);
      console.groupEnd();

      return true;

    } catch (error) {
      console.error('Failed to send LINE message:', error);
      return false;
    }
  }
}

export const lineService = new LineService();
