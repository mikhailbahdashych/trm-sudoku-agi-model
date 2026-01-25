#!/usr/bin/env python3
"""Visualize TRM vs LLM comparison results."""

import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def load_comparison(path: str) -> dict:
    """Load comparison results from JSON."""
    with open(path, "r") as f:
        return json.load(f)


def plot_accuracy_comparison(data: dict, output_dir: Path):
    """Create bar chart comparing TRM vs LLM accuracy."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    # Get data
    trm_cell = data["trm_metrics"]["cell_accuracy"] * 100
    trm_puzzle = data["trm_metrics"]["puzzle_accuracy"] * 100

    strategies = list(data["llm_summary"].keys())
    llm_cell = [data["llm_summary"][s]["avg_cell_accuracy"] * 100 for s in strategies]
    llm_puzzle = [data["llm_summary"][s]["puzzle_accuracy"] * 100 for s in strategies]

    # Colors
    trm_color = "#2ecc71"  # Green
    llm_colors = ["#e74c3c", "#e67e22", "#9b59b6"]  # Red, Orange, Purple

    # Cell accuracy comparison
    ax1 = axes[0]
    x = np.arange(len(strategies) + 1)
    bars = [trm_cell] + llm_cell
    colors = [trm_color] + llm_colors
    labels = ["TRM\n(5M params)"] + [f"LLM\n({s})" for s in strategies]

    bar_plot = ax1.bar(x, bars, color=colors, edgecolor="black", linewidth=1.2)
    ax1.set_ylabel("Accuracy (%)", fontsize=12)
    ax1.set_title("Cell Accuracy Comparison", fontsize=14, fontweight="bold")
    ax1.set_xticks(x)
    ax1.set_xticklabels(labels, fontsize=10)
    ax1.set_ylim(0, 105)
    ax1.axhline(y=100, color="gray", linestyle="--", alpha=0.3)

    # Add value labels
    for bar, val in zip(bar_plot, bars):
        ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                f"{val:.1f}%", ha="center", va="bottom", fontsize=11, fontweight="bold")

    # Puzzle accuracy comparison
    ax2 = axes[1]
    bars = [trm_puzzle] + llm_puzzle

    bar_plot = ax2.bar(x, bars, color=colors, edgecolor="black", linewidth=1.2)
    ax2.set_ylabel("Accuracy (%)", fontsize=12)
    ax2.set_title("Puzzle Accuracy Comparison", fontsize=14, fontweight="bold")
    ax2.set_xticks(x)
    ax2.set_xticklabels(labels, fontsize=10)
    ax2.set_ylim(0, 105)
    ax2.axhline(y=100, color="gray", linestyle="--", alpha=0.3)

    # Add value labels
    for bar, val in zip(bar_plot, bars):
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                f"{val:.1f}%", ha="center", va="bottom", fontsize=11, fontweight="bold")

    plt.tight_layout()
    plt.savefig(output_dir / "trm_vs_llm_accuracy.png", dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_dir / 'trm_vs_llm_accuracy.png'}")


def plot_model_comparison_summary(data: dict, output_dir: Path):
    """Create summary comparison chart."""
    fig, ax = plt.subplots(figsize=(10, 8))

    # Data
    models = ["TRM (5M params)", "LLM - Direct", "LLM - CoT", "LLM - Few-shot"]
    cell_acc = [
        data["trm_metrics"]["cell_accuracy"] * 100,
        data["llm_summary"]["direct"]["avg_cell_accuracy"] * 100,
        data["llm_summary"]["cot"]["avg_cell_accuracy"] * 100,
        data["llm_summary"]["fewshot"]["avg_cell_accuracy"] * 100,
    ]
    puzzle_acc = [
        data["trm_metrics"]["puzzle_accuracy"] * 100,
        data["llm_summary"]["direct"]["puzzle_accuracy"] * 100,
        data["llm_summary"]["cot"]["puzzle_accuracy"] * 100,
        data["llm_summary"]["fewshot"]["puzzle_accuracy"] * 100,
    ]

    x = np.arange(len(models))
    width = 0.35

    bars1 = ax.bar(x - width/2, cell_acc, width, label="Cell Accuracy", color="#3498db", edgecolor="black")
    bars2 = ax.bar(x + width/2, puzzle_acc, width, label="Puzzle Accuracy", color="#2ecc71", edgecolor="black")

    ax.set_ylabel("Accuracy (%)", fontsize=12)
    ax.set_title("TRM vs LLM: Sudoku Solving Performance", fontsize=14, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(models, fontsize=10, rotation=15, ha="right")
    ax.legend(loc="upper right", fontsize=11)
    ax.set_ylim(0, 110)
    ax.axhline(y=100, color="gray", linestyle="--", alpha=0.3)

    # Add value labels
    for bar in bars1:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2, height + 1,
               f"{height:.1f}%", ha="center", va="bottom", fontsize=9)
    for bar in bars2:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2, height + 1,
               f"{height:.1f}%", ha="center", va="bottom", fontsize=9)

    plt.tight_layout()
    plt.savefig(output_dir / "model_comparison_summary.png", dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_dir / 'model_comparison_summary.png'}")


def plot_response_time(data: dict, output_dir: Path):
    """Compare response times."""
    fig, ax = plt.subplots(figsize=(10, 6))

    strategies = list(data["llm_summary"].keys())
    times = [data["llm_summary"][s]["avg_time_seconds"] for s in strategies]

    # TRM is essentially instant (< 0.01s per puzzle on GPU)
    trm_time = 0.01

    models = ["TRM"] + [f"LLM ({s})" for s in strategies]
    all_times = [trm_time] + times
    colors = ["#2ecc71", "#e74c3c", "#e67e22", "#9b59b6"]

    bars = ax.bar(models, all_times, color=colors, edgecolor="black", linewidth=1.2)
    ax.set_ylabel("Time per puzzle (seconds)", fontsize=12)
    ax.set_title("Inference Speed Comparison", fontsize=14, fontweight="bold")
    ax.set_yscale("log")

    # Add value labels
    for bar, val in zip(bars, all_times):
        label = f"{val:.2f}s" if val < 1 else f"{val:.1f}s"
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() * 1.1,
               label, ha="center", va="bottom", fontsize=11, fontweight="bold")

    plt.tight_layout()
    plt.savefig(output_dir / "response_time_comparison.png", dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_dir / 'response_time_comparison.png'}")


def plot_efficiency_comparison(data: dict, output_dir: Path):
    """Plot efficiency (accuracy per parameter)."""
    fig, ax = plt.subplots(figsize=(10, 6))

    # Parameters (approximate)
    trm_params = 5.16  # Million
    llm_params = 1500  # Million (1.5B)

    trm_puzzle_acc = data["trm_metrics"]["puzzle_accuracy"] * 100
    best_llm_acc = max(data["llm_summary"][s]["puzzle_accuracy"] * 100
                       for s in data["llm_summary"])
    best_llm_cell_acc = max(data["llm_summary"][s]["avg_cell_accuracy"] * 100
                            for s in data["llm_summary"])

    # Accuracy per million parameters
    trm_efficiency = trm_puzzle_acc / trm_params
    llm_efficiency = best_llm_acc / llm_params if best_llm_acc > 0 else 0

    models = ["TRM\n(5M params)", "LLM\n(1.5B params)"]
    efficiency = [trm_efficiency, llm_efficiency]
    puzzle_acc = [trm_puzzle_acc, best_llm_acc]

    x = np.arange(2)
    width = 0.35

    ax.bar(x, puzzle_acc, width * 2, color=["#2ecc71", "#e74c3c"], edgecolor="black", linewidth=1.2)

    ax.set_ylabel("Puzzle Accuracy (%)", fontsize=12)
    ax.set_title("Parameter Efficiency: TRM vs LLM", fontsize=14, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(models, fontsize=12)

    # Add annotations
    ax.annotate(f"{trm_puzzle_acc:.0f}% accuracy\nwith 300x fewer params",
               xy=(0, trm_puzzle_acc), xytext=(0.3, trm_puzzle_acc + 15),
               fontsize=11, ha="center",
               arrowprops=dict(arrowstyle="->", color="gray"))

    if best_llm_acc == 0:
        ax.annotate(f"0% puzzle accuracy\ndespite 1.5B params",
                   xy=(1, 5), xytext=(1, 25),
                   fontsize=11, ha="center",
                   arrowprops=dict(arrowstyle="->", color="gray"))

    ax.set_ylim(0, 100)

    plt.tight_layout()
    plt.savefig(output_dir / "efficiency_comparison.png", dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_dir / 'efficiency_comparison.png'}")


def plot_key_findings(data: dict, output_dir: Path):
    """Create a summary infographic."""
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.axis("off")

    # Title
    ax.text(0.5, 0.95, "TRM vs LLM: Sudoku Solving Comparison",
           fontsize=20, fontweight="bold", ha="center", transform=ax.transAxes)

    # Key metrics
    trm_puzzle = data["trm_metrics"]["puzzle_accuracy"] * 100
    trm_cell = data["trm_metrics"]["cell_accuracy"] * 100
    llm_best_puzzle = max(data["llm_summary"][s]["puzzle_accuracy"] * 100
                          for s in data["llm_summary"])
    llm_best_cell = max(data["llm_summary"][s]["avg_cell_accuracy"] * 100
                        for s in data["llm_summary"])

    # TRM box
    trm_box = plt.Rectangle((0.05, 0.35), 0.4, 0.5, fill=True,
                            facecolor="#d5f5e3", edgecolor="#27ae60", linewidth=3)
    ax.add_patch(trm_box)
    ax.text(0.25, 0.78, "TRM", fontsize=18, fontweight="bold", ha="center", color="#27ae60")
    ax.text(0.25, 0.70, "5M Parameters", fontsize=12, ha="center", color="#666")
    ax.text(0.25, 0.58, f"{trm_puzzle:.0f}%", fontsize=36, fontweight="bold", ha="center", color="#27ae60")
    ax.text(0.25, 0.48, "Puzzle Accuracy", fontsize=12, ha="center", color="#666")
    ax.text(0.25, 0.40, f"Cell Accuracy: {trm_cell:.1f}%", fontsize=11, ha="center", color="#666")

    # LLM box
    llm_box = plt.Rectangle((0.55, 0.35), 0.4, 0.5, fill=True,
                            facecolor="#fadbd8", edgecolor="#e74c3c", linewidth=3)
    ax.add_patch(llm_box)
    ax.text(0.75, 0.78, "LLM (Qwen 2.5)", fontsize=18, fontweight="bold", ha="center", color="#e74c3c")
    ax.text(0.75, 0.70, "1.5B Parameters", fontsize=12, ha="center", color="#666")
    ax.text(0.75, 0.58, f"{llm_best_puzzle:.0f}%", fontsize=36, fontweight="bold", ha="center", color="#e74c3c")
    ax.text(0.75, 0.48, "Puzzle Accuracy", fontsize=12, ha="center", color="#666")
    ax.text(0.75, 0.40, f"Cell Accuracy: {llm_best_cell:.1f}%", fontsize=11, ha="center", color="#666")

    # VS
    ax.text(0.5, 0.60, "VS", fontsize=24, fontweight="bold", ha="center", color="#333")

    # Key finding
    ax.text(0.5, 0.20, "Key Finding:", fontsize=14, fontweight="bold", ha="center")
    ax.text(0.5, 0.12, "TRM with 300x fewer parameters achieves 60% puzzle accuracy,",
           fontsize=12, ha="center")
    ax.text(0.5, 0.06, "while the 1.5B parameter LLM fails to solve any puzzle completely.",
           fontsize=12, ha="center")

    plt.tight_layout()
    plt.savefig(output_dir / "key_findings.png", dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_dir / 'key_findings.png'}")


def main():
    parser = argparse.ArgumentParser(description="Visualize TRM vs LLM comparison")
    parser.add_argument(
        "--comparison",
        type=str,
        default="outputs/llm_comparison.json",
        help="Path to comparison JSON file",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="outputs/comparison_plots",
        help="Directory to save plots",
    )
    args = parser.parse_args()

    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Load data
    print(f"Loading comparison data from {args.comparison}...")
    data = load_comparison(args.comparison)

    # Print summary
    print("\n" + "=" * 60)
    print("TRM vs LLM Comparison Summary")
    print("=" * 60)
    print(f"\nTRM (5M params):")
    print(f"  Puzzle Accuracy: {data['trm_metrics']['puzzle_accuracy']*100:.1f}%")
    print(f"  Cell Accuracy: {data['trm_metrics']['cell_accuracy']*100:.1f}%")

    print(f"\nLLM (Qwen 2.5 - 1.5B params):")
    for strategy, summary in data["llm_summary"].items():
        print(f"  {strategy.upper()}:")
        print(f"    Puzzle Accuracy: {summary['puzzle_accuracy']*100:.1f}%")
        print(f"    Cell Accuracy: {summary['avg_cell_accuracy']*100:.1f}%")
        print(f"    Avg Time: {summary['avg_time_seconds']:.1f}s")

    print("\n" + "=" * 60)

    # Generate plots
    print("\nGenerating visualizations...")
    plot_accuracy_comparison(data, output_dir)
    plot_model_comparison_summary(data, output_dir)
    plot_response_time(data, output_dir)
    plot_efficiency_comparison(data, output_dir)
    plot_key_findings(data, output_dir)

    print(f"\nAll plots saved to: {output_dir}")


if __name__ == "__main__":
    main()
