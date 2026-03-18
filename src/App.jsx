import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `あなたはプロのファッションスタイリストAIです。ユーザーがアップロードした服の画像を分析し、以下のタスクを行います。

【通常の服提案モード】
ユーザーの服に合うアイテムを以下のカテゴリで提案してください：
- アウター（コート、ジャケットなど）
- トップス（シャツ、ニット、カットソーなど）
- ボトムス（パンツ、スカートなど）
- アクセサリー（バッグ、靴、帽子、ジュエリーなど）

各アイテムの提案は以下の形式でJSON配列として返してください：
{
  "mode": "items",
  "analysis": "アップロードされた服の分析コメント",
  "items": [
    {
      "category": "アウター",
      "name": "アイテム名",
      "description": "説明",
      "color": "色",
      "price_range": "価格帯",
      "brand_suggestion": "ブランド例",
      "search_url": "https://www.google.com/search?q=検索キーワード+ファッション",
      "rakuten_url": "https://search.rakuten.co.jp/search/mall/検索キーワード/",
      "zozotown_url": "https://zozo.jp/search/?p=検索キーワード",
      "emoji": "絵文字"
    }
  ],
  "style_tip": "総合スタイルアドバイス"
}

【コーディネート提案モード】
ユーザーが「コーディネート提案して」と言った場合は、完全なコーディネートを提案してください：
{
  "mode": "coordinate",
  "theme": "コーデのテーマ",
  "occasion": "シーン・場面",
  "coordinates": [
    {
      "name": "コーデ名",
      "concept": "コンセプト",
      "items": [
        {
          "part": "パーツ名",
          "item": "アイテム名",
          "color": "色",
          "emoji": "絵文字"
        }
      ],
      "total_price": "合計価格帯",
      "search_url": "https://www.google.com/search?q=コーデ全体の検索キーワード"
    }
  ]
}

必ずJSON形式のみで返答してください。マークダウンのコードブロックは使わず、純粋なJSONのみです。`;

function parseAIResponse(text) {
  try {
    // コードブロック除去
    let clean = text.replace(/```json|```/g, "").trim();
    // 最初の{から最後の}までを抽出
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function ItemCard({ item }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "16px",
      padding: "16px",
      marginBottom: "12px",
      backdropFilter: "blur(10px)",
      transition: "all 0.2s ease",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "24px" }}>{item.emoji}</span>
        <div>
          <div style={{
            fontSize: "10px",
            color: "#f0a0c0",
            fontWeight: "700",
            letterSpacing: "2px",
            textTransform: "uppercase",
            fontFamily: "'Courier New', monospace",
          }}>{item.category}</div>
          <div style={{ fontSize: "15px", fontWeight: "600", color: "#fff" }}>{item.name}</div>
        </div>
      </div>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "0 0 8px", lineHeight: "1.5" }}>
        {item.description}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
        <span style={{ background: "rgba(240,160,192,0.2)", color: "#f0a0c0", padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>
          🎨 {item.color}
        </span>
        <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>
          💴 {item.price_range}
        </span>
        <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>
          🏷 {item.brand_suggestion}
        </span>
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <a href={item.search_url} target="_blank" rel="noopener noreferrer" style={{
          background: "linear-gradient(135deg, #f0a0c0, #c060a0)",
          color: "#fff",
          padding: "6px 14px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "700",
          textDecoration: "none",
          letterSpacing: "0.5px",
        }}>Google 検索</a>
        <a href={item.rakuten_url} target="_blank" rel="noopener noreferrer" style={{
          background: "rgba(255,80,80,0.2)",
          color: "#ff8080",
          border: "1px solid rgba(255,80,80,0.3)",
          padding: "6px 14px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "600",
          textDecoration: "none",
        }}>楽天</a>
        <a href={item.zozotown_url} target="_blank" rel="noopener noreferrer" style={{
          background: "rgba(80,180,255,0.2)",
          color: "#80c0ff",
          border: "1px solid rgba(80,180,255,0.3)",
          padding: "6px 14px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "600",
          textDecoration: "none",
        }}>ZOZO</a>
      </div>
    </div>
  );
}

function CoordinateCard({ coord, index }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "20px",
      padding: "20px",
      marginBottom: "16px",
    }}>
      <div style={{ marginBottom: "12px" }}>
        <div style={{
          fontSize: "10px",
          color: "#f0a0c0",
          fontWeight: "700",
          letterSpacing: "2px",
          textTransform: "uppercase",
          fontFamily: "'Courier New', monospace",
          marginBottom: "4px",
        }}>COORDINATE {index + 1}</div>
        <div style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>{coord.name}</div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{coord.concept}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
        {coord.items.map((item, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "10px",
          }}>
            <span style={{ fontSize: "20px" }}>{item.emoji}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "10px", color: "#f0a0c0", fontWeight: "600" }}>{item.part}</span>
              <div style={{ fontSize: "13px", color: "#fff" }}>{item.item}</div>
            </div>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "10px" }}>{item.color}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>💴 合計目安: {coord.total_price}</span>
        <a href={coord.search_url} target="_blank" rel="noopener noreferrer" style={{
          background: "linear-gradient(135deg, #f0a0c0, #c060a0)",
          color: "#fff",
          padding: "7px 16px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "700",
          textDecoration: "none",
        }}>このコーデを探す →</a>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const parsed = !isUser && msg.parsed ? msg.parsed : null;

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "20px",
      animation: "fadeIn 0.3s ease",
    }}>
      {!isUser && (
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f0a0c0, #c060a0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          flexShrink: 0,
          marginRight: "10px",
          marginTop: "4px",
          boxShadow: "0 0 20px rgba(240,160,192,0.4)",
        }}>✨</div>
      )}
      <div style={{ maxWidth: "85%", minWidth: "80px" }}>
        {isUser && msg.image && (
          <div style={{ textAlign: "right", marginBottom: "8px" }}>
            <img src={msg.image} alt="uploaded" style={{
              maxWidth: "200px",
              maxHeight: "200px",
              borderRadius: "12px",
              border: "2px solid rgba(240,160,192,0.3)",
              objectFit: "cover",
            }} />
          </div>
        )}
        {isUser ? (
          <div style={{
            background: "linear-gradient(135deg, rgba(240,160,192,0.25), rgba(192,96,160,0.25))",
            border: "1px solid rgba(240,160,192,0.3)",
            borderRadius: "18px 18px 4px 18px",
            padding: "12px 16px",
            fontSize: "14px",
            color: "#fff",
            lineHeight: "1.5",
          }}>{msg.content}</div>
        ) : parsed ? (
          <div>
            {parsed.mode === "items" && (
              <div>
                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "14px 16px",
                  marginBottom: "12px",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: "1.6",
                }}>
                  <div style={{ fontSize: "11px", color: "#f0a0c0", fontWeight: "700", letterSpacing: "2px", marginBottom: "8px", fontFamily: "monospace" }}>STYLE ANALYSIS</div>
                  {parsed.analysis}
                </div>
                {parsed.items?.map((item, i) => <ItemCard key={i} item={item} />)}
                {parsed.style_tip && (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(240,160,192,0.1), rgba(192,96,160,0.1))",
                    border: "1px solid rgba(240,160,192,0.2)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: "1.6",
                    marginTop: "8px",
                  }}>
                    <div style={{ fontSize: "11px", color: "#f0a0c0", fontWeight: "700", letterSpacing: "2px", marginBottom: "6px", fontFamily: "monospace" }}>💡 STYLE TIP</div>
                    {parsed.style_tip}
                  </div>
                )}
              </div>
            )}
            {parsed.mode === "coordinate" && (
              <div>
                <div style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "14px 16px",
                  marginBottom: "14px",
                }}>
                  <div style={{ fontSize: "11px", color: "#f0a0c0", fontWeight: "700", letterSpacing: "2px", marginBottom: "6px", fontFamily: "monospace" }}>COORDINATE PROPOSAL</div>
                  <div style={{ fontSize: "14px", color: "#fff", fontWeight: "600" }}>{parsed.theme}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>シーン: {parsed.occasion}</div>
                </div>
                {parsed.coordinates?.map((coord, i) => <CoordinateCard key={i} coord={coord} index={i} />)}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "18px 18px 18px 4px",
            padding: "12px 16px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.85)",
            lineHeight: "1.6",
          }}>{msg.content}</div>
        )}
      </div>
    </div>
  );
}

export default function FashionStylistApp() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "welcome",
    parsed: null,
    isWelcome: true,
  }]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const bottomRef = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    const reader = new FileReader();
    reader.onload = (ev) => setImageBase64(ev.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if (!input.trim() && !imageBase64) return;
    const userMsg = {
      role: "user",
      content: input || "この服に合うアイテムを提案して",
      image: image,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const isCoordMode = input.includes("コーディネート提案") || input.includes("コーデ提案") || input.includes("コーデを提案");

    const userContent = [];
    if (imageBase64) {
      userContent.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } });
    }
    userContent.push({
      type: "text",
      text: isCoordMode
        ? `${input || "コーディネートを提案してください"}。JSON形式で返答してください。`
        : `${input || "この服に合うアイテムを提案してください"}。アウター、トップス、ボトムス、アクセサリーをそれぞれ1〜2個提案し、JSON形式で返答してください。`
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || data.text || "error";
      const parsed = parseAIResponse(text);
      setMessages(prev => [...prev, { role: "assistant", content: text, parsed }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "エラーが発生しました。もう一度お試しください。", parsed: null }]);
    }
    setLoading(false);
    setImage(null);
    setImageBase64(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d14",
      backgroundImage: `
        radial-gradient(ellipse at 20% 20%, rgba(240,100,180,0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(100,60,180,0.08) 0%, transparent 50%)
      `,
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(240,160,192,0.3); border-radius: 2px; }
        textarea { resize: none; outline: none; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        backdropFilter: "blur(20px)",
        background: "rgba(13,13,20,0.8)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #f0a0c0, #8040c0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          boxShadow: "0 0 20px rgba(240,160,192,0.3)",
        }}>👗</div>
        <div>
          <div style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#fff",
            letterSpacing: "0.5px",
          }}>STYLE.AI</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>AI FASHION STYLIST</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }}></div>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>オンライン</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 16px",
        maxWidth: "720px",
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}>
        {/* Welcome */}
        <div style={{ textAlign: "center", marginBottom: "32px", animation: "fadeIn 0.6s ease" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>✨</div>
          <div style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "#fff",
            marginBottom: "8px",
            background: "linear-gradient(135deg, #f0a0c0, #c060ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>AIスタイリストへようこそ</div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", lineHeight: "1.7", maxWidth: "320px", margin: "0 auto" }}>
            服の写真をアップロードして送信すると、<br/>
            合うアイテムを提案します。<br/>
            「コーディネート提案して」でコーデ提案も！
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px", flexWrap: "wrap" }}>
            {["📸 写真をアップして提案", "👔 コーディネート提案して", "🛍 春コーデ提案して"].map((tip, i) => (
              <button key={i} onClick={() => setInput(tip.split(" ")[1])} style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.target.style.background = "rgba(240,160,192,0.15)"; e.target.style.color = "#f0a0c0"; }}
              onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.06)"; e.target.style.color = "rgba(255,255,255,0.6)"; }}
              >{tip}</button>
            ))}
          </div>
        </div>

        {messages.filter(m => !m.isWelcome).map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", animation: "fadeIn 0.3s ease" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "linear-gradient(135deg, #f0a0c0, #c060a0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", flexShrink: 0,
            }}>✨</div>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "18px 18px 18px 4px",
              padding: "14px 20px",
              display: "flex", gap: "6px", alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: "#f0a0c0",
                  animation: `pulse 1.2s ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(13,13,20,0.9)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          {image && (
            <div style={{ marginBottom: "10px", position: "relative", display: "inline-block" }}>
              <img src={image} alt="preview" style={{
                height: "72px", width: "72px", objectFit: "cover",
                borderRadius: "12px", border: "2px solid rgba(240,160,192,0.4)",
              }} />
              <button onClick={() => { setImage(null); setImageBase64(null); if (fileRef.current) fileRef.current.value = ""; }}
                style={{
                  position: "absolute", top: "-6px", right: "-6px",
                  background: "#c060a0", border: "none", borderRadius: "50%",
                  width: "20px", height: "20px", color: "#fff", fontSize: "12px",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>×</button>
            </div>
          )}
          <div style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-end",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "20px",
            padding: "10px 12px",
          }}>
            <input type="file" accept="image/*" ref={fileRef} onChange={handleImageChange} style={{ display: "none" }} />
            <button onClick={() => fileRef.current?.click()} style={{
              background: "none", border: "none", cursor: "pointer",
              color: image ? "#f0a0c0" : "rgba(255,255,255,0.35)",
              fontSize: "22px", padding: "0", lineHeight: 1, flexShrink: 0,
              transition: "color 0.2s",
            }}>📷</button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力... (例: この服に合うものは？)"
              rows={1}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "14px",
                lineHeight: "1.5",
                maxHeight: "120px",
                overflowY: "auto",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !imageBase64)}
              style={{
                background: loading || (!input.trim() && !imageBase64)
                  ? "rgba(255,255,255,0.08)"
                  : "linear-gradient(135deg, #f0a0c0, #c060a0)",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: loading || (!input.trim() && !imageBase64) ? "not-allowed" : "pointer",
                flexShrink: 0,
                transition: "all 0.2s",
                boxShadow: loading || (!input.trim() && !imageBase64) ? "none" : "0 0 16px rgba(240,160,192,0.4)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: "8px", fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.5px" }}>
            Powered by Claude AI · Enter で送信 · Shift+Enter で改行
          </div>
        </div>
      </div>
    </div>
  );
}
