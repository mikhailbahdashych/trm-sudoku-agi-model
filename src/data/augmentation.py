"""Sudoku-preserving augmentations for data augmentation.

These transformations preserve the validity of Sudoku puzzles while creating
new training examples from existing ones.
"""

import numpy as np
from typing import Tuple


class SudokuAugmentor:
    """Applies validity-preserving augmentations to Sudoku puzzles.

    Augmentations include:
    - Row permutation within bands (3 rows that share a 3×3 box)
    - Column permutation within stacks (3 columns that share a 3×3 box)
    - Band permutation (swapping groups of 3 rows)
    - Stack permutation (swapping groups of 3 columns)
    - Digit relabeling (permuting the digits 1-9)
    - Transpose
    - Rotation (90, 180, 270 degrees)
    - Reflection (horizontal, vertical)
    """

    def __init__(self, seed: int = None):
        self.rng = np.random.default_rng(seed)

    def set_seed(self, seed: int):
        """Reset random state with new seed."""
        self.rng = np.random.default_rng(seed)

    def augment(
        self,
        puzzle: np.ndarray,
        solution: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Apply random augmentations to a puzzle-solution pair.

        Args:
            puzzle: Shape (81,) with values 0-9 (0 = empty)
            solution: Shape (81,) with values 1-9

        Returns:
            Augmented (puzzle, solution) pair
        """
        # Reshape to 9×9 for easier manipulation
        puzzle = puzzle.reshape(9, 9).copy()
        solution = solution.reshape(9, 9).copy()

        # Apply augmentations in random order
        augmentations = [
            self._permute_rows_in_bands,
            self._permute_cols_in_stacks,
            self._permute_bands,
            self._permute_stacks,
            self._relabel_digits,
            self._transpose,
            self._rotate,
            self._reflect,
        ]

        # Shuffle and apply with 50% probability each
        self.rng.shuffle(augmentations)
        for aug_fn in augmentations:
            if self.rng.random() < 0.5:
                puzzle, solution = aug_fn(puzzle, solution)

        return puzzle.flatten(), solution.flatten()

    def augment_batch(
        self,
        puzzles: np.ndarray,
        solutions: np.ndarray,
        n_augmentations: int = 1,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Augment a batch of puzzles.

        Args:
            puzzles: Shape (N, 81)
            solutions: Shape (N, 81)
            n_augmentations: Number of augmented versions per puzzle

        Returns:
            Augmented arrays with shape (N * n_augmentations, 81)
        """
        all_puzzles = []
        all_solutions = []

        for puzzle, solution in zip(puzzles, solutions):
            for _ in range(n_augmentations):
                aug_puzzle, aug_solution = self.augment(puzzle, solution)
                all_puzzles.append(aug_puzzle)
                all_solutions.append(aug_solution)

        return np.array(all_puzzles), np.array(all_solutions)

    def _permute_rows_in_bands(
        self,
        puzzle: np.ndarray,
        solution: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Permute rows within each band (group of 3 rows)."""
        for band in range(3):
            start = band * 3
            perm = self.rng.permutation(3)
            indices = start + perm
            puzzle[start:start+3] = puzzle[indices]
            solution[start:start+3] = solution[indices]
        return puzzle, solution

    def _permute_cols_in_stacks(
        self,
        puzzle: np.ndarray,
        solution: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Permute columns within each stack (group of 3 columns)."""
        for stack in range(3):
            start = stack * 3
            perm = self.rng.permutation(3)
            indices = start + perm
            puzzle[:, start:start+3] = puzzle[:, indices]
            solution[:, start:start+3] = solution[:, indices]
        return puzzle, solution

    def _permute_bands(
        self,
        puzzle: np.ndarray,
        solution: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Permute bands (groups of 3 rows)."""
        perm = self.rng.permutation(3)
        new_puzzle = np.zeros_like(puzzle)
        new_solution = np.zeros_like(solution)
        for i, p in enumerate(perm):
            new_puzzle[i*3:(i+1)*3] = puzzle[p*3:(p+1)*3]
            new_solution[i*3:(i+1)*3] = solution[p*3:(p+1)*3]
        return new_puzzle, new_solution

    def _permute_stacks(
        self,
        puzzle: np.ndarray,
        solution: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Permute stacks (groups of 3 columns)."""
        perm = self.rng.permutation(3)
        new_puzzle = np.zeros_like(puzzle)
        new_solution = np.zeros_like(solution)
        for i, p in enumerate(perm):
            new_puzzle[:, i*3:(i+1)*3] = puzzle[:, p*3:(p+1)*3]
            new_solution[:, i*3:(i+1)*3] = solution[:, p*3:(p+1)*3]
        return new_puzzle, new_solution

    def _relabel_digits(
        self,
        puzzle: np.ndarray,
        solution: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Relabel digits 1-9 with a random permutation."""
        # Create mapping: old digit -> new digit
        perm = self.rng.permutation(9) + 1  # [1-9] shuffled
        mapping = np.zeros(10, dtype=np.int64)  # Index 0 stays 0
        mapping[1:] = perm

        # Apply mapping
        new_puzzle = mapping[puzzle]
        new_solution = mapping[solution]
        return new_puzzle, new_solution

    def _transpose(
        self,
        puzzle: np.ndarray,
        solution: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Transpose the grid (swap rows and columns)."""
        return puzzle.T.copy(), solution.T.copy()

    def _rotate(
        self,
        puzzle: np.ndarray,
        solution: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Rotate by 90, 180, or 270 degrees."""
        k = self.rng.integers(1, 4)  # 1, 2, or 3 rotations of 90 degrees
        return np.rot90(puzzle, k).copy(), np.rot90(solution, k).copy()

    def _reflect(
        self,
        puzzle: np.ndarray,
        solution: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Reflect horizontally or vertically."""
        if self.rng.random() < 0.5:
            # Horizontal flip
            return np.fliplr(puzzle).copy(), np.fliplr(solution).copy()
        else:
            # Vertical flip
            return np.flipud(puzzle).copy(), np.flipud(solution).copy()


def count_augmentation_factor() -> int:
    """Calculate theoretical number of unique augmentations.

    For Sudoku:
    - 3! × 3! × 3! = 216 row permutations within bands
    - 3! × 3! × 3! = 216 column permutations within stacks
    - 3! = 6 band permutations
    - 3! = 6 stack permutations
    - 9! = 362880 digit relabelings
    - 2 transpositions (yes/no)
    - 4 rotations
    - 2 reflections

    Total: 216 × 216 × 6 × 6 × 362880 × 2 × 4 × 2 ≈ 1.2 × 10^12
    """
    return (6**3) * (6**3) * 6 * 6 * 362880 * 2 * 4 * 2
