# Worked example:大堆 context → clarify → data.ir → 自动建议拆图

走一遍真实场景,演示 `clarify` → `data.ir`(含 `scope`)→ `data-ir-check.mjs` 的闭环。
对应方法:`references/clarify.md`、`references/data-ir.md`;校验器:`scripts/data-ir-check.mjs`。

## 0. 用户的原始输入(一大堆 context)

> 「我们系统有:API 网关、用户/订单/支付/库存服务,跑在 K8s 上,用 MySQL 主从、Redis、Kafka;
> 发布走 Git → CI 构建 → 镜像仓库 → ArgoCD → K8s;监控有 Prometheus、Grafana、告警。
> 帮我画个图看看整体。」

典型「装不下一张图」的料:**16 个实体,横跨运行时 / 发布 / 可观测三个关注点**。

## 1. clarify → brief

读了描述后,只问决策相关的:**给谁看**(定颗粒度)+ **最想说哪件事**(因为料太杂,关键一问自动变成范围题)。

```jsonc
brief = {
  audience: "新入职工程师(中等专业度)",
  purpose:  "onboarding —— 快速建立全局认知",
  question: "我们整个研发体系长什么样",
  scope_hints: { must_include: ["运行时","发布","可观测"], out: [] },
  constraints: "白板风、单色"
}
```

## 2. data.ir(naive 版:照单全收)

先按直觉把 16 项全塞进**一张** network 图(`examples/data-ir/ecommerce.naive.data-ir.json`):
`scope.diagrams` 只有 1 张、`budget.cut` 为空。

## 3. 跑 checker —— 机器抓出「装不下」并自动提拆分

```
$ node scripts/data-ir-check.mjs examples/data-ir/ecommerce.naive.data-ir.json

  指标 {"in":16,"budget":9,"items":16,"groups":3,"diagrams":1}
  ⚠ [over-capacity] 界内 16 项 > 容量预算 9,却只有 1 张图、且 cut/deferred 为空 —— 密度没控制
     → 拆图(scope.diagrams)或上卷/砍(budget)
  ⚠ [disconnected] 关系图有 3 个不连通分量 → 建议拆成 3 张图
     → 按分量: 运行时拓扑 / 发布流水线 / 可观测
  建议拆分(按连通分量):
     图1: API 网关, 用户服务, 订单服务, 支付服务, 库存服务, MySQL 主从, Redis, Kafka
     图2: Git 仓库, CI 构建, 镜像仓库, ArgoCD, K8s 集群
     图3: Prometheus, Grafana, Alertmanager
  → 0 error / 2 warn
```

两条可计算信号都命中:**容量超**(16>9)+ **关系图 3 个不连通分量**;并**自动按分量提出 3 张图**的方案。
这就是「用户甩一大堆 context」的正解——不硬画成一张,而是回:**「这其实是 3 张:运行时 / 发布 / 可观测,要全做还是先做总览?」**(split 闸口,交人拍板)。

## 4. 拍板后:data.ir(fixed 版)

用户选「3 张都要」→ `scope.diagrams` 填 3 张,每张一个子 message(`ecommerce.data-ir.json`)。复跑:

```
$ node scripts/data-ir-check.mjs examples/data-ir/ecommerce.data-ir.json

  指标 {"in":16,"budget":9,"items":16,"groups":3,"diagrams":3}
  ℹ [capacity] 界内 16 项 > 9;已用 3 图 / cut+defer 0 项缓解
  ℹ [components] 关系图 3 个不连通分量,已拆成 3 图 ✓(运行时拓扑 / 发布流水线 / 可观测)
  → 0 error / 0 warn
```

警告清零,只剩 info。每张子图(≤8 项)落在容量内,再各自走 dispatch → encoding → render。

## 这个例子证明了什么

- **clarify 把模糊需求收敛成 brief**(受众/目的/唯一问题)。
- **data.ir 把一堆料结构化,`scope` 给出边界/颗粒度/拆几张**。
- **可计算的那部分**(容量计数、连通分量)由 `data-ir-check.mjs` 机械把关,**还能自动提出拆分方案**;
  「3 张还是先做 1 张」这种 stakes 决策留给人。
- 与 thinking.md「能算的算、语义靠模型、stakes 靠人」一致:checker 是 lint/把关,不替你做语义。
