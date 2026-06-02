# 交付前验证

## 静态图自检清单

- [ ] 元素无意外重叠 / 遮挡
- [ ] 所有元素吸附 20px 网格,同层对齐
- [ ] 箭头都 `binding` 到节点(改布局不脱节)
- [ ] 数据流方向一致(全图左→右 或 上→下)
- [ ] 配色 ≤ 3-4 色,语义化(有 legend)
- [ ] drawlib 组件平移后无变形、无撞 id
- [ ] 复用组件 id 重新生成过
- [ ] placeholder 都是诚实的(无编造数据)
- [ ] 架构图:对照 `system-facts.md` 逐条核对(服务全/方向对/无漏边)
- [ ] 抽象层级单一(没混下钻细节)

## 怎么验证

- **MCP 可用**:create_view 渲染后肉眼过一遍,或截图
- **MCP 不可用**:产出 `.excalidraw` 文件,导入 excalidraw.com 检查;或 `node scripts/excalidraw-to-image.mjs 图.excalidraw --png` 导出 PNG 肉眼过
- **程序化·结构**:`scripts/verify.mjs` 对 `.excalidraw` 做结构检查(id 唯一、binding 双向)
- **程序化·辅助扫描(非门槛)**:`node scripts/arch-lint.mjs <图.excalidraw>`——只抓肉眼易漏的「明显重叠/脱节」机械错误。**不是质量门槛、不是优化目标**:测不了图好不好、讲清楚没;别为 lint 全绿去改图(Goodhart)。报警 ≠ 图差,全绿 ≠ 图好。仍以肉眼为准。详见 `references/arch-lint.md`

## 检查点

🛑 交付前自己过一遍。AI 生成的元素常有重叠/脱节/撞色,不过一遍必有 bug。
