#!/usr/bin/env python
"""Scan a legacy app for likely ACME design-token migration work."""

from __future__ import annotations

import argparse
import html
import json
import os
import re
from collections import Counter, defaultdict
from pathlib import Path


TEXT_EXTENSIONS = {
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".html",
    ".htm",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".vue",
    ".svelte",
    ".cshtml",
    ".razor",
    ".jsp",
    ".php",
}

IGNORE_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
    "target",
    "vendor",
}

PATTERNS = {
    "hex_color": re.compile(r"#[0-9a-fA-F]{3,8}\b"),
    "rgb_hsl_color": re.compile(r"\b(?:rgb|rgba|hsl|hsla)\([^)]*\)", re.IGNORECASE),
    "named_color": re.compile(r"\b(?:black|white|red|blue|green|gray|grey|transparent)\b", re.IGNORECASE),
    "inline_style": re.compile(r"\bstyle\s*=" , re.IGNORECASE),
    "angular_ngstyle": re.compile(r"\b(?:ng-style|\[ngStyle\])\b"),
    "vue_style_binding": re.compile(r"\b:style\s*="),
    "react_style_prop": re.compile(r"\bstyle=\{\{"),
    "important": re.compile(r"!important"),
    "primeng_class": re.compile(r"\bp-[a-z][a-z0-9-]*\b"),
    "material_class": re.compile(r"\b(?:mat-mdc|mat-|mdc-)[a-z0-9-]*\b"),
    "bootstrap_class": re.compile(r"\b(?:btn|card|navbar|modal|alert|badge|table)(?:-[a-z0-9]+)?\b"),
}

# Conservative color-to-token mapping suggestions
COLOR_MAPPINGS: dict[str, list[dict]] = {
    "#ffffff": [{"token": "--surface-default", "confidence": 0.9, "context": "background"}, {"token": "--text-inverted", "confidence": 0.7, "context": "text"}],
    "#fff": [{"token": "--surface-default", "confidence": 0.9, "context": "background"}],
    "#000000": [{"token": "--text-primary", "confidence": 0.8, "context": "text"}],
    "#000": [{"token": "--text-primary", "confidence": 0.8, "context": "text"}],
    "#333333": [{"token": "--text-primary", "confidence": 0.7, "context": "text"}],
    "#333": [{"token": "--text-primary", "confidence": 0.7, "context": "text"}],
    "#666666": [{"token": "--text-secondary", "confidence": 0.7, "context": "text"}],
    "#666": [{"token": "--text-secondary", "confidence": 0.7, "context": "text"}],
    "#999999": [{"token": "--text-muted", "confidence": 0.7, "context": "text"}],
    "#999": [{"token": "--text-muted", "confidence": 0.7, "context": "text"}],
    "#dddddd": [{"token": "--border-default", "confidence": 0.8, "context": "border"}],
    "#ddd": [{"token": "--border-default", "confidence": 0.8, "context": "border"}],
    "#f0f0f0": [{"token": "--surface-page", "confidence": 0.8, "context": "background"}],
    "#f5f5f5": [{"token": "--surface-page", "confidence": 0.8, "context": "background"}],
    "#e8eaf6": [{"token": "--surface-hover", "confidence": 0.6, "context": "background"}],
    "#c5cae9": [{"token": "--border-default", "confidence": 0.6, "context": "border"}],
    "#1a237e": [{"token": "--accent-primary", "confidence": 0.8, "context": "background"}],
    "#3949ab": [{"token": "--text-link", "confidence": 0.7, "context": "text"}],
    "#bbdefb": [{"token": "--text-link-hover", "confidence": 0.6, "context": "text"}],
    "#2e7d32": [{"token": "--accent-success", "confidence": 0.8, "context": "text"}],
    "#b91c1c": [{"token": "--accent-danger", "confidence": 0.8, "context": "text"}],
    "#d32f2f": [{"token": "--accent-danger", "confidence": 0.8, "context": "text"}],
    "#1976d2": [{"token": "--accent-info", "confidence": 0.7, "context": "text"}],
    "#fbc02d": [{"token": "--accent-warning", "confidence": 0.7, "context": "text"}],
}

RISK_LABELS = {
    "shim": ("Shim", "low", "Override with token values via adapter or shim layer. No template changes."),
    "refactor": ("Refactor", "medium", "Replace classes or inline styles with primitives. Template changes required."),
    "rewrite": ("Rewrite", "high", "Rebuild component from primitives. Use only for small, isolated components."),
}


def iter_files(root: Path):
    for current_root, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file_name in files:
            path = Path(current_root) / file_name
            if path.suffix.lower() in TEXT_EXTENSIONS:
                yield path


def read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            return path.read_text(encoding="latin-1")
        except Exception:
            return None
    except Exception:
        return None


def classify_risk(counts: Counter, color_counts: Counter) -> str:
    if counts.get("inline_style") or counts.get("angular_ngstyle") or counts.get("react_style_prop") or counts.get("vue_style_binding"):
        return "rewrite"
    if counts.get("important"):
        return "refactor"
    if color_counts:
        return "shim"
    return "shim"


def suggest_mapping(color: str) -> list[dict]:
    normalized = color.lower().strip()
    return COLOR_MAPPINGS.get(normalized, [{"token": "--surface-default", "confidence": 0.3, "context": "unknown"}])


def generate_html_report(root: Path, counts: Counter, examples: dict, color_counts: Counter, files_scanned: int, output_path: Path) -> None:
    total_findings = sum(counts.values())
    risk = classify_risk(counts, color_counts)
    risk_name, risk_level, risk_desc = RISK_LABELS[risk]

    # Build color rows
    color_rows = []
    for color, count in color_counts.most_common(30):
        mappings = suggest_mapping(color)
        best = mappings[0]
        color_rows.append({
            "color": color,
            "count": count,
            "token": best["token"],
            "confidence": best["confidence"],
            "context": best["context"],
        })

    # Build file grouping for colors
    file_colors: dict[str, list[dict]] = defaultdict(list)
    for path in iter_files(root):
        text = read_text(path)
        if text is None:
            continue
        rel = str(path.relative_to(root))
        found_colors = set()
        for name in ("hex_color", "rgb_hsl_color", "named_color"):
            for match in PATTERNS[name].finditer(text):
                found_colors.add(match.group(0).lower())
        for c in sorted(found_colors):
            file_colors[rel].append({"color": c, "suggestion": suggest_mapping(c)[0]})

    # Adapter detection
    adapters = []
    if counts.get("primeng_class"):
        adapters.append("PrimeNG")
    if counts.get("material_class"):
        adapters.append("Angular Material / MDC")
    if counts.get("bootstrap_class"):
        adapters.append("Bootstrap")

    html_parts = [
        "<!DOCTYPE html>",
        '<html lang="en">',
        "<head>",
        '  <meta charset="UTF-8" />',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        "  <title>Migration Report</title>",
        "  <style>",
        "    * { box-sizing: border-box; }",
        "    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f8; color: #0a0e1a; line-height: 1.5; }",
        "    .page { max-width: 960px; margin: 0 auto; padding: 40px 24px; }",
        "    .header { margin-bottom: 32px; }",
        "    h1 { font-size: 28px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em; }",
        "    .subtitle { color: #5e6578; font-size: 15px; }",
        "    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 32px; }",
        "    .stat { background: #fff; border: 1px solid #dadee6; border-radius: 8px; padding: 16px; }",
        "    .stat-value { font-size: 24px; font-weight: 700; color: #0f1d40; }",
        "    .stat-label { font-size: 12px; font-weight: 600; color: #5e6578; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }",
        "    .risk { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; margin-bottom: 32px; }",
        "    .risk-low { background: #dcfce7; color: #14532d; }",
        "    .risk-medium { background: #fef9c3; color: #854d0e; }",
        "    .risk-high { background: #fee2e2; color: #7f1d1d; }",
        "    section { margin-bottom: 40px; }",
        "    h2 { font-size: 18px; font-weight: 600; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid #eceef2; }",
        "    table { width: 100%; border-collapse: collapse; font-size: 13px; background: #fff; border: 1px solid #dadee6; border-radius: 8px; overflow: hidden; }",
        "    th { text-align: left; padding: 10px 12px; background: #f4f6f8; font-size: 11px; font-weight: 600; color: #5e6578; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #dadee6; }",
        "    td { padding: 10px 12px; border-bottom: 1px solid #eceef2; vertical-align: top; }",
        "    tr:hover td { background: #f9fafb; }",
        "    .color-swatch { display: inline-block; width: 16px; height: 16px; border-radius: 3px; border: 1px solid #dadee6; vertical-align: middle; margin-right: 6px; }",
        "    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; background: #f4f6f8; padding: 2px 5px; border-radius: 3px; }",
        "    .confidence { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 10px; }",
        "    .conf-high { background: #dcfce7; color: #14532d; }",
        "    .conf-medium { background: #dbeafe; color: #1e3a8a; }",
        "    .conf-low { background: #f3f4f6; color: #374151; }",
        "    .file-group { margin-bottom: 24px; }",
        "    .file-name { font-size: 13px; font-weight: 600; color: #0f1d40; margin-bottom: 8px; }",
        "    .example { font-family: ui-monospace, monospace; font-size: 12px; color: #374151; background: #f4f6f8; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }",
        "    .shim-box { background: #fff; border: 1px solid #dadee6; border-radius: 8px; padding: 16px; margin-bottom: 16px; }",
        "    .shim-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #5e6578; margin-bottom: 8px; }",
        "    .shim-code { font-family: ui-monospace, monospace; font-size: 12px; line-height: 1.6; color: #374151; white-space: pre; overflow-x: auto; }",
        "    .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; margin-left: 6px; }",
        "    .badge-info { background: #dbeafe; color: #1e3a8a; }",
        "    footer { text-align: center; padding: 32px 0; color: #9ca3af; font-size: 12px; border-top: 1px solid #eceef2; margin-top: 32px; }",
        "    @media (max-width: 640px) { .page { padding: 24px 16px; } .stats { grid-template-columns: 1fr 1fr; } }",
        "  </style>",
        "</head>",
        "<body>",
        '  <div class="page">',
        '    <div class="header">',
        '      <h1>Migration Report</h1>',
        f'      <div class="subtitle">{html.escape(str(root))} · {files_scanned} files scanned</div>',
        "    </div>",
        f'    <div class="risk risk-{risk_level}">',
        f'      <span>Recommended strategy: {risk_name}</span>',
        f'      <span style="font-weight:400;opacity:0.8;">{html.escape(risk_desc)}</span>',
        "    </div>",
        '    <div class="stats">',
        f'      <div class="stat"><div class="stat-value">{files_scanned}</div><div class="stat-label">Files</div></div>',
        f'      <div class="stat"><div class="stat-value">{total_findings}</div><div class="stat-label">Findings</div></div>',
        f'      <div class="stat"><div class="stat-value">{len(color_counts)}</div><div class="stat-label">Unique Colors</div></div>',
        f'      <div class="stat"><div class="stat-value">{len(adapters)}</div><div class="stat-label">Adapter Candidates</div></div>',
        "    </div>",
    ]

    if adapters:
        html_parts += [
            '    <section>',
            '      <h2>Adapter Candidates</h2>',
            '      <div style="display:flex;flex-wrap:wrap;gap:8px;">',
        ]
        for adapter in adapters:
            html_parts.append(f'        <span class="badge badge-info">{html.escape(adapter)}</span>')
        html_parts += ["      </div>", "    </section>"]

    if color_rows:
        html_parts += [
            '    <section>',
            '      <h2>Color Mapping Suggestions</h2>',
            '      <table>',
            "        <thead><tr><th>Color</th><th>Occurrences</th><th>Suggested Token</th><th>Context</th><th>Confidence</th></tr></thead>",
            "        <tbody>",
        ]
        for row in color_rows:
            conf_class = "conf-high" if row["confidence"] >= 0.8 else "conf-medium" if row["confidence"] >= 0.5 else "conf-low"
            html_parts.append(
                f'          <tr><td><span class="color-swatch" style="background:{html.escape(row["color"])};"></span><code>{html.escape(row["color"])}</code></td>'
                f'<td>{row["count"]}</td><td><code>{html.escape(row["token"])}</code></td>'
                f'<td>{html.escape(row["context"])}</td>'
                f'<td><span class="confidence {conf_class}">{int(row["confidence"] * 100)}%</span></td></tr>'
            )
        html_parts += ["        </tbody>", "      </table>", "    </section>"]

    if file_colors:
        html_parts += [
            '    <section>',
            '      <h2>Colors by File</h2>',
        ]
        for file_name, colors in sorted(file_colors.items(), key=lambda x: len(x[1]), reverse=True)[:20]:
            html_parts += [
                '      <div class="file-group">',
                f'        <div class="file-name">{html.escape(file_name)}</div>',
            ]
            for c in colors[:5]:
                html_parts.append(
                    f'        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:12px;">'
                    f'<span class="color-swatch" style="background:{html.escape(c["color"])};"></span>'
                    f'<code>{html.escape(c["color"])}</code> → <code>{html.escape(c["suggestion"]["token"])}</code></div>'
                )
            html_parts += ["      </div>"]
        html_parts += ["    </section>"]

    # Before/After shim example
    html_parts += [
        '    <section>',
        '      <h2>Shim Example</h2>',
        '      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">',
        '        <div class="shim-box">',
        '          <div class="shim-label" style="color:#b91c1c;">Before (Legacy)</div>',
        '          <div class="shim-code">.nav {\n  background: #1a237e;\n  color: white;\n  padding: 12px;\n}</div>',
        "        </div>",
        '        <div class="shim-box">',
        '          <div class="shim-label" style="color:#15803d;">After (Token Shim)</div>',
        '          <div class="shim-code">.nav {\n  background: var(--accent-primary);\n  color: var(--text-inverted);\n  padding: var(--space-3);\n}</div>',
        "        </div>",
        "      </div>",
        "    </section>",
    ]

    if examples:
        html_parts += [
            '    <section>',
            '      <h2>Examples</h2>',
        ]
        for name in sorted(examples):
            html_parts += [
                f'      <h3 style="font-size:14px;font-weight:600;margin:16px 0 8px;">{html.escape(name)}</h3>',
            ]
            for item in examples[name][:6]:
                html_parts.append(f'      <div class="example">{html.escape(item)}</div>')
        html_parts += ["    </section>"]

    html_parts += [
        '    <footer>',
        '      Generated by ACME Design System Migration Scanner',
        "    </footer>",
        "  </div>",
        "</body>",
        "</html>",
    ]

    output_path.write_text("\n".join(html_parts), encoding="utf-8")
    print(f"HTML report written to {output_path}")


def generate_json_report(root: Path, counts: Counter, examples: dict, color_counts: Counter, files_scanned: int) -> None:
    data = {
        "target": str(root),
        "files_scanned": files_scanned,
        "findings": dict(counts),
        "color_counts": dict(color_counts.most_common()),
        "examples": {k: v[:6] for k, v in examples.items()},
        "risk": classify_risk(counts, color_counts),
    }
    print(json.dumps(data, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan for legacy styling migration signals.")
    parser.add_argument("path", nargs="?", default=".", help="Target app/repo path")
    parser.add_argument("--max-examples", type=int, default=12, help="Examples per category")
    parser.add_argument("--format", choices=["text", "json", "html"], default="text", help="Output format")
    parser.add_argument("--output", type=Path, default=Path("migration-report.html"), help="Output path for HTML format")
    args = parser.parse_args()

    root = Path(args.path).resolve()
    if not root.exists():
        parser.error(f"path does not exist: {root}")

    counts = Counter()
    examples: dict[str, list[str]] = defaultdict(list)
    color_counts = Counter()
    files_scanned = 0

    for path in iter_files(root):
        text = read_text(path)
        if text is None:
            continue
        files_scanned += 1
        rel = path.relative_to(root)
        for name, pattern in PATTERNS.items():
            matches = list(pattern.finditer(text))
            if not matches:
                continue
            counts[name] += len(matches)
            for match in matches[:3]:
                if len(examples[name]) >= args.max_examples:
                    break
                line_no = text.count("\n", 0, match.start()) + 1
                snippet = text.splitlines()[line_no - 1].strip()
                examples[name].append(f"{rel}:{line_no}: {snippet[:180]}")
            if name in {"hex_color", "rgb_hsl_color", "named_color"}:
                for match in matches:
                    color_counts[match.group(0).lower()] += 1

    if args.format == "html":
        generate_html_report(root, counts, examples, color_counts, files_scanned, args.output)
        return 0

    if args.format == "json":
        generate_json_report(root, counts, examples, color_counts, files_scanned)
        return 0

    # Text output (default)
    print("# ACME Design System Migration Scan\n")
    print(f"- Target: `{root}`")
    print(f"- Files scanned: {files_scanned}\n")

    print("## Findings\n")
    if not counts:
        print("No obvious legacy styling signals found.")
    else:
        for name, count in counts.most_common():
            print(f"- `{name}`: {count}")

    if color_counts:
        print("\n## Most Common Concrete Colors\n")
        for color, count in color_counts.most_common(20):
            print(f"- `{color}`: {count}")

    print("\n## Examples\n")
    for name in sorted(examples):
        print(f"\n### {name}\n")
        for item in examples[name]:
            print(f"- `{item}`")

    print("\n## Suggested Next Steps\n")
    if counts.get("primeng_class"):
        print("- PrimeNG signals found: verify `primeng-adapter.css` against the installed PrimeNG version.")
    if counts.get("material_class"):
        print("- Material signals found: verify `material-adapter.css` against the installed Angular Material/MDC version.")
    if counts.get("inline_style") or counts.get("angular_ngstyle") or counts.get("react_style_prop") or counts.get("vue_style_binding"):
        print("- Inline or dynamic styles found: separate static values for refactor from data-driven values that may remain inline.")
    if color_counts:
        print("- Build a token mapping for the top repeated colors before running broad replacements.")
    print("- Add tokens + theme first, then adapters, then targeted shims loaded last.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
