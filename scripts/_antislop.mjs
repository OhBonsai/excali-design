/**
 * _antislop.mjs · 反 slop 的确定性检测(给 html-to-excalidraw 和 arch-lint 共用)
 *
 * 「Unicode/emoji 字符冒充图标」是模型最爱犯的 slop —— 光在文档里写"别这么做"挡不住,
 * 这里把它变成**代码门**:检测命中 → 工具失败 / lint 报 error。靠结构,不靠自觉。
 *
 * 命中范围(刻意只圈"图标向"字符,不碰正文标点/CJK/数学算子 ∑∫∂≤≥∈):
 *   - 箭头  U+2190–U+21FF (→ ← ↑ ↓ ⇒ …)
 *   - 几何形 U+25A0–U+25FF (■ □ ● ○ ◆ ◇ ▲ ▼ …)
 *   - 杂项符号 U+2600–U+26FF (★ ☆ ☀ ⚙ ⚠ ☑ …)
 *   - Dingbats U+2700–U+27BF (✓ ✔ ✗ ✘ ✦ ➜ …)
 *   - 杂项符号与箭头 U+2B00–U+2BFF (⬆ ⭐ …)
 *   - Emoji U+1F000–U+1FAFF
 */
export const ICONGLYPH = /[←-⇿■-◿☀-⛿✀-➿⬀-⯿]|[\u{1F000}-\u{1FAFF}]/u;

// 返回字符串里命中的图标字符(去重)
export function iconCharsIn(text) {
  const hits = new Set();
  for (const ch of String(text || '')) if (ICONGLYPH.test(ch)) hits.add(ch);
  return [...hits];
}

// 扫一组「文字」(可以是 {text} 节点或 excalidraw text 元素),返回命中项 [{text, chars}]
export function scanIconText(items) {
  const out = [];
  for (const it of items) {
    const t = it.text ?? it;
    const chars = iconCharsIn(t);
    if (chars.length) out.push({ text: String(t), chars, ref: it });
  }
  return out;
}

export const FIX_HINT =
  '🛑 别拿 Unicode/emoji 当图标 → 有图标集/drawlib 用 data-lib;没有用 data-icon="square|circle|diamond"(手绘纯色小形状)。文字里只留真正的文案。';
