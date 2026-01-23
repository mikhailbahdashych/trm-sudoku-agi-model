"""Visualization script for training history and evaluation results."""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def load_history(path: str) -> dict:
    """Load training history from JSON file."""
    with open(path, "r") as f:
        return json.load(f)


def load_eval_results(path: str) -> dict:
    """Load evaluation results from JSON file."""
    with open(path, "r") as f:
        return json.load(f)


def plot_training_curves(history: dict, output_dir: Path):
    """Plot training loss, validation loss, and validation accuracy."""
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # Training loss
    ax = axes[0, 0]
    ax.plot(history["train_loss"], color="blue", alpha=0.7)
    ax.set_xlabel("Log Interval")
    ax.set_ylabel("Training Loss")
    ax.set_title("Training Loss Over Time")
    ax.grid(True, alpha=0.3)

    # Validation loss
    ax = axes[0, 1]
    ax.plot(history["val_loss"], color="red", alpha=0.7)
    ax.set_xlabel("Evaluation Step")
    ax.set_ylabel("Validation Loss")
    ax.set_title("Validation Loss Over Time")
    ax.axhline(y=min(history["val_loss"]), color="green", linestyle="--",
               label=f"Best: {min(history['val_loss']):.4f}")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # Validation accuracy
    ax = axes[1, 0]
    val_acc_percent = [acc * 100 for acc in history["val_acc"]]
    ax.plot(val_acc_percent, color="green", alpha=0.7)
    ax.set_xlabel("Evaluation Step")
    ax.set_ylabel("Validation Puzzle Accuracy (%)")
    ax.set_title("Validation Puzzle Accuracy Over Time")
    ax.axhline(y=max(val_acc_percent), color="blue", linestyle="--",
               label=f"Best: {max(val_acc_percent):.2f}%")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # Learning rate
    ax = axes[1, 1]
    ax.plot(history["lr"], color="orange", alpha=0.7)
    ax.set_xlabel("Log Interval")
    ax.set_ylabel("Learning Rate")
    ax.set_title("Learning Rate Schedule")
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(output_dir / "training_curves.png", dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_dir / 'training_curves.png'}")


def plot_loss_comparison(history: dict, output_dir: Path):
    """Plot training vs validation loss on same axes."""
    fig, ax = plt.subplots(figsize=(10, 6))

    # Normalize x-axis to match (train has more points than val)
    train_x = np.linspace(0, 1, len(history["train_loss"]))
    val_x = np.linspace(0, 1, len(history["val_loss"]))

    ax.plot(train_x, history["train_loss"], label="Training Loss", color="blue", alpha=0.7)
    ax.plot(val_x, history["val_loss"], label="Validation Loss", color="red", alpha=0.7)

    ax.set_xlabel("Training Progress")
    ax.set_ylabel("Loss")
    ax.set_title("Training vs Validation Loss")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # Mark best validation loss
    best_idx = np.argmin(history["val_loss"])
    best_x = val_x[best_idx]
    best_val = history["val_loss"][best_idx]
    ax.scatter([best_x], [best_val], color="green", s=100, zorder=5,
               label=f"Best val_loss: {best_val:.4f}")
    ax.legend()

    plt.tight_layout()
    plt.savefig(output_dir / "loss_comparison.png", dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_dir / 'loss_comparison.png'}")


def plot_difficulty_breakdown(eval_results: dict, output_dir: Path):
    """Plot accuracy by difficulty level."""
    difficulty = eval_results.get("difficulty", {})

    if not difficulty:
        print("No difficulty data found in eval_results")
        return

    # Filter out None values
    labels = []
    values = []
    colors = ["#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"]

    for (label, value), color in zip(difficulty.items(), colors):
        if value is not None:
            labels.append(label)
            values.append(value * 100)

    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.bar(labels, values, color=colors[:len(labels)], edgecolor="black", alpha=0.8)

    # Add value labels on bars
    for bar, value in zip(bars, values):
        height = bar.get_height()
        ax.annotate(f'{value:.1f}%',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=12, fontweight='bold')

    ax.set_xlabel("Difficulty Level", fontsize=12)
    ax.set_ylabel("Puzzle Accuracy (%)", fontsize=12)
    ax.set_title("Model Performance by Puzzle Difficulty", fontsize=14)
    ax.set_ylim(0, max(values) * 1.15 if values else 100)
    ax.grid(True, alpha=0.3, axis='y')

    plt.tight_layout()
    plt.savefig(output_dir / "difficulty_breakdown.png", dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_dir / 'difficulty_breakdown.png'}")


def plot_error_heatmap(eval_results: dict, output_dir: Path):
    """Plot error rate by cell position as 9x9 heatmap."""
    error_positions = eval_results.get("error_positions", [])

    if not error_positions or len(error_positions) != 81:
        print("No valid error_positions data found")
        return

    # Reshape to 9x9 grid
    errors = np.array(error_positions).reshape(9, 9) * 100  # Convert to percentage

    fig, ax = plt.subplots(figsize=(10, 8))

    # Create heatmap
    sns.heatmap(errors, annot=True, fmt='.1f', cmap='YlOrRd',
                cbar_kws={'label': 'Error Rate (%)'}, ax=ax,
                vmin=0, vmax=max(errors.flatten()) * 1.1)

    ax.set_title("Error Rate by Cell Position (%)", fontsize=14)
    ax.set_xlabel("Column", fontsize=12)
    ax.set_ylabel("Row", fontsize=12)

    # Add grid lines for 3x3 boxes
    for i in range(0, 10, 3):
        ax.axhline(y=i, color='black', linewidth=2)
        ax.axvline(x=i, color='black', linewidth=2)

    plt.tight_layout()
    plt.savefig(output_dir / "error_heatmap.png", dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_dir / 'error_heatmap.png'}")


def plot_metrics_summary(eval_results: dict, output_dir: Path):
    """Plot summary of key metrics."""
    metrics = eval_results.get("metrics", {})

    if not metrics:
        print("No metrics data found")
        return

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Accuracy metrics
    ax = axes[0]
    acc_labels = ["Cell\nAccuracy", "Puzzle\nAccuracy", "Empty Cell\nAccuracy", "Given\nPreserved"]
    acc_values = [
        metrics.get("cell_accuracy", 0) * 100,
        metrics.get("puzzle_accuracy", 0) * 100,
        metrics.get("empty_cell_accuracy", 0) * 100,
        metrics.get("given_preserved", 0) * 100,
    ]
    colors = ["#3498db", "#2ecc71", "#9b59b6", "#1abc9c"]

    bars = ax.bar(acc_labels, acc_values, color=colors, edgecolor="black", alpha=0.8)
    for bar, value in zip(bars, acc_values):
        height = bar.get_height()
        ax.annotate(f'{value:.1f}%',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=11, fontweight='bold')

    ax.set_ylabel("Accuracy (%)", fontsize=12)
    ax.set_title("Accuracy Metrics", fontsize=14)
    ax.set_ylim(0, 105)
    ax.grid(True, alpha=0.3, axis='y')

    # Violation rates
    ax = axes[1]
    viol_labels = ["Row\nViolations", "Column\nViolations", "Box\nViolations"]
    viol_values = [
        metrics.get("row_violation_rate", 0) * 100,
        metrics.get("col_violation_rate", 0) * 100,
        metrics.get("box_violation_rate", 0) * 100,
    ]
    colors = ["#e74c3c", "#e67e22", "#f39c12"]

    bars = ax.bar(viol_labels, viol_values, color=colors, edgecolor="black", alpha=0.8)
    for bar, value in zip(bars, viol_values):
        height = bar.get_height()
        ax.annotate(f'{value:.1f}%',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=11, fontweight='bold')

    ax.set_ylabel("Violation Rate (%)", fontsize=12)
    ax.set_title("Constraint Violation Rates", fontsize=14)
    ax.set_ylim(0, max(viol_values) * 1.3 if viol_values else 100)
    ax.grid(True, alpha=0.3, axis='y')

    plt.tight_layout()
    plt.savefig(output_dir / "metrics_summary.png", dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_dir / 'metrics_summary.png'}")


def plot_accuracy_progression(history: dict, output_dir: Path):
    """Plot validation accuracy progression with milestones."""
    val_acc = [acc * 100 for acc in history["val_acc"]]

    fig, ax = plt.subplots(figsize=(12, 6))

    ax.plot(val_acc, color="#2ecc71", linewidth=2, alpha=0.8)
    ax.fill_between(range(len(val_acc)), val_acc, alpha=0.3, color="#2ecc71")

    # Mark milestones
    milestones = [10, 25, 40, 50]
    for milestone in milestones:
        # Find first time we reached this milestone
        for i, acc in enumerate(val_acc):
            if acc >= milestone:
                ax.axhline(y=milestone, color="gray", linestyle="--", alpha=0.5)
                ax.scatter([i], [acc], color="red", s=80, zorder=5)
                ax.annotate(f'{milestone}% @ eval {i}',
                           xy=(i, acc), xytext=(10, 10),
                           textcoords="offset points", fontsize=9)
                break

    ax.set_xlabel("Evaluation Step", fontsize=12)
    ax.set_ylabel("Validation Puzzle Accuracy (%)", fontsize=12)
    ax.set_title("Accuracy Progression During Training", fontsize=14)
    ax.set_ylim(0, max(val_acc) * 1.1)
    ax.grid(True, alpha=0.3)

    # Add final accuracy annotation
    ax.annotate(f'Final: {val_acc[-1]:.1f}%',
               xy=(len(val_acc)-1, val_acc[-1]),
               xytext=(-60, 20), textcoords="offset points",
               fontsize=12, fontweight='bold',
               arrowprops=dict(arrowstyle="->", color="black"))

    plt.tight_layout()
    plt.savefig(output_dir / "accuracy_progression.png", dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {output_dir / 'accuracy_progression.png'}")


def create_all_plots(history_path: str, eval_path: str, output_dir: str):
    """Create all visualization plots."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading data...")

    # Load history if exists
    history = None
    if Path(history_path).exists():
        history = load_history(history_path)
        print(f"  Loaded history: {len(history.get('train_loss', []))} training logs, "
              f"{len(history.get('val_acc', []))} evaluations")
    else:
        print(f"  Warning: {history_path} not found")

    # Load eval results if exists
    eval_results = None
    if Path(eval_path).exists():
        eval_results = load_eval_results(eval_path)
        print(f"  Loaded eval results")
    else:
        print(f"  Warning: {eval_path} not found")

    print(f"\nGenerating plots...")

    # Generate plots
    if history:
        plot_training_curves(history, output_dir)
        plot_loss_comparison(history, output_dir)
        plot_accuracy_progression(history, output_dir)

    if eval_results:
        plot_difficulty_breakdown(eval_results, output_dir)
        plot_error_heatmap(eval_results, output_dir)
        plot_metrics_summary(eval_results, output_dir)

    print(f"\nAll plots saved to: {output_dir}")


def main():
    parser = argparse.ArgumentParser(description="Visualize training results")
    parser.add_argument(
        "--history",
        type=str,
        default="outputs/history.json",
        help="Path to history.json file",
    )
    parser.add_argument(
        "--eval",
        type=str,
        default="outputs/eval_results.json",
        help="Path to eval_results.json file",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="outputs/plots",
        help="Directory to save plots",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("TRM Training Visualization")
    print("=" * 60)

    create_all_plots(args.history, args.eval, args.output_dir)

    print("\n" + "=" * 60)
    print("Visualization Complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
