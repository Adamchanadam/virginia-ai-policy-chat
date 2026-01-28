import React, { useMemo, useState } from 'react';
import { X, Copy, Check, CornerDownLeft } from 'lucide-react';

type PromptTemplate = {
  id: string;
  title: string;
  description: string;
  content: string;
};

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
}

const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  const templates = useMemo<PromptTemplate[]>(
    () => [
      {
        id: 'translate_hk_verbatim',
        title: '逐字翻譯（繁體中文・香港）',
        description: '適合將整份文件高保真翻譯成繁體中文（香港）。如文件很長，會以分段方式輸出。',
        content: `【請先填】
- 文件檔名：<any_file.pdf>

將文檔中全部內容，逐字轉為繁體中文（香港）。
先讀 PDF 全文頁數。
如受輸出長度限制，請按「每次 5-10 頁」分段輸出，並在每段結尾停下，等待我回覆「繼續」後再輸出下一段。

你是一位專精於法律與商業文件的「高保真翻譯員」。

任務目標：
- 將用戶提供的文件內容完整翻譯成【目標語言：繁體中文（香港）】。
- 核心要求是「逐字精確 (Verbatim Accuracy)」與「數據完整性 (Data Integrity)」。

執行協議 (由高至低優先級)：

1. 【數據鎖定協議 (Data Locking Protocol)】
   - 文檔中的所有「非自然語言數據」視為不可變更的錨點。
   - 包含：金額、日期、保單編號、電話、地址門牌、條款代碼 (e.g., LMA5411)。
   - 指令：這類數據必須從原文直接複製 (Copy-Paste)，嚴禁手動輸入或四捨五入。

2. 【嚴格翻譯規則】
   - 嚴禁編造：絕對不可補完缺失內容；不可加入原文沒有的資訊。
   - 嚴禁遺漏：必須翻譯每一頁的所有可見文字，包括頁眉、頁腳、小字條款及備註。
   - 格式保留：
     - 保留段落結構、標題層級、編號 (1., 1.1, a, b...)。
     - 表格以 Markdown Table 格式呈現，保持行列對應。
   - 專有名詞：公司名、人名、產品名首次出現使用「原文 (中文翻譯)」，其後可使用中文。

3. 【自我驗收與校對機制 (Self-Correction Mechanism)】
   在生成每一個區塊後，必須在內部回溯核對：
   - 檢查點 A：原文的每一個數字是否都準確出現在譯文中？
   - 檢查點 B：是否有漏掉任何一行的翻譯？
   - 檢查點 C：是否錯誤地將不同頁面的內容混合？
   - 檢查點 D：是否文檔內每一頁都完成處理？
   - 若發現錯誤，必須立即修正後才輸出。

4. 【可追溯輸出格式】
   - 每一段或每一頁翻譯前，必須標示來源標籤。
     - 格式範例：> [來源：Page 1 - Section: Debit Note]

5. 【結尾聲明】
   - 文末正文結束前必須標明：
     「如本中譯本與英文原文有任何歧異，概以原始英文保單條款為準。」

請開始執行翻譯。`,
      },
      {
        id: 'quote_and_explain',
        title: '條款逐字引用 + 解釋',
        description: '問保障、除外責任、理賠條件、名詞定義等最常用。',
        content: `【請先填】
- 問題：<在此輸入你的問題>

請根據我已上傳的文件回答。

要求：
1) 如涉及保險責任／除外責任／理賠條件／名詞定義，必須以 Markdown blockquote 逐字引用原文。
2) 引用後請用清晰條列解釋（不可加入文件以外資料）。
3) 回覆末尾必須輸出：
---SOURCES---
並列出「文件完整名稱 > 頁數/章節/標題」。`,
      },
      {
        id: 'policy_compare',
        title: '保單 A vs 保單 B 對照分析（從業員常用）',
        description: '用於客人問「保單 A 同保單 B 有咩分別」：以可追溯引用做對照表，指出差異與風險位。',
        content: `【請先填】
- 保單 A（檔名或計劃名稱）：<填入>
- 保單 B（檔名或計劃名稱）：<填入>
- 客戶背景（可選）：
  - 受保人年齡/職業：<可留空>
  - 保障重點：<可留空>

請根據我已上傳的文件內容，為「保單 A」與「保單 B」做對照分析。

前置要求：
1) 我會上傳兩份文件（或同一份文件內有兩個計劃/產品）。你必須先判斷並在開首清晰標示「保單 A」與「保單 B」分別對應哪份文件/計劃。
2) 如你無法從文件中確認 A/B 對應關係，請先提出澄清問題，不要猜。
3) 只可依據文件內容回答；找不到依據就必須寫「文件未提供/找不到」(N/A)，不得補充外部知識。

對照範圍（如未指定，請至少覆蓋以下 8 項）：
1) 核心保障/保障範圍
2) 主要除外責任
3) 等候期／冷靜期／生效條件
4) 免責額／自付額／共同保險（如適用）
5) 保額上限／每年上限／終身上限
6) 續保/保證續保條款（如有）
7) 理賠所需文件／程序／時限
8) 重要定義（例如：住院、意外、疾病、手術等）

輸出格式：
A) 先用一個 Markdown Table 做總覽對照：
   - 欄位：項目 | 保單 A | 保單 B | 主要差異（用一句話）
   - 如任何一格需要引用條款，請在表格下面逐項補上「逐字引用」原文段落。

B) 逐項詳解（每項都要可追溯引用）：
   - 對每個項目：
     1) 逐字引用保單 A 原文（如文件有）
     2) 逐字引用保單 B 原文（如文件有）
     3) 用條列解釋差異（不可超出文件）

C) 風險提示（只限文件可支持者）：
   - 列出 3-5 個最可能令客戶誤解/投訴/拒賠風險的條款差異點。

最後請輸出：
---SOURCES---
並列出本次引用到的「文件完整名稱 > 頁數/章節/標題」。`,
      },
      {
        id: 'verify_claim',
        title: '核對一句說法（只可引用原文）',
        description: '用來檢查某一句說法係咪真係寫喺條款入面，防止誤解。',
        content: `【請先填】
- 待核對說法：
「<在此貼上要核對的一句說法>」

請核對以上說法是否能在我上傳的文件中找到原文依據。

規則：
- 如果文件中找不到逐字依據，請直接拒答，並說明「找不到相關原文」。
- 如果找得到，請用 Markdown blockquote 逐字引用原文，並簡短指出該段原文如何支持/不支持該說法。
- 回覆末尾輸出：
---SOURCES---
每行格式：文件完整名稱 > 頁數/章節/標題`,
      },
      {
        id: 'structured_summary',
        title: '可追溯摘要（每段都要來源）',
        description: '想快速掌握某部分內容，但仍要可追溯到原文。',
        content: `【請先填】
- 主題：<主題>

請根據我上傳的文件，為以上主題做摘要。

輸出格式要求：
- 以 5-10 點條列摘要。
- 每一點摘要後面都要標示引用來源（同一行末尾），格式：文件完整名稱 > 頁數/章節/標題。
- 回覆最後仍要再輸出：
---SOURCES---
並列出本次用到的所有來源（去重即可）。`,
      },
    ],
    []
  );

  const handleCopy = async (content: string, templateId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedTemplateId(templateId);
      setTimeout(() => setCopiedTemplateId(null), 2000);
    } catch {
      setCopiedTemplateId(null);
    }
  };

  const handleInsert = (content: string) => {
    onInsert(content);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-white">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">常用 Prompt 範本</h3>
            <p className="text-sm text-gray-500 mt-0.5">一鍵複製或填入輸入框（不會自動送出）</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          <div className="space-y-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-bold text-gray-900">{tpl.title}</div>
                      <div className="text-sm text-gray-500 mt-1">{tpl.description}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(tpl.content, tpl.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                        title="複製到剪貼簿"
                      >
                        {copiedTemplateId === tpl.id ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            已複製
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            複製
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleInsert(tpl.content)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                        title="填入輸入框"
                      >
                        <CornerDownLeft className="w-4 h-4" />
                        填入
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-[320px] overflow-auto">
                    {tpl.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-white text-sm text-gray-500">
          小提示：如模板包含 <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded border border-gray-200 font-mono">&lt;any_file.pdf&gt;</code>，請自行替換為左側已上傳文件的檔名。
        </div>
      </div>
    </div>
  );
};

export default PromptLibraryModal;
