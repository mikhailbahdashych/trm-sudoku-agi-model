"""PyTorch Dataset for Sudoku puzzles with on-the-fly augmentation."""

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from typing import Tuple, Optional, Dict, Any
from datasets import load_dataset

from .augmentation import SudokuAugmentor


class SudokuDataset(Dataset):
    """PyTorch Dataset for Sudoku puzzles.

    Loads puzzles from HuggingFace datasets and applies augmentation on-the-fly.
    Uses the 'sudoku-extreme' or similar datasets.
    """

    def __init__(
        self,
        split: str = "train",
        n_samples: Optional[int] = None,
        augmentations_per_sample: int = 1,
        seed: int = 42,
        dataset_name: str = "Ritvik19/Sudoku-Dataset",
    ):
        """Initialize the dataset.

        Args:
            split: "train" or "test" (or "validation" for some datasets)
            n_samples: Number of base samples to use (None = all, but be careful!)
            augmentations_per_sample: Number of augmented versions per epoch
            seed: Random seed for reproducibility
            dataset_name: HuggingFace dataset identifier
        """
        self.split = split
        self.augmentations_per_sample = augmentations_per_sample
        self.augmentor = SudokuAugmentor(seed=seed)

        # Map common split names
        hf_split = "validation" if split == "test" else split

        # Load only the samples we need using HuggingFace slicing
        # This avoids loading the entire dataset into memory
        if n_samples is not None:
            # Use slice notation to load only first n_samples
            # We'll shuffle later with a fixed seed for reproducibility
            slice_str = f"{hf_split}[:{n_samples * 2}]"  # Load 2x to allow for shuffling
            print(f"Loading {dataset_name} ({slice_str})...")
        else:
            slice_str = hf_split
            print(f"Loading {dataset_name} ({hf_split} split)...")

        try:
            dataset = load_dataset(dataset_name, split=slice_str)
        except ValueError:
            # Some datasets don't support slicing, fall back to full load
            print(f"Slice loading failed, loading full {hf_split} split...")
            dataset = load_dataset(dataset_name, split=hf_split)

        # Convert to numpy arrays efficiently
        print("Parsing puzzles...")
        puzzles = []
        solutions = []

        # Limit iteration if n_samples specified
        max_items = n_samples * 2 if n_samples else len(dataset)
        for i, item in enumerate(dataset):
            if i >= max_items:
                break
            puzzle = self._parse_puzzle_string(item["puzzle"])
            solution = self._parse_puzzle_string(item["solution"])
            puzzles.append(puzzle)
            solutions.append(solution)

        self.puzzles = np.array(puzzles)
        self.solutions = np.array(solutions)

        # Shuffle and subsample with fixed seed
        if n_samples is not None and n_samples < len(self.puzzles):
            rng = np.random.default_rng(seed)
            indices = rng.permutation(len(self.puzzles))[:n_samples]
            self.puzzles = self.puzzles[indices]
            self.solutions = self.solutions[indices]

        print(f"Loaded {len(self.puzzles)} puzzles")

    def _parse_puzzle_string(self, s: str) -> np.ndarray:
        """Convert 81-character string to numpy array.

        Args:
            s: String of 81 digits (0-9, where 0 or '.' means empty)

        Returns:
            Shape (81,) array with values 0-9
        """
        # Handle different formats
        s = s.replace(".", "0").replace(" ", "").replace("\n", "")
        return np.array([int(c) for c in s], dtype=np.int64)

    def __len__(self) -> int:
        """Return total samples including augmentations."""
        return len(self.puzzles) * self.augmentations_per_sample

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        """Get a (possibly augmented) puzzle-solution pair.

        Args:
            idx: Index into the dataset

        Returns:
            Dict with 'puzzle' and 'solution' tensors of shape (81,)
        """
        # Map augmented index to base index
        base_idx = idx % len(self.puzzles)
        aug_idx = idx // len(self.puzzles)

        puzzle = self.puzzles[base_idx].copy()
        solution = self.solutions[base_idx].copy()

        # Apply augmentation (different seed per augmentation index)
        if self.augmentations_per_sample > 1:
            self.augmentor.set_seed(idx)
            puzzle, solution = self.augmentor.augment(puzzle, solution)

        return {
            "puzzle": torch.from_numpy(puzzle).long(),
            "solution": torch.from_numpy(solution).long(),
        }

    def get_raw(self, idx: int) -> Tuple[np.ndarray, np.ndarray]:
        """Get raw puzzle-solution pair without augmentation."""
        return self.puzzles[idx].copy(), self.solutions[idx].copy()


class InfiniteSudokuDataset(Dataset):
    """Dataset that generates infinite augmented samples.

    For training with a fixed number of steps rather than epochs.
    """

    def __init__(
        self,
        base_puzzles: np.ndarray,
        base_solutions: np.ndarray,
        seed: int = 42,
    ):
        self.puzzles = base_puzzles
        self.solutions = base_solutions
        self.augmentor = SudokuAugmentor(seed=seed)
        self.epoch = 0

    def set_epoch(self, epoch: int):
        """Set epoch for deterministic augmentation."""
        self.epoch = epoch

    def __len__(self) -> int:
        return len(self.puzzles)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        puzzle = self.puzzles[idx].copy()
        solution = self.solutions[idx].copy()

        # Different augmentation each epoch
        self.augmentor.set_seed(self.epoch * len(self.puzzles) + idx)
        puzzle, solution = self.augmentor.augment(puzzle, solution)

        return {
            "puzzle": torch.from_numpy(puzzle).long(),
            "solution": torch.from_numpy(solution).long(),
        }


def create_dataloaders(
    train_samples: int = 1000,
    test_samples: int = 1000,
    augmentations_per_sample: int = 200,
    batch_size: int = 512,
    num_workers: int = 4,
    seed: int = 42,
    dataset_name: str = "Ritvik19/Sudoku-Dataset",
) -> Tuple[DataLoader, DataLoader]:
    """Create train and test dataloaders.

    Args:
        train_samples: Number of base training samples
        test_samples: Number of test samples (default 1000 to avoid memory issues)
        augmentations_per_sample: Augmentations per sample per epoch
        batch_size: Batch size for training
        num_workers: Number of data loading workers
        seed: Random seed
        dataset_name: HuggingFace dataset name

    Returns:
        (train_loader, test_loader)
    """
    train_dataset = SudokuDataset(
        split="train",
        n_samples=train_samples,
        augmentations_per_sample=augmentations_per_sample,
        seed=seed,
        dataset_name=dataset_name,
    )

    test_dataset = SudokuDataset(
        split="test",
        n_samples=test_samples,  # Limit test samples too
        augmentations_per_sample=1,  # No augmentation for test
        seed=seed + 1,  # Different seed for test
        dataset_name=dataset_name,
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True,
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    return train_loader, test_loader


def puzzle_to_string(puzzle: np.ndarray) -> str:
    """Convert puzzle array to readable string format."""
    puzzle = puzzle.reshape(9, 9)
    lines = []
    for i, row in enumerate(puzzle):
        if i > 0 and i % 3 == 0:
            lines.append("------+-------+------")
        row_str = ""
        for j, val in enumerate(row):
            if j > 0 and j % 3 == 0:
                row_str += " |"
            cell = str(val) if val > 0 else "."
            row_str += f" {cell}"
        lines.append(row_str.strip())
    return "\n".join(lines)


def puzzle_to_flat_string(puzzle: np.ndarray) -> str:
    """Convert puzzle array to 81-character string."""
    return "".join(str(int(x)) for x in puzzle.flatten())
