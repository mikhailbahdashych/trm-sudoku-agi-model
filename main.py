#!/usr/bin/env python3
"""
TRM (Tiny Reasoning Model) for Sudoku-Extreme

Based on "Less is More: Recursive Reasoning with Tiny Networks"

Usage:
    python main.py train [--config CONFIG] [--epochs N] [--batch-size N]
    python main.py evaluate CHECKPOINT [--n-samples N]
    python main.py compare CHECKPOINT [--n-puzzles N] [--llm-model MODEL]
    python main.py visualize [--history PATH] [--eval PATH] [--output-dir DIR]
    python main.py visualize-comparison [--comparison PATH] [--output-dir DIR]
    python main.py info

Examples:
    # Train the model
    python main.py train --config configs/default.yaml

    # Evaluate on test set
    python main.py evaluate outputs/best.pt --show-examples

    # Compare with LLM
    python main.py compare outputs/best.pt --n-puzzles 5 --llm-model llama3.2

    # Visualize training results
    python main.py visualize --history outputs/history.json --eval outputs/eval_results.json

    # Visualize TRM vs LLM comparison
    python main.py visualize-comparison --comparison outputs/llm_comparison.json
"""

import sys
from pathlib import Path


def print_info():
    """Print project information."""
    print("=" * 60)
    print("TRM (Tiny Reasoning Model) for Sudoku-Extreme")
    print("=" * 60)
    print()
    print("Based on: 'Less is More: Recursive Reasoning with Tiny Networks'")
    print()
    print("Architecture:")
    print("  - 2 TRM layers with shared weights for recursion")
    print("  - ~5M parameters (hidden_dim=512)")
    print("  - MLP-based (no attention, since context=81 <= hidden=512)")
    print("  - RMSNorm + SwiGLU activation")
    print()
    print("Recursion:")
    print("  - n=6 latent recursions per deep step")
    print("  - T=3 deep recursion loops with supervision")
    print("  - Adaptive Computation Time (ACT) for halting")
    print()
    print("Training:")
    print("  - 1000 training samples with 200x augmentation")
    print("  - Deep supervision (loss at each T step)")
    print("  - EMA weights with decay=0.999")
    print("  - Mixed precision (BF16)")
    print()
    print("Files:")
    print("  configs/default.yaml  - Configuration")
    print("  scripts/train.py      - Training script")
    print("  scripts/evaluate.py   - Evaluation script")
    print("  scripts/compare_llm.py - LLM comparison")
    print("  scripts/visualize.py  - Visualization script")
    print()
    print("Commands:")
    print("  python main.py train              - Train the model")
    print("  python main.py evaluate           - Evaluate trained model")
    print("  python main.py compare            - Compare with LLM")
    print("  python main.py visualize          - Visualize training results")
    print("  python main.py visualize-comparison - Visualize TRM vs LLM comparison")
    print("  python main.py info               - Show this info")
    print("=" * 60)


def main():
    if len(sys.argv) < 2:
        print_info()
        print("\nUsage: python main.py <command> [options]")
        print("Commands: train, evaluate, compare, visualize, visualize-comparison, info")
        sys.exit(0)

    command = sys.argv[1].lower()

    if command == "info":
        print_info()

    elif command == "train":
        # Pass remaining args to train script
        sys.argv = [sys.argv[0]] + sys.argv[2:]
        from scripts.train import main as train_main
        train_main()

    elif command == "evaluate":
        # Pass remaining args to evaluate script
        sys.argv = [sys.argv[0]] + sys.argv[2:]
        from scripts.evaluate import main as evaluate_main
        evaluate_main()

    elif command == "compare":
        # Pass remaining args to compare script
        sys.argv = [sys.argv[0]] + sys.argv[2:]
        from scripts.compare_llm import main as compare_main
        compare_main()

    elif command == "visualize":
        # Pass remaining args to visualize script
        sys.argv = [sys.argv[0]] + sys.argv[2:]
        from scripts.visualize import main as visualize_main
        visualize_main()

    elif command == "visualize-comparison":
        # Pass remaining args to visualize comparison script
        sys.argv = [sys.argv[0]] + sys.argv[2:]
        from scripts.visualize_comparison import main as visualize_comparison_main
        visualize_comparison_main()

    else:
        print(f"Unknown command: {command}")
        print("Available commands: train, evaluate, compare, visualize, visualize-comparison, info")
        sys.exit(1)


if __name__ == "__main__":
    main()
