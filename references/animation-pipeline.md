# 绘图刷新动画 Pipeline(核心新能力)

> **「绘图刷新」= 把动画拆成一串「帧」,每帧是一组完整 Excalidraw 元素,反复调 `create_view` 逐帧刷新播放。**
> create_view 自带「元素逐个 draw-on」入场,所以每次刷新本身有手绘生长感;帧间差异 = 运动。

## 心智模型

```
animation = frames: Element[][]          // 帧数组,每帧一组元素
play(A)   = for f in frames: create_view(f); wait(holdMs)   // 视图内刷新
export(B) = render each frame → PNG → ffmpeg → MP4/GIF
```

一段动画就是「一叠透明纸,一张张翻」。每张纸(帧)是那一刻画布上**全部**该显示的元素。

## 帧 JSON schema(落盘约定)

帧序列存 `_frames/<动画名>/`:

```
_frames/order-flow/
  meta.json            # { name, fps, holdMs, width, height, frameCount, bgm?, sfx? }
  frame-001.json       # Element[] —— 这一帧的全部元素
  frame-002.json
  ...
```

`meta.json` 示例:
```json
{
  "name": "order-flow",
  "fps": 30,
  "holdMs": 900,
  "width": 1920, "height": 1080,
  "frameCount": 12,
  "bgm": "educational",
  "sfx": [ { "frame": 3, "cue": "transition/whoosh" }, { "frame": 12, "cue": "impact/logo-reveal" } ]
}
```

- `holdMs`:路径 A 每帧停留毫秒(视图内播放节奏)
- `fps`:路径 B 导出帧率(插值帧才需要高 fps)

## 三种帧生成方式

### 1. 累加式 reveal(最常用)

帧 N = 帧 N-1 + 新增元素。图一块块长出来——讲架构/流程的默认形态。

**reveal 顺序设计(关键)**:不是随便加,要按**叙事**加:
- 架构图:先画**边界/分层背景** → 再画**入口节点** → 沿数据流方向逐个点亮节点 → 最后连线收束
- 流程图:按用户走的**先后顺序**逐屏/逐步出现
- 原则:观众的眼睛跟着新出现的元素走,所以**新元素的出现顺序 = 你想讲的顺序**

```
frame-001: [背景分层框]
frame-002: + [client 节点]
frame-003: + [client→gateway 箭头, gateway 节点]
frame-004: + [gateway→service 箭头, service 节点]
...
frame-0NN: + [全部连线高亮 + 标题]
```

### 2. 替换式 state change

帧间替换某些元素属性(颜色/位置/文字),做高亮、聚焦、状态切换。元素 **id 和 seed 保持不变**(否则手绘形状会跳变),只改要变的属性。

```
frame-k:   service 框 strokeColor #1e1e1e (常态)
frame-k+1: service 框 strokeColor #e03131 (告警高亮) + 旁边加一个「⚠ timeout」text
frame-k+2: 恢复 #1e1e1e + text 移除
```

用途:架构图里「请求打到哪个节点就高亮哪个」、原型里「点击按钮→按下态→弹 Modal」。

### 3. 插值式 tween(仅导出动画需要)

在两个 keyframe 之间按 easing 插值生成中间帧——平滑运动(节点滑入、淡入、缩放强调)。视图内播放(路径 A)一般**不用** tween(靠 create_view 自带 draw-on 就够);**导出视频(路径 B)**要顺滑才插。

插值规则借 `animation-best-practices.md`:
- 主 easing **expoOut**(`1 - 2^(-10t)`):迅速启动缓慢刹车,给元素物理重量感
- 强调/弹出用 overshoot
- 节奏 **Slow-Fast-Boom-Stop**:开头慢(给反应时间)、中间快(展示密度)、高潮 boom、结尾 hold 不淡出
- 关键信息出现前停 ≥300ms(礼让观众)

被插值的属性:`x` `y` `opacity` `width` `height` `angle`。**`seed` 不插**(保持手绘形状稳定)。

## 两条播放路径

### 路径 A · 视图内刷新播放(默认 / 轻量)

按帧顺序对每帧调 `create_view(frameElements)`,帧间等 `holdMs`。靠 create_view 的 draw-on 动画 + 帧间停顿做出逐帧效果。无需任何外部依赖。

适合:现场讲解、快速预览、给用户演示流程。
代价:节奏受 create_view 渲染时间影响,不如导出视频精确;不可分发成文件。

### 路径 B · 导出 MP4/GIF(可分发)

```
1. 生成帧序列 _frames/<name>/frame-*.json (+ meta.json)
2. node scripts/render-frames.mjs --frames _frames/<name> --out _frames/<name>/png
       → 每帧用无头 Excalidraw 渲染成 PNG(frame-001.png ...)
3. node scripts/frames-to-video.mjs _frames/<name>/png --fps 30 --out order-flow.mp4
       → ffmpeg 合成 MP4(+ 可选 palette 优化 GIF)
4. (可选) node scripts/add-music.mjs order-flow.mp4 --mood=educational
       → 加 BGM;SFX 按 meta.sfx 的 cue 表混入(见 audio-design-rules.md)
```

适合:发公众号/X/B站、产品演示视频。
依赖:Node + Playwright + chromium(render-frames 从 CDN import excalidraw,无需 npm 装 excalidraw);ffmpeg(frames-to-video / add-music)。缺依赖就只走路径 A。

#### ✅ 已实测要点(render-frames.mjs / frames-to-video.mjs 已跑通)

- **esm.sh 导出在 `.default` 上**:`@excalidraw/excalidraw` 经 esm.sh 包装后,`exportToBlob` 等挂在 `(await import(cdn)).default`,不是具名导出。render-frames 已处理。
- **anchor 固定尺寸(防抖关键)**:每帧注入一个 `0,0,w,h` 的透明矩形,让 bbox 跨帧恒定 → 所有 PNG 同尺寸、坐标系一致。**实测:Client 框在第 1 帧和第 3 帧位置完全相同,无抖动。** 这是导出动画不跳的根本。
- **`--hold` = 每帧停留秒数**(不是帧数)。`frames-to-video.mjs --hold 0.9` → 每帧 0.9s。实测 3 帧 ×0.9s = 2.7s ✓。
- **字体坑(待补)**:默认渲染用浏览器衬线 fallback,**不是 Excalidraw 手绘体 Virgil**。文字会偏「正式」而非「手绘」。要真手绘体,需在 render-frames 的 page HTML 里 `@font-face` 加载 Virgil(fontFamily:1)/ Cascadia(3)。非手绘场景(正式架构图)可接受 fallback。
- **沙箱/CI**:可用 `playwright-core` + 设 `EXCALI_CHROMIUM=<chrome 路径>` 跑;`EXCALI_CDN` 可换 CDN/版本。

## 设计动画前先答 3 问(铁律)

1. **hero 元素是谁?**——主角(一个节点 / 一条数据流 / 一个用户路径),贯穿始终,别让观众迷路。
2. **它怎么演进?**——累加生长 / 状态切换 / 焦点移动?对应上面三种方式。
3. **每帧之间有可感变化吗?**——两帧差太小就合并,差太大就中间补帧。

## 失败模式(必避)

- ❌ **每帧重排版**:帧间元素位置乱跳 = 闪烁感。共享元素的 `id`/`x`/`y`/`seed` 跨帧保持不变,只动该动的。
- ❌ **一次性全画完再"动"**:那不是动画,是静态图。动画的价值在**顺序**——按叙事逐步揭示。
- ❌ **reveal 顺序 = 画布顺序而非叙事顺序**:观众跟着新元素走,顺序错了讲解就乱。
- ❌ **导出时 seed 每帧随机**:手绘形状每帧抖成不同样子 = 鬼畜。导出动画必须锁 seed。
- ❌ **节奏匀速**:每帧 holdMs 一样 = 技术演示。关键帧前停长一点,过场帧快一点。

## 最小可跑示例(路径 A 伪流程)

```
frames = buildRevealFrames(elements, order)   // 按 reveal 顺序切成累加帧
for f in frames:
    create_view(JSON.stringify(f))
    sleep(holdMs)
```

`buildRevealFrames` = 给每个元素标一个 `revealStep`,第 k 帧 = 所有 `revealStep <= k` 的元素。
