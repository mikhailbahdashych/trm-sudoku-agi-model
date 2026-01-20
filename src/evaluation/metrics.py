"""Evaluation metrics for Sudoku solutions."""

import numpy as np
import torch
from typing import Dict, Union, Tuple


def cell_accuracy(
    predictions: Union[np.ndarray, torch.Tensor],
    targets: Union[np.ndarray, torch.Tensor],
) -> float:
    """Compute cell-level accuracy.

    Args:
        predictions: Shape (..., 81) with predicted values 1-9
        targets: Shape (..., 81) with target values 1-9

    Returns:
        Fraction of correctly predicted cells
    """
    if isinstance(predictions, torch.Tensor):
        predictions = predictions.cpu().numpy()
    if isinstance(targets, torch.Tensor):
        targets = targets.cpu().numpy()

    return (predictions == targets).mean()


def puzzle_accuracy(
    predictions: Union[np.ndarray, torch.Tensor],
    targets: Union[np.ndarray, torch.Tensor],
) -> float:
    """Compute puzzle-level accuracy (all cells correct).

    Args:
        predictions: Shape (N, 81) with predicted values 1-9
        targets: Shape (N, 81) with target values 1-9

    Returns:
        Fraction of completely solved puzzles
    """
    if isinstance(predictions, torch.Tensor):
        predictions = predictions.cpu().numpy()
    if isinstance(targets, torch.Tensor):
        targets = targets.cpu().numpy()

    # Ensure 2D
    if predictions.ndim == 1:
        predictions = predictions.reshape(1, -1)
        targets = targets.reshape(1, -1)

    correct = (predictions == targets).all(axis=1)
    return correct.mean()


def constraint_violations(
    predictions: Union[np.ndarray, torch.Tensor],
) -> Dict[str, float]:
    """Count Sudoku constraint violations.

    Checks:
    - Row constraints: each row must have digits 1-9
    - Column constraints: each column must have digits 1-9
    - Box constraints: each 3×3 box must have digits 1-9

    Args:
        predictions: Shape (N, 81) or (81,) with values 0-9

    Returns:
        Dict with violation counts and rates
    """
    if isinstance(predictions, torch.Tensor):
        predictions = predictions.cpu().numpy()

    # Ensure 2D
    if predictions.ndim == 1:
        predictions = predictions.reshape(1, -1)

    n_puzzles = predictions.shape[0]
    predictions = predictions.reshape(n_puzzles, 9, 9)

    row_violations = 0
    col_violations = 0
    box_violations = 0

    for puzzle in predictions:
        # Row violations
        for row in puzzle:
            if len(set(row)) != 9 or set(row) != set(range(1, 10)):
                row_violations += 1

        # Column violations
        for col in puzzle.T:
            if len(set(col)) != 9 or set(col) != set(range(1, 10)):
                col_violations += 1

        # Box violations
        for bi in range(3):
            for bj in range(3):
                box = puzzle[bi*3:(bi+1)*3, bj*3:(bj+1)*3].flatten()
                if len(set(box)) != 9 or set(box) != set(range(1, 10)):
                    box_violations += 1

    total_rows = n_puzzles * 9
    total_cols = n_puzzles * 9
    total_boxes = n_puzzles * 9

    return {
        "row_violations": row_violations,
        "col_violations": col_violations,
        "box_violations": box_violations,
        "row_violation_rate": row_violations / total_rows,
        "col_violation_rate": col_violations / total_cols,
        "box_violation_rate": box_violations / total_boxes,
        "total_violations": row_violations + col_violations + box_violations,
        "valid_puzzles": n_puzzles - (row_violations > 0) - (col_violations > 0) - (box_violations > 0),
    }


def compute_metrics(
    predictions: Union[np.ndarray, torch.Tensor],
    targets: Union[np.ndarray, torch.Tensor],
    puzzles: Union[np.ndarray, torch.Tensor] = None,
) -> Dict[str, float]:
    """Compute all evaluation metrics.

    Args:
        predictions: Shape (N, 81) with predicted values
        targets: Shape (N, 81) with target values
        puzzles: Shape (N, 81) with input puzzles (optional, for given-cell accuracy)

    Returns:
        Dict with all metrics
    """
    if isinstance(predictions, torch.Tensor):
        predictions = predictions.cpu().numpy()
    if isinstance(targets, torch.Tensor):
        targets = targets.cpu().numpy()
    if puzzles is not None and isinstance(puzzles, torch.Tensor):
        puzzles = puzzles.cpu().numpy()

    # Ensure 2D
    if predictions.ndim == 1:
        predictions = predictions.reshape(1, -1)
        targets = targets.reshape(1, -1)
        if puzzles is not None:
            puzzles = puzzles.reshape(1, -1)

    metrics = {
        "cell_accuracy": cell_accuracy(predictions, targets),
        "puzzle_accuracy": puzzle_accuracy(predictions, targets),
    }

    # Add constraint violations
    violations = constraint_violations(predictions)
    metrics.update(violations)

    # Compute accuracy on empty cells only (the ones model needs to fill)
    if puzzles is not None:
        empty_mask = (puzzles == 0)
        if empty_mask.sum() > 0:
            metrics["empty_cell_accuracy"] = (
                (predictions[empty_mask] == targets[empty_mask]).mean()
            )
        else:
            metrics["empty_cell_accuracy"] = 1.0

        # Verify model didn't change given cells
        given_mask = (puzzles != 0)
        if given_mask.sum() > 0:
            metrics["given_preserved"] = (
                (predictions[given_mask] == puzzles[given_mask]).mean()
            )
        else:
            metrics["given_preserved"] = 1.0

    return metrics


def format_metrics(metrics: Dict[str, float]) -> str:
    """Format metrics dict as readable string."""
    lines = []
    for key, value in metrics.items():
        if "rate" in key or "accuracy" in key or "preserved" in key:
            lines.append(f"{key}: {value:.2%}")
        elif isinstance(value, float):
            lines.append(f"{key}: {value:.4f}")
        else:
            lines.append(f"{key}: {value}")
    return "\n".join(lines)


def errors_by_position(
    predictions: np.ndarray,
    targets: np.ndarray,
) -> np.ndarray:
    """Compute error rate by cell position.

    Useful for understanding if model struggles with certain positions.

    Returns:
        Shape (81,) array with error rate per position
    """
    if predictions.ndim == 1:
        predictions = predictions.reshape(1, -1)
        targets = targets.reshape(1, -1)

    errors = (predictions != targets).astype(float)
    return errors.mean(axis=0)


def difficulty_analysis(
    predictions: np.ndarray,
    targets: np.ndarray,
    puzzles: np.ndarray,
) -> Dict[str, float]:
    """Analyze performance by puzzle difficulty (number of givens).

    Args:
        predictions: Shape (N, 81)
        targets: Shape (N, 81)
        puzzles: Shape (N, 81)

    Returns:
        Dict mapping difficulty buckets to accuracy
    """
    if predictions.ndim == 1:
        predictions = predictions.reshape(1, -1)
        targets = targets.reshape(1, -1)
        puzzles = puzzles.reshape(1, -1)

    n_givens = (puzzles != 0).sum(axis=1)
    correct = (predictions == targets).all(axis=1)

    # Bucket by number of givens
    buckets = {
        "easy (35+)": (n_givens >= 35),
        "medium (28-34)": (n_givens >= 28) & (n_givens < 35),
        "hard (22-27)": (n_givens >= 22) & (n_givens < 28),
        "extreme (<22)": (n_givens < 22),
    }

    results = {}
    for name, mask in buckets.items():
        if mask.sum() > 0:
            results[name] = correct[mask].mean()
        else:
            results[name] = None

    return results
