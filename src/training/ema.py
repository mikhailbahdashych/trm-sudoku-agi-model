"""Exponential Moving Average (EMA) for model weights.

EMA helps stabilize training and often produces better final models
by maintaining a smoothed version of the weights.
"""

import torch
import torch.nn as nn
from typing import Optional
from copy import deepcopy


class EMA:
    """Exponential Moving Average of model parameters.

    Maintains shadow copies of model parameters that are updated
    as: shadow = decay * shadow + (1 - decay) * param

    Usage:
        model = MyModel()
        ema = EMA(model, decay=0.999)

        for batch in dataloader:
            loss = model(batch)
            loss.backward()
            optimizer.step()
            ema.update()

        # For evaluation, use EMA weights
        with ema.average_parameters():
            evaluate(model)
    """

    def __init__(
        self,
        model: nn.Module,
        decay: float = 0.999,
        warmup_steps: int = 0,
    ):
        """Initialize EMA.

        Args:
            model: Model whose parameters to track
            decay: EMA decay factor (higher = smoother)
            warmup_steps: Linearly increase decay from 0 to target over this many steps
        """
        self.model = model
        self.decay = decay
        self.warmup_steps = warmup_steps
        self.step = 0

        # Create shadow copies of parameters
        self.shadow = {}
        self.backup = {}

        for name, param in model.named_parameters():
            if param.requires_grad:
                self.shadow[name] = param.data.clone()

    def _get_decay(self) -> float:
        """Get current decay value with warmup."""
        if self.step < self.warmup_steps:
            return self.decay * self.step / self.warmup_steps
        return self.decay

    @torch.no_grad()
    def update(self):
        """Update shadow parameters with current model parameters."""
        decay = self._get_decay()
        self.step += 1

        for name, param in self.model.named_parameters():
            if param.requires_grad and name in self.shadow:
                self.shadow[name].mul_(decay).add_(param.data, alpha=1 - decay)

    @torch.no_grad()
    def apply_shadow(self):
        """Replace model parameters with shadow parameters."""
        for name, param in self.model.named_parameters():
            if param.requires_grad and name in self.shadow:
                self.backup[name] = param.data.clone()
                param.data.copy_(self.shadow[name])

    @torch.no_grad()
    def restore(self):
        """Restore original parameters from backup."""
        for name, param in self.model.named_parameters():
            if param.requires_grad and name in self.backup:
                param.data.copy_(self.backup[name])
        self.backup = {}

    def average_parameters(self):
        """Context manager for temporarily using EMA parameters."""
        return EMAContext(self)

    def state_dict(self) -> dict:
        """Get state dict for checkpointing."""
        return {
            "shadow": {k: v.cpu() for k, v in self.shadow.items()},
            "step": self.step,
            "decay": self.decay,
            "warmup_steps": self.warmup_steps,
        }

    def load_state_dict(self, state_dict: dict):
        """Load state dict from checkpoint."""
        self.step = state_dict["step"]
        self.decay = state_dict["decay"]
        self.warmup_steps = state_dict["warmup_steps"]

        device = next(self.model.parameters()).device
        for name, value in state_dict["shadow"].items():
            if name in self.shadow:
                self.shadow[name] = value.to(device)


class EMAContext:
    """Context manager for temporarily using EMA parameters."""

    def __init__(self, ema: EMA):
        self.ema = ema

    def __enter__(self):
        self.ema.apply_shadow()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.ema.restore()
        return False
