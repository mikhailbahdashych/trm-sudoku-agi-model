"""Compare TRM with LLMs on Sudoku puzzles."""

import argparse
import json
import sys
from pathlib import Path
from dataclasses import asdict

import numpy as np
import torch
import yaml
from torch.utils.data import DataLoader

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.model.trm import TRM
from src.data.dataset import SudokuDataset, puzzle_to_string
from src.evaluation.llm_comparison import LLMComparator, compare_trm_vs_llm
from src.evaluation.metrics import compute_metrics
from src.training.ema import EMA


def load_model(checkpoint_path: str, device: str = "cuda") -> TRM:
    """Load model from checkpoint."""
    checkpoint = torch.load(checkpoint_path, map_location=device)
    config = checkpoint["config"]

    model = TRM(
        hidden_dim=config["hidden_dim"],
        n_latent=config["n_latent"],
        T_deep=config["T_deep"],
        use_act=config["use_act"],
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    # Load EMA weights if available
    if "ema_state_dict" in checkpoint:
        ema = EMA(model, decay=config["ema_decay"])
        ema.load_state_dict(checkpoint["ema_state_dict"])
        ema.apply_shadow()

    return model


@torch.no_grad()
def get_trm_predictions(
    model: TRM,
    puzzles: np.ndarray,
    device: str = "cuda",
) -> np.ndarray:
    """Get TRM predictions for puzzles."""
    model.eval()
    puzzles_tensor = torch.from_numpy(puzzles).long().to(device)
    logits, _ = model(puzzles_tensor)
    predictions = logits.argmax(dim=-1)
    return predictions.cpu().numpy()


def print_comparison_table(comparison: dict):
    """Print formatted comparison table."""
    print("\n" + "=" * 70)
    print("TRM vs LLM Comparison")
    print("=" * 70)
    print(f"{'Model/Strategy':<25} {'Cell Acc':<15} {'Puzzle Acc':<15}")
    print("-" * 70)

    for key, metrics in comparison.items():
        if not key.startswith("trm_vs"):
            cell_acc = metrics.get("cell_accuracy", 0)
            puzzle_acc = metrics.get("puzzle_accuracy", 0)
            print(f"{key:<25} {cell_acc:>12.2%} {puzzle_acc:>12.2%}")

    print("-" * 70)
    print("\nRelative Performance (TRM - LLM):")
    for key, metrics in comparison.items():
        if key.startswith("trm_vs"):
            strategy = key.replace("trm_vs_", "")
            cell_diff = metrics.get("cell_acc_diff", 0)
            puzzle_diff = metrics.get("puzzle_acc_diff", 0)
            cell_sign = "+" if cell_diff >= 0 else ""
            puzzle_sign = "+" if puzzle_diff >= 0 else ""
            print(f"  vs {strategy}: Cell {cell_sign}{cell_diff:.2%}, "
                  f"Puzzle {puzzle_sign}{puzzle_diff:.2%}")


def print_detailed_results(llm_results: dict, puzzles: np.ndarray, solutions: np.ndarray):
    """Print detailed results for each puzzle."""
    print("\n" + "=" * 70)
    print("Detailed LLM Results")
    print("=" * 70)

    for strategy, results in llm_results.items():
        print(f"\n--- Strategy: {strategy.upper()} ---")
        for i, result in enumerate(results):
            print(f"\nPuzzle {i+1}:")
            print(puzzle_to_string(puzzles[i]))
            print(f"\nLLM Solution: {'Valid' if result.is_valid else 'Invalid'}")
            if result.llm_solution:
                print(f"Cell accuracy: {result.cell_accuracy:.2%}")
                print(f"Puzzle correct: {result.puzzle_correct}")
            print(f"Response time: {result.time_seconds:.1f}s")


def main():
    parser = argparse.ArgumentParser(description="Compare TRM with LLMs")
    parser.add_argument(
        "checkpoint",
        type=str,
        help="Path to TRM model checkpoint",
    )
    parser.add_argument(
        "--config",
        type=str,
        default="configs/default.yaml",
        help="Path to config file",
    )
    parser.add_argument(
        "--n-puzzles",
        type=int,
        default=5,
        help="Number of puzzles to compare",
    )
    parser.add_argument(
        "--llm-model",
        type=str,
        default=None,
        help="Override LLM model name",
    )
    parser.add_argument(
        "--strategies",
        type=str,
        nargs="+",
        default=None,
        help="Strategies to test (direct, cot, fewshot)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Path to save results JSON",
    )
    parser.add_argument(
        "--detailed",
        action="store_true",
        help="Show detailed per-puzzle results",
    )
    args = parser.parse_args()

    # Load config
    with open(args.config, "r") as f:
        config = yaml.safe_load(f)

    device = config["device"] if torch.cuda.is_available() else "cpu"

    # Get settings
    llm_model = args.llm_model or config["llm"]["model"]
    strategies = args.strategies or config["llm"]["strategies"]
    ollama_url = config["llm"]["ollama_url"]

    print("=" * 70)
    print("TRM vs LLM Comparison")
    print("=" * 70)
    print(f"TRM checkpoint: {args.checkpoint}")
    print(f"LLM model: {llm_model}")
    print(f"Strategies: {strategies}")
    print(f"Number of puzzles: {args.n_puzzles}")
    print("=" * 70)

    # Load TRM model
    print("\nLoading TRM model...")
    trm_model = load_model(args.checkpoint, device)
    print(f"TRM parameters: {trm_model.count_parameters():,}")

    # Load test puzzles
    print("\nLoading test puzzles...")
    test_dataset = SudokuDataset(
        split="test",
        n_samples=args.n_puzzles,
        augmentations_per_sample=1,
        seed=42,  # Fixed seed for reproducibility
        dataset_name=config["data"]["dataset_name"],
    )

    puzzles = np.array([test_dataset.get_raw(i)[0] for i in range(len(test_dataset.puzzles))])
    solutions = np.array([test_dataset.get_raw(i)[1] for i in range(len(test_dataset.solutions))])

    # Get TRM predictions
    print("\nGetting TRM predictions...")
    trm_predictions = get_trm_predictions(trm_model, puzzles, device)
    trm_metrics = compute_metrics(trm_predictions, solutions, puzzles)
    print(f"TRM cell accuracy: {trm_metrics['cell_accuracy']:.2%}")
    print(f"TRM puzzle accuracy: {trm_metrics['puzzle_accuracy']:.2%}")

    # Initialize LLM comparator
    print(f"\nInitializing LLM comparator (model: {llm_model})...")
    try:
        comparator = LLMComparator(model=llm_model, ollama_url=ollama_url)
        available_models = comparator.client.list_models()
        if available_models:
            print(f"Available models: {available_models}")
        else:
            print("Warning: Could not list models. Is Ollama running?")
    except Exception as e:
        print(f"Error connecting to Ollama: {e}")
        print("Make sure Ollama is running: `ollama serve`")
        return

    # Run LLM evaluation
    print("\nEvaluating LLM on puzzles...")
    llm_results = comparator.evaluate_batch(puzzles, solutions, strategies)

    # Summarize results
    llm_summary = comparator.summarize_results(llm_results)
    print("\nLLM Summary by Strategy:")
    for strategy, summary in llm_summary.items():
        print(f"  {strategy}: {summary['puzzle_accuracy']:.2%} puzzle accuracy, "
              f"{summary['avg_cell_accuracy']:.2%} cell accuracy")

    # Compare TRM vs LLM
    comparison = compare_trm_vs_llm(trm_predictions, llm_results, solutions)
    print_comparison_table(comparison)

    # Detailed results
    if args.detailed:
        print_detailed_results(llm_results, puzzles, solutions)

    # Save results
    if args.output:
        output_data = {
            "trm_metrics": trm_metrics,
            "llm_summary": llm_summary,
            "comparison": comparison,
            "llm_results": {
                strategy: [asdict(r) for r in results]
                for strategy, results in llm_results.items()
            },
        }
        # Convert numpy types
        def convert_numpy(obj):
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, (np.bool_,)):
                return bool(obj)
            elif isinstance(obj, (np.int64, np.int32, np.int16, np.int8)):
                return int(obj)
            elif isinstance(obj, (np.float64, np.float32, np.float16)):
                return float(obj)
            elif isinstance(obj, dict):
                return {k: convert_numpy(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy(i) for i in obj]
            return obj

        output_data = convert_numpy(output_data)

        with open(args.output, "w") as f:
            json.dump(output_data, f, indent=2)
        print(f"\nResults saved to: {args.output}")

    print("\n" + "=" * 70)
    print("Comparison complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
