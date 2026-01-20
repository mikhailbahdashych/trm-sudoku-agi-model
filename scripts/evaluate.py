"""Evaluation script for trained TRM model."""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import torch
import yaml
from torch.utils.data import DataLoader
from tqdm import tqdm

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.model.trm import TRM
from src.data.dataset import SudokuDataset, puzzle_to_string
from src.evaluation.metrics import (
    compute_metrics,
    format_metrics,
    difficulty_analysis,
    errors_by_position,
)
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
        ema.apply_shadow()  # Use EMA weights for evaluation

    return model


@torch.no_grad()
def evaluate_model(
    model: TRM,
    test_loader: DataLoader,
    device: str = "cuda",
) -> dict:
    """Evaluate model on test set.

    Returns:
        Dict with metrics and predictions
    """
    model.eval()

    all_predictions = []
    all_solutions = []
    all_puzzles = []

    for batch in tqdm(test_loader, desc="Evaluating"):
        puzzles = batch["puzzle"].to(device)
        solutions = batch["solution"].to(device)

        logits, _ = model(puzzles)
        predictions = logits.argmax(dim=-1)

        all_predictions.append(predictions.cpu().numpy())
        all_solutions.append(solutions.cpu().numpy())
        all_puzzles.append(puzzles.cpu().numpy())

    predictions = np.concatenate(all_predictions)
    solutions = np.concatenate(all_solutions)
    puzzles = np.concatenate(all_puzzles)

    # Compute metrics
    metrics = compute_metrics(predictions, solutions, puzzles)

    # Difficulty analysis
    difficulty = difficulty_analysis(predictions, solutions, puzzles)

    # Error position analysis
    error_positions = errors_by_position(predictions, solutions)

    return {
        "metrics": metrics,
        "difficulty": difficulty,
        "error_positions": error_positions.tolist(),
        "predictions": predictions,
        "solutions": solutions,
        "puzzles": puzzles,
    }


def print_example_predictions(
    predictions: np.ndarray,
    solutions: np.ndarray,
    puzzles: np.ndarray,
    n_examples: int = 3,
):
    """Print example predictions for visual inspection."""
    print("\n" + "=" * 60)
    print("Example Predictions")
    print("=" * 60)

    # Find some correct and incorrect examples
    correct_mask = (predictions == solutions).all(axis=1)
    incorrect_mask = ~correct_mask

    print("\n--- CORRECT PREDICTIONS ---")
    correct_indices = np.where(correct_mask)[0][:n_examples]
    for idx in correct_indices:
        print(f"\nPuzzle {idx}:")
        print("Input:")
        print(puzzle_to_string(puzzles[idx]))
        print("\nPrediction (correct!):")
        print(puzzle_to_string(predictions[idx]))

    print("\n--- INCORRECT PREDICTIONS ---")
    incorrect_indices = np.where(incorrect_mask)[0][:n_examples]
    for idx in incorrect_indices:
        print(f"\nPuzzle {idx}:")
        print("Input:")
        print(puzzle_to_string(puzzles[idx]))
        print("\nPrediction:")
        print(puzzle_to_string(predictions[idx]))
        print("\nGround Truth:")
        print(puzzle_to_string(solutions[idx]))

        # Show errors
        errors = predictions[idx] != solutions[idx]
        error_positions = np.where(errors.reshape(9, 9))
        print(f"Errors at positions: {list(zip(*error_positions))}")


def main():
    parser = argparse.ArgumentParser(description="Evaluate TRM model")
    parser.add_argument(
        "checkpoint",
        type=str,
        help="Path to model checkpoint",
    )
    parser.add_argument(
        "--config",
        type=str,
        default="configs/default.yaml",
        help="Path to config file",
    )
    parser.add_argument(
        "--n-samples",
        type=int,
        default=None,
        help="Number of test samples (default: all)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=512,
        help="Batch size for evaluation",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Path to save results JSON",
    )
    parser.add_argument(
        "--show-examples",
        action="store_true",
        help="Show example predictions",
    )
    args = parser.parse_args()

    # Load config
    with open(args.config, "r") as f:
        config = yaml.safe_load(f)

    device = config["device"] if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    # Load model
    print(f"\nLoading model from: {args.checkpoint}")
    model = load_model(args.checkpoint, device)
    print(f"Model parameters: {model.count_parameters():,}")

    # Load test data
    print("\nLoading test data...")
    test_dataset = SudokuDataset(
        split="test",
        n_samples=args.n_samples,
        augmentations_per_sample=1,
        dataset_name=config["data"]["dataset_name"],
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=config["data"]["num_workers"],
    )

    # Evaluate
    print(f"\nEvaluating on {len(test_dataset)} puzzles...")
    results = evaluate_model(model, test_loader, device)

    # Print results
    print("\n" + "=" * 60)
    print("Evaluation Results")
    print("=" * 60)
    print(format_metrics(results["metrics"]))

    print("\n--- Difficulty Analysis ---")
    for difficulty, acc in results["difficulty"].items():
        if acc is not None:
            print(f"{difficulty}: {acc:.2%}")

    # Show examples if requested
    if args.show_examples:
        print_example_predictions(
            results["predictions"],
            results["solutions"],
            results["puzzles"],
        )

    # Save results
    if args.output:
        output_data = {
            "metrics": results["metrics"],
            "difficulty": results["difficulty"],
            "error_positions": results["error_positions"],
        }
        with open(args.output, "w") as f:
            json.dump(output_data, f, indent=2)
        print(f"\nResults saved to: {args.output}")


if __name__ == "__main__":
    main()
