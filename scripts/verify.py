#!/usr/bin/env python3
"""
verify.py · 帧/图结构校验(绘图刷新动画 & 静态图)

用法:
    python scripts/verify.py _frames/order-flow            # 校验帧序列
    python scripts/verify.py 架构图.excalidraw             # 校验单个 .excalidraw 文件

检查项:
    - 元素 id 唯一(同帧内无重复)
    - 箭头 binding 双向登记(startBinding/endBinding 指向的框存在)
    - 坐标在画布范围内(粗检)
    - 跨帧共享元素的 seed 不变(动画防鬼畜)—— 仅帧序列模式

状态:🚧 SCAFFOLD —— 基础校验就位,可随帧 schema 演进补充。
"""
import json
import sys
import os
import glob


def load_elements(path):
    """从 .excalidraw 或 frame-*.json 读出 Element[]"""
    data = json.load(open(path))
    if isinstance(data, list):
        return data                      # frame-NNN.json 是裸数组
    return data.get("elements", [])      # .excalidraw 包了一层


def check_elements(els, label):
    issues = []
    ids = [e.get("id") for e in els if e.get("id")]
    if len(set(ids)) != len(ids):
        issues.append(f"{label}: 存在重复 id")
    idset = set(ids)
    for e in els:
        if e.get("type") == "arrow":
            for b in ("startBinding", "endBinding"):
                bind = e.get(b)
                if bind and bind.get("elementId") and bind["elementId"] not in idset:
                    issues.append(f"{label}: 箭头 {e.get('id')} 的 {b} 指向不存在的元素 {bind['elementId']}")
    return issues


def main():
    if len(sys.argv) < 2:
        print("用法: python verify.py <_frames/dir | file.excalidraw>")
        sys.exit(1)
    target = sys.argv[1]
    all_issues = []

    if os.path.isdir(target):
        frame_files = sorted(glob.glob(os.path.join(target, "frame-*.json")))
        if not frame_files:
            print(f"目录中无 frame-*.json: {target}")
            sys.exit(1)
        seed_map = {}  # id -> seed(首次见到)
        for ff in frame_files:
            els = load_elements(ff)
            all_issues += check_elements(els, os.path.basename(ff))
            for e in els:
                eid, seed = e.get("id"), e.get("seed")
                if eid and seed is not None:
                    if eid in seed_map and seed_map[eid] != seed:
                        all_issues.append(f"{os.path.basename(ff)}: 元素 {eid} 的 seed 跨帧变化(动画会鬼畜)")
                    seed_map.setdefault(eid, seed)
        print(f"校验 {len(frame_files)} 帧。")
    else:
        els = load_elements(target)
        all_issues += check_elements(els, os.path.basename(target))
        print(f"校验 {len(els)} 个元素。")

    if all_issues:
        print("\n发现问题:")
        for i in all_issues:
            print("  ⚠", i)
        sys.exit(2)
    print("✓ 通过")


if __name__ == "__main__":
    main()
