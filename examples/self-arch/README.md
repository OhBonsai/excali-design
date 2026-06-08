# Dogfood 样例:用 excali-design 画 excali-design 自己

完整走一遍**强制**前置:`clarify(brief)→ data.ir(+ data-ir-check)→ 画 .excalidraw → lint`。
可当其它「自由信息可视化」任务的填空模板(空白骨架在 `examples/data-ir/_TEMPLATE.*`)。

| 文件 | 阶段 |
|---|---|
| `brief.json` | clarify 产物(受众/目的/唯一问题/范围/约束) |
| `data-ir.json` | data.ir(message / dataset_type / items / relations / salience / scope / budget)—— **过 checker** |
| `overview.excalidraw` | 产物(源文件,可拖进 excalidraw.com) |
| `overview.png` | 导出预览 |
| `gen.mjs` | 本图的海报型布局生成器(手工坐标 + 绑定箭头) |

复跑验证:
```
node scripts/data-ir-check.mjs examples/self-arch/data-ir.json   # 0 error / 0 warn
node scripts/arch-lint.mjs    examples/self-arch/overview.excalidraw  # 0 error
node scripts/floor-check.mjs  examples/self-arch/overview.excalidraw --type hero
```

要点:18 个组件按 6 个 containment 分区**折叠**(`budget.aggregated`)→ `scope.boundary.in`=6 块,落在容量预算内,所以能一张图;编码用 **containment(分区)+ connection(箭头)**,hue 仅 3 色(墨/蓝/灰)编角色,hero=渲染器区。
