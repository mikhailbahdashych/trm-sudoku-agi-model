"""Tiny Reasoning Model (TRM) for Sudoku puzzles.

Based on "Less is More: Recursive Reasoning with Tiny Networks".
Uses MLP architecture (instead of attention) since context length (81) <= hidden_dim (512).
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, List, Optional

from .layers import RMSNorm, SwiGLU, MLPBlock


class TRMBlock(nn.Module):
    """Single TRM block with two MLP layers and normalization.

    This block is shared across all recursion steps to enable iterative refinement.
    """

    def __init__(self, hidden_dim: int = 512, mlp_ratio: float = 8/3):
        super().__init__()
        self.mlp1 = MLPBlock(hidden_dim, mlp_ratio)
        self.mlp2 = MLPBlock(hidden_dim, mlp_ratio)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.mlp1(x)
        x = self.mlp2(x)
        return x


class TRM(nn.Module):
    """Tiny Reasoning Model for Sudoku.

    Architecture:
    - Input: 81 cells × 10 one-hot (0=empty, 1-9=digits) = 810 dims
    - Embedding layer projects to hidden_dim
    - Shared TRM block applied recursively:
      - n latent recursions per deep step
      - T deep recursion loops with output heads
    - Output: 81 × 10 logits per cell

    The model uses deep supervision, outputting predictions at each deep step T.
    """

    def __init__(
        self,
        hidden_dim: int = 512,
        num_cells: int = 81,
        num_classes: int = 10,  # 0-9 (0 = empty)
        n_latent: int = 6,  # Latent recursions per deep step
        T_deep: int = 3,  # Deep recursion loops
        mlp_ratio: float = 8/3,
        use_act: bool = True,  # Adaptive Computation Time
    ):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_cells = num_cells
        self.num_classes = num_classes
        self.n_latent = n_latent
        self.T_deep = T_deep
        self.use_act = use_act

        # Input dimension: 81 cells × 10 one-hot = 810
        input_dim = num_cells * num_classes

        # Input embedding
        self.input_proj = nn.Linear(input_dim, hidden_dim, bias=False)
        self.input_norm = RMSNorm(hidden_dim)

        # Shared TRM block (applied recursively)
        self.trm_block = TRMBlock(hidden_dim, mlp_ratio)

        # Output projection for predictions
        self.output_norm = RMSNorm(hidden_dim)
        self.output_proj = nn.Linear(hidden_dim, num_cells * num_classes, bias=False)

        # Halting probability head for ACT
        if use_act:
            self.halt_proj = nn.Linear(hidden_dim, 1, bias=False)

        self._init_weights()

    def _init_weights(self):
        """Initialize weights with small values for stable training."""
        for module in self.modules():
            if isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight, gain=0.1)

    def encode_input(self, puzzles: torch.Tensor) -> torch.Tensor:
        """Convert puzzle grid to one-hot encoded input.

        Args:
            puzzles: Shape (batch, 81) with values 0-9

        Returns:
            Shape (batch, 810) one-hot encoded
        """
        batch_size = puzzles.shape[0]
        # One-hot encode each cell
        one_hot = F.one_hot(puzzles.long(), num_classes=self.num_classes)
        # Flatten to (batch, 81*10)
        return one_hot.float().view(batch_size, -1)

    def decode_output(self, logits: torch.Tensor) -> torch.Tensor:
        """Convert output logits to predictions.

        Args:
            logits: Shape (batch, 810) or (batch, 81, 10)

        Returns:
            Shape (batch, 81) with predicted values 0-9
        """
        batch_size = logits.shape[0]
        logits = logits.view(batch_size, self.num_cells, self.num_classes)
        return logits.argmax(dim=-1)

    def forward(
        self,
        puzzles: torch.Tensor,
        return_all_steps: bool = False,
        max_steps: Optional[int] = None,
    ) -> Tuple[torch.Tensor, dict]:
        """Forward pass with recursive reasoning.

        Args:
            puzzles: Shape (batch, 81) with values 0-9
            return_all_steps: If True, return predictions at each deep step
            max_steps: Override for T_deep during inference

        Returns:
            logits: Shape (batch, 81, 10) - final predictions
            info: Dict with intermediate outputs for training/analysis
        """
        batch_size = puzzles.shape[0]
        T = max_steps if max_steps is not None else self.T_deep

        # Encode input
        x_input = self.encode_input(puzzles)  # (batch, 810)
        h = self.input_norm(self.input_proj(x_input))  # (batch, hidden_dim)

        # Store outputs for deep supervision
        all_logits = []
        all_halt_probs = []
        cumulative_halt = torch.zeros(batch_size, device=puzzles.device)

        for t in range(T):
            # Latent recursions within each deep step
            for _ in range(self.n_latent):
                h = self.trm_block(h)

            # Compute halting probability if using ACT
            if self.use_act:
                halt_logit = self.halt_proj(h).squeeze(-1)  # (batch,)
                halt_prob = torch.sigmoid(halt_logit)
                all_halt_probs.append(halt_prob)
                cumulative_halt = cumulative_halt + halt_prob * (1 - cumulative_halt)

            # Output prediction at this deep step
            h_out = self.output_norm(h)
            logits = self.output_proj(h_out)  # (batch, 810)
            logits = logits.view(batch_size, self.num_cells, self.num_classes)
            all_logits.append(logits)

        # Compile info dict
        info = {
            "all_logits": all_logits if return_all_steps else None,
            "halt_probs": all_halt_probs if self.use_act else None,
            "cumulative_halt": cumulative_halt if self.use_act else None,
        }

        return all_logits[-1], info

    def forward_with_supervision(
        self,
        puzzles: torch.Tensor,
        solutions: torch.Tensor,
    ) -> Tuple[torch.Tensor, torch.Tensor, dict]:
        """Forward pass returning loss components for training.

        Args:
            puzzles: Shape (batch, 81) with values 0-9 (0 = empty)
            solutions: Shape (batch, 81) with values 1-9 (ground truth)

        Returns:
            total_loss: Combined loss for backprop
            logits: Final predictions (batch, 81, 10)
            info: Dict with loss components and metrics
        """
        logits, info = self.forward(puzzles, return_all_steps=True)
        all_logits = info["all_logits"]

        # Deep supervision loss: CE at each step with equal weight
        ce_losses = []
        for step_logits in all_logits:
            # Reshape for cross entropy: (batch*81, 10) vs (batch*81,)
            step_logits_flat = step_logits.view(-1, self.num_classes)
            solutions_flat = solutions.view(-1)
            ce = F.cross_entropy(step_logits_flat, solutions_flat)
            ce_losses.append(ce)

        # Average CE across deep steps
        ce_loss = torch.stack(ce_losses).mean()

        # ACT loss: encourage halting (penalize not halting)
        act_loss = torch.tensor(0.0, device=puzzles.device)
        if self.use_act and info["halt_probs"]:
            # Penalize remaining probability mass (encourage early halting)
            remaining = 1.0 - info["cumulative_halt"]
            act_loss = remaining.mean() * 0.01  # Small weight

        total_loss = ce_loss + act_loss

        info.update({
            "ce_loss": ce_loss,
            "act_loss": act_loss,
            "ce_losses_per_step": ce_losses,
        })

        return total_loss, logits, info

    def count_parameters(self) -> int:
        """Count total trainable parameters."""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)
