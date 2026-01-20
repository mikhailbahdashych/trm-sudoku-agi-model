"""LLM comparison utilities using Ollama for local models."""

import re
import time
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

import numpy as np
import requests

from .metrics import compute_metrics, cell_accuracy, puzzle_accuracy


@dataclass
class LLMResult:
    """Result from LLM evaluation."""
    puzzle: str
    solution: str
    llm_response: str
    llm_solution: Optional[str]
    is_valid: bool
    cell_accuracy: float
    puzzle_correct: bool
    strategy: str
    model: str
    time_seconds: float


class OllamaClient:
    """Simple client for Ollama API."""

    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url

    def generate(
        self,
        model: str,
        prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 2000,
    ) -> str:
        """Generate completion from Ollama model.

        Args:
            model: Model name (e.g., "llama3.2", "mistral")
            prompt: Input prompt
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate

        Returns:
            Generated text
        """
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        response = requests.post(url, json=payload, timeout=120)
        response.raise_for_status()
        return response.json()["response"]

    def list_models(self) -> List[str]:
        """List available models."""
        url = f"{self.base_url}/api/tags"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            models = response.json().get("models", [])
            return [m["name"] for m in models]
        except Exception:
            return []


class LLMComparator:
    """Compare TRM performance with LLMs on Sudoku puzzles."""

    def __init__(
        self,
        model: str = "llama3.2",
        ollama_url: str = "http://localhost:11434",
    ):
        self.client = OllamaClient(ollama_url)
        self.model = model

    def _puzzle_to_grid_string(self, puzzle: np.ndarray) -> str:
        """Convert puzzle array to human-readable grid."""
        puzzle = puzzle.reshape(9, 9)
        lines = []
        for i, row in enumerate(puzzle):
            if i > 0 and i % 3 == 0:
                lines.append("------+-------+------")
            row_str = ""
            for j, val in enumerate(row):
                if j > 0 and j % 3 == 0:
                    row_str += " |"
                cell = str(int(val)) if val > 0 else "."
                row_str += f" {cell}"
            lines.append(row_str.strip())
        return "\n".join(lines)

    def _puzzle_to_flat_string(self, puzzle: np.ndarray) -> str:
        """Convert puzzle to 81-character string."""
        return "".join(str(int(x)) if x > 0 else "." for x in puzzle.flatten())

    def _extract_solution(self, response: str) -> Optional[str]:
        """Extract 81-digit solution from LLM response.

        Tries multiple patterns to find the solution.
        """
        # Clean up response
        response = response.strip()

        # Pattern 1: Look for 81 consecutive digits
        digits_only = re.findall(r"\d{81}", response.replace(" ", "").replace("\n", ""))
        if digits_only:
            return digits_only[-1]  # Take last one (usually the final answer)

        # Pattern 2: Look for grid format and extract digits
        lines = response.split("\n")
        digits = []
        for line in lines:
            # Extract digits from line, skipping separator characters
            line_digits = re.findall(r"[1-9]", line)
            if len(line_digits) == 9:
                digits.extend(line_digits)

        if len(digits) == 81:
            return "".join(digits)

        # Pattern 3: Find any 81 digits in sequence
        all_digits = re.findall(r"[1-9]", response)
        if len(all_digits) >= 81:
            return "".join(all_digits[-81:])

        return None

    def _create_direct_prompt(self, puzzle: np.ndarray) -> str:
        """Create direct prompting strategy."""
        grid = self._puzzle_to_grid_string(puzzle)
        return f"""Solve this Sudoku puzzle. Replace each '.' with a digit 1-9.
Each row, column, and 3x3 box must contain digits 1-9 exactly once.

Puzzle:
{grid}

Output ONLY the complete 81-digit solution as a single line, reading left to right, top to bottom.
No explanation needed."""

    def _create_cot_prompt(self, puzzle: np.ndarray) -> str:
        """Create chain-of-thought prompting strategy."""
        grid = self._puzzle_to_grid_string(puzzle)
        return f"""Solve this Sudoku puzzle step by step.

Puzzle:
{grid}

Think through this carefully:
1. First, identify cells with only one possible value
2. Use elimination within rows, columns, and boxes
3. Continue until solved

After your reasoning, provide the final 81-digit solution on a single line."""

    def _create_fewshot_prompt(self, puzzle: np.ndarray) -> str:
        """Create few-shot prompting strategy with example."""
        grid = self._puzzle_to_grid_string(puzzle)
        example_puzzle = """5 3 . | . 7 . | . . .
 6 . . | 1 9 5 | . . .
 . 9 8 | . . . | . 6 .
------+-------+------
 8 . . | . 6 . | . . 3
 4 . . | 8 . 3 | . . 1
 7 . . | . 2 . | . . 6
------+-------+------
 . 6 . | . . . | 2 8 .
 . . . | 4 1 9 | . . 5
 . . . | . 8 . | . 7 9"""
        example_solution = "534678912672195348198342567859761423426853791713924856961537284287419635345286179"

        return f"""Solve Sudoku puzzles. Output the 81-digit solution.

Example puzzle:
{example_puzzle}

Example solution: {example_solution}

Now solve this puzzle:
{grid}

Solution:"""

    def evaluate_puzzle(
        self,
        puzzle: np.ndarray,
        solution: np.ndarray,
        strategy: str = "direct",
    ) -> LLMResult:
        """Evaluate LLM on a single puzzle.

        Args:
            puzzle: Shape (81,) with values 0-9
            solution: Shape (81,) with values 1-9
            strategy: "direct", "cot", or "fewshot"

        Returns:
            LLMResult with evaluation data
        """
        # Create prompt based on strategy
        if strategy == "direct":
            prompt = self._create_direct_prompt(puzzle)
        elif strategy == "cot":
            prompt = self._create_cot_prompt(puzzle)
        elif strategy == "fewshot":
            prompt = self._create_fewshot_prompt(puzzle)
        else:
            raise ValueError(f"Unknown strategy: {strategy}")

        # Query LLM
        start_time = time.time()
        try:
            response = self.client.generate(self.model, prompt)
        except Exception as e:
            response = f"Error: {e}"
        elapsed = time.time() - start_time

        # Extract and evaluate solution
        llm_solution = self._extract_solution(response)
        is_valid = False
        cell_acc = 0.0
        puzzle_correct = False

        if llm_solution and len(llm_solution) == 81:
            try:
                llm_array = np.array([int(d) for d in llm_solution])
                is_valid = all(1 <= d <= 9 for d in llm_array)
                if is_valid:
                    cell_acc = cell_accuracy(llm_array, solution)
                    puzzle_correct = puzzle_accuracy(llm_array, solution) == 1.0
            except ValueError:
                pass

        return LLMResult(
            puzzle=self._puzzle_to_flat_string(puzzle),
            solution=self._puzzle_to_flat_string(solution),
            llm_response=response,
            llm_solution=llm_solution,
            is_valid=is_valid,
            cell_accuracy=cell_acc,
            puzzle_correct=puzzle_correct,
            strategy=strategy,
            model=self.model,
            time_seconds=elapsed,
        )

    def evaluate_batch(
        self,
        puzzles: np.ndarray,
        solutions: np.ndarray,
        strategies: List[str] = None,
    ) -> Dict[str, List[LLMResult]]:
        """Evaluate LLM on multiple puzzles with multiple strategies.

        Args:
            puzzles: Shape (N, 81)
            solutions: Shape (N, 81)
            strategies: List of strategies to test

        Returns:
            Dict mapping strategy to list of results
        """
        if strategies is None:
            strategies = ["direct", "cot", "fewshot"]

        results = {s: [] for s in strategies}

        for i, (puzzle, solution) in enumerate(zip(puzzles, solutions)):
            print(f"Evaluating puzzle {i+1}/{len(puzzles)}...")
            for strategy in strategies:
                print(f"  Strategy: {strategy}")
                result = self.evaluate_puzzle(puzzle, solution, strategy)
                results[strategy].append(result)
                print(f"    Cell accuracy: {result.cell_accuracy:.2%}, "
                      f"Correct: {result.puzzle_correct}, "
                      f"Time: {result.time_seconds:.1f}s")

        return results

    def summarize_results(self, results: Dict[str, List[LLMResult]]) -> Dict[str, Dict]:
        """Summarize evaluation results by strategy.

        Returns:
            Dict with summary statistics per strategy
        """
        summary = {}

        for strategy, strategy_results in results.items():
            n = len(strategy_results)
            valid = sum(1 for r in strategy_results if r.is_valid)
            correct = sum(1 for r in strategy_results if r.puzzle_correct)
            avg_cell_acc = np.mean([r.cell_accuracy for r in strategy_results])
            avg_time = np.mean([r.time_seconds for r in strategy_results])

            summary[strategy] = {
                "n_puzzles": n,
                "valid_solutions": valid,
                "valid_rate": valid / n if n > 0 else 0,
                "puzzles_correct": correct,
                "puzzle_accuracy": correct / n if n > 0 else 0,
                "avg_cell_accuracy": avg_cell_acc,
                "avg_time_seconds": avg_time,
            }

        return summary


def compare_trm_vs_llm(
    trm_predictions: np.ndarray,
    llm_results: Dict[str, List[LLMResult]],
    solutions: np.ndarray,
) -> Dict[str, Dict]:
    """Compare TRM and LLM performance.

    Args:
        trm_predictions: TRM predictions shape (N, 81)
        llm_results: Dict of LLM results by strategy
        solutions: Ground truth shape (N, 81)

    Returns:
        Comparison summary
    """
    trm_cell_acc = cell_accuracy(trm_predictions, solutions)
    trm_puzzle_acc = puzzle_accuracy(trm_predictions, solutions)

    comparison = {
        "trm": {
            "cell_accuracy": trm_cell_acc,
            "puzzle_accuracy": trm_puzzle_acc,
        }
    }

    for strategy, results in llm_results.items():
        llm_cell_acc = np.mean([r.cell_accuracy for r in results])
        llm_puzzle_acc = sum(r.puzzle_correct for r in results) / len(results)

        comparison[f"llm_{strategy}"] = {
            "cell_accuracy": llm_cell_acc,
            "puzzle_accuracy": llm_puzzle_acc,
        }

        # Relative comparison
        comparison[f"trm_vs_llm_{strategy}"] = {
            "cell_acc_diff": trm_cell_acc - llm_cell_acc,
            "puzzle_acc_diff": trm_puzzle_acc - llm_puzzle_acc,
        }

    return comparison
