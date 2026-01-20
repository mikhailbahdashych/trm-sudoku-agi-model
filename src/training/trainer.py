"""Training loop for TRM with deep supervision and mixed precision."""

import os
import time
import json
from pathlib import Path
from typing import Dict, Optional, Any
from dataclasses import dataclass, asdict

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.amp import GradScaler, autocast
from tqdm import tqdm

from ..model.trm import TRM
from .ema import EMA


@dataclass
class TrainingConfig:
    """Training configuration."""
    # Model
    hidden_dim: int = 512
    n_latent: int = 6
    T_deep: int = 3
    use_act: bool = True

    # Training
    epochs: int = 10000
    batch_size: int = 512
    learning_rate: float = 3e-4
    weight_decay: float = 1.0
    warmup_steps: int = 1000
    max_grad_norm: float = 1.0

    # EMA
    ema_decay: float = 0.999
    ema_warmup_steps: int = 100

    # Mixed precision
    use_amp: bool = True
    amp_dtype: str = "bfloat16"

    # Data
    train_samples: int = 1000
    augmentations_per_sample: int = 200

    # Logging and checkpointing
    log_interval: int = 100
    eval_interval: int = 1000
    save_interval: int = 2000
    output_dir: str = "outputs"

    # Device
    device: str = "cuda"


class TRMTrainer:
    """Trainer for TRM model with deep supervision."""

    def __init__(
        self,
        model: TRM,
        train_loader: DataLoader,
        val_loader: Optional[DataLoader] = None,
        config: Optional[TrainingConfig] = None,
    ):
        self.config = config or TrainingConfig()
        self.device = torch.device(self.config.device if torch.cuda.is_available() else "cpu")

        self.model = model.to(self.device)
        self.train_loader = train_loader
        self.val_loader = val_loader

        # Optimizer with weight decay
        self.optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=self.config.learning_rate,
            weight_decay=self.config.weight_decay,
            betas=(0.9, 0.95),
        )

        # Learning rate scheduler with warmup
        self.scheduler = self._create_scheduler()

        # EMA
        self.ema = EMA(
            self.model,
            decay=self.config.ema_decay,
            warmup_steps=self.config.ema_warmup_steps,
        )

        # Mixed precision
        self.scaler = GradScaler("cuda") if self.config.use_amp else None
        self.amp_dtype = getattr(torch, self.config.amp_dtype, torch.float32)

        # Training state
        self.global_step = 0
        self.epoch = 0
        self.best_val_acc = 0.0
        self.history = {"train_loss": [], "val_loss": [], "val_acc": [], "lr": []}

        # Output directory
        self.output_dir = Path(self.config.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _create_scheduler(self):
        """Create learning rate scheduler with warmup and cosine decay."""
        def lr_lambda(step):
            if step < self.config.warmup_steps:
                return step / self.config.warmup_steps
            # Cosine decay after warmup
            total_steps = len(self.train_loader) * self.config.epochs
            progress = (step - self.config.warmup_steps) / (total_steps - self.config.warmup_steps)
            return 0.5 * (1 + torch.cos(torch.tensor(progress * 3.14159)).item())

        return torch.optim.lr_scheduler.LambdaLR(self.optimizer, lr_lambda)

    def train_step(self, batch: Dict[str, torch.Tensor]) -> Dict[str, float]:
        """Single training step."""
        self.model.train()

        puzzles = batch["puzzle"].to(self.device)
        solutions = batch["solution"].to(self.device)

        self.optimizer.zero_grad()

        if self.config.use_amp:
            with autocast("cuda", dtype=self.amp_dtype):
                loss, logits, info = self.model.forward_with_supervision(puzzles, solutions)

            self.scaler.scale(loss).backward()
            self.scaler.unscale_(self.optimizer)
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.config.max_grad_norm)
            self.scaler.step(self.optimizer)
            self.scaler.update()
        else:
            loss, logits, info = self.model.forward_with_supervision(puzzles, solutions)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.config.max_grad_norm)
            self.optimizer.step()

        self.scheduler.step()
        self.ema.update()
        self.global_step += 1

        # Compute accuracy
        with torch.no_grad():
            preds = logits.argmax(dim=-1)
            cell_acc = (preds == solutions).float().mean().item()
            puzzle_acc = (preds == solutions).all(dim=-1).float().mean().item()

        return {
            "loss": loss.item(),
            "ce_loss": info["ce_loss"].item(),
            "act_loss": info["act_loss"].item() if info["act_loss"] is not None else 0.0,
            "cell_acc": cell_acc,
            "puzzle_acc": puzzle_acc,
            "lr": self.scheduler.get_last_lr()[0],
        }

    @torch.no_grad()
    def evaluate(self, loader: Optional[DataLoader] = None) -> Dict[str, float]:
        """Evaluate model on validation set using EMA weights."""
        loader = loader or self.val_loader
        if loader is None:
            return {}

        self.model.eval()
        total_loss = 0.0
        total_cell_correct = 0
        total_puzzle_correct = 0
        total_cells = 0
        total_puzzles = 0

        with self.ema.average_parameters():
            for batch in loader:
                puzzles = batch["puzzle"].to(self.device)
                solutions = batch["solution"].to(self.device)

                if self.config.use_amp:
                    with autocast("cuda", dtype=self.amp_dtype):
                        loss, logits, _ = self.model.forward_with_supervision(puzzles, solutions)
                else:
                    loss, logits, _ = self.model.forward_with_supervision(puzzles, solutions)

                preds = logits.argmax(dim=-1)

                total_loss += loss.item() * puzzles.shape[0]
                total_cell_correct += (preds == solutions).sum().item()
                total_puzzle_correct += (preds == solutions).all(dim=-1).sum().item()
                total_cells += puzzles.shape[0] * 81
                total_puzzles += puzzles.shape[0]

        return {
            "val_loss": total_loss / total_puzzles,
            "val_cell_acc": total_cell_correct / total_cells,
            "val_puzzle_acc": total_puzzle_correct / total_puzzles,
        }

    def train(self) -> Dict[str, Any]:
        """Main training loop."""
        print(f"Starting training on {self.device}")
        print(f"Model parameters: {self.model.count_parameters():,}")
        print(f"Training samples: {len(self.train_loader.dataset):,}")
        print(f"Batch size: {self.config.batch_size}")
        print(f"Total epochs: {self.config.epochs}")
        print(f"Steps per epoch: {len(self.train_loader)}")

        # Save config
        config_path = self.output_dir / "config.json"
        with open(config_path, "w") as f:
            json.dump(asdict(self.config), f, indent=2)

        start_time = time.time()
        running_loss = 0.0
        running_acc = 0.0

        for epoch in range(self.config.epochs):
            self.epoch = epoch
            epoch_loss = 0.0
            epoch_steps = 0

            pbar = tqdm(self.train_loader, desc=f"Epoch {epoch+1}/{self.config.epochs}")
            for batch in pbar:
                metrics = self.train_step(batch)
                running_loss = 0.9 * running_loss + 0.1 * metrics["loss"]
                running_acc = 0.9 * running_acc + 0.1 * metrics["puzzle_acc"]
                epoch_loss += metrics["loss"]
                epoch_steps += 1

                pbar.set_postfix({
                    "loss": f"{running_loss:.4f}",
                    "acc": f"{running_acc:.2%}",
                    "lr": f"{metrics['lr']:.2e}",
                })

                # Logging
                if self.global_step % self.config.log_interval == 0:
                    self.history["train_loss"].append(running_loss)
                    self.history["lr"].append(metrics["lr"])

                # Evaluation
                if self.global_step % self.config.eval_interval == 0:
                    val_metrics = self.evaluate()
                    if val_metrics:
                        self.history["val_loss"].append(val_metrics["val_loss"])
                        self.history["val_acc"].append(val_metrics["val_puzzle_acc"])
                        print(f"\nStep {self.global_step}: "
                              f"val_loss={val_metrics['val_loss']:.4f}, "
                              f"val_cell_acc={val_metrics['val_cell_acc']:.2%}, "
                              f"val_puzzle_acc={val_metrics['val_puzzle_acc']:.2%}")

                        # Save best model
                        if val_metrics["val_puzzle_acc"] > self.best_val_acc:
                            self.best_val_acc = val_metrics["val_puzzle_acc"]
                            self.save_checkpoint("best.pt")

                # Checkpointing
                if self.global_step % self.config.save_interval == 0:
                    self.save_checkpoint(f"step_{self.global_step}.pt")

            # End of epoch logging
            avg_epoch_loss = epoch_loss / epoch_steps
            elapsed = time.time() - start_time
            print(f"Epoch {epoch+1} complete: avg_loss={avg_epoch_loss:.4f}, "
                  f"elapsed={elapsed/60:.1f}min")

        # Final evaluation and save
        final_metrics = self.evaluate()
        self.save_checkpoint("final.pt")

        # Save training history
        history_path = self.output_dir / "history.json"
        with open(history_path, "w") as f:
            json.dump(self.history, f)

        total_time = time.time() - start_time
        print(f"\nTraining complete in {total_time/60:.1f} minutes")
        print(f"Best validation puzzle accuracy: {self.best_val_acc:.2%}")

        return {
            "final_metrics": final_metrics,
            "best_val_acc": self.best_val_acc,
            "total_time_minutes": total_time / 60,
        }

    def save_checkpoint(self, filename: str):
        """Save model checkpoint."""
        path = self.output_dir / filename
        checkpoint = {
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "scheduler_state_dict": self.scheduler.state_dict(),
            "ema_state_dict": self.ema.state_dict(),
            "global_step": self.global_step,
            "epoch": self.epoch,
            "best_val_acc": self.best_val_acc,
            "config": asdict(self.config),
        }
        torch.save(checkpoint, path)
        print(f"Saved checkpoint to {path}")

    def load_checkpoint(self, path: str):
        """Load model checkpoint."""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
        self.scheduler.load_state_dict(checkpoint["scheduler_state_dict"])
        self.ema.load_state_dict(checkpoint["ema_state_dict"])
        self.global_step = checkpoint["global_step"]
        self.epoch = checkpoint["epoch"]
        self.best_val_acc = checkpoint["best_val_acc"]
        print(f"Loaded checkpoint from {path}")
