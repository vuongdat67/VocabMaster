# Luồng Học

## 1. Setup

Chọn word pack → `startSession` → load words → create engine

## 2. List Phase

Hiển thị grid tất cả từ. User xem qua, click "Bắt đầu học ngay" → `beginLearning` → `engine.startLearning`

## 3. Flashcard Phase

Mỗi từ mới gặp lần đầu → **flashcard tự đánh giá**:

- User lật thẻ, chọn **"Đã nhớ"** hoặc **"Chưa nhớ"**
- Nếu "Chưa nhớ": từ vẫn ở queue ưu tiên cao
- **Bắt buộc** phải qua các mode khác dù chọn gì

## 4. Random Mode Loop

Sau flashcard, engine chọn ngẫu nhiên 1 trong 7 modes với bias:

| Mode | Mô tả | Test type |
|------|-------|-----------|
| `flashcard` | Tự đánh giá | Self-assessment |
| `audio_challenge` | Nghe → chọn đáp án | Multiple choice |
| `text_challenge` | Xem từ → chọn nghĩa | Multiple choice |
| `typing_challenge` | Nghe/ảnh → gõ từ | Input |
| `fill_blank` | Điền từ khuyết | Input |
| `matching` | Nối từ ↔ ảnh | Matching |
| `synonym_match` | Nối từ đồng nghĩa | Matching |

### Mode selection bias:
- Mode chưa thử → ưu tiên cao
- Mode từng sai → weight 0.3
- Mode vừa làm → weight 0.2
- `audio_challenge` + `typing_challenge` bắt buộc phải thử ít nhất 1 lần

## 5. SRS Priority

Mỗi `LearningWord` có `priority` (cao hơn = xuất hiện sớm hơn):

| Tình huống | Priority delta |
|-----------|---------------|
| ✅ Đúng + nhanh (<3s) | **-30** (giảm — biết rồi) |
| ✅ Đúng + vừa | **-10** |
| ✅ Đúng + chậm (>8s) | **+10** (tăng — còn lưỡng lự) |
| ❌ Sai + nhanh | **+50** (tăng mạnh — đoán mò) |
| ❌ Sai + chậm | **+30** |
| ❌ Sai + gần đúng | **+15** |
| `correctStreak >= 3` | **→ Review pool** (tạm vững) |

## 6. Interleaving

Sau mỗi **3 câu trả lời**, engine tự động inject 1 từ mới từ `newWords` vào queue để pha loãng trí nhớ ngắn hạn.

## 7. Three Queues

```
newWords ──► learningWords ──► reviewWords
(unseen)     (active SRS)      (mastered)
```

- `newWords`: words chưa học → inject qua interleave
- `learningWords`: words đang active rotation → priority-based
- `reviewWords`: words đã vững (correctStreak >= 3) → không còn active

## 8. End Session

Khi engine hết queue → tự động `endSession()` → persist SRS + session vào IndexedDB.
