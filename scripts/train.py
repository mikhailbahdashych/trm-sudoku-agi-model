"""Training script for TRM on Sudoku puzzles."""

import argparse
import sys
from pathlib import Path

import yaml
import torch

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.model.trm import TRM
from src.data.dataset import create_dataloaders
from src.training.trainer import TRMTrainer, TrainingConfig


def load_config(config_path: str) -> dict:
    """Load configuration from YAML file."""
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def main():
    parser = argparse.ArgumentParser(description="Train TRM on Sudoku")
    parser.add_argument(
        "--config",
        type=str,
        default="configs/default.yaml",
        help="Path to config file",
    )
    parser.add_argument("--epochs", type=int, help="Override epochs")
    parser.add_argument("--batch-size", type=int, help="Override batch size")
    parser.add_argument("--lr", type=float, help="Override learning rate")
    parser.add_argument("--output-dir", type=str, help="Override output directory")
    parser.add_argument("--resume", type=str, help="Resume from checkpoint")
    args = parser.parse_args()

    # Load config
    config = load_config(args.config)

    # Build training config
    train_config = TrainingConfig(
        # Model
        hidden_dim=config["model"]["hidden_dim"],
        n_latent=config["model"]["n_latent"],
        T_deep=config["model"]["T_deep"],
        use_act=config["model"]["use_act"],
        # Training
        epochs=args.epochs or config["training"]["epochs"],
        batch_size=args.batch_size or config["training"]["batch_size"],
        learning_rate=args.lr or config["training"]["learning_rate"],
        weight_decay=config["training"]["weight_decay"],
        warmup_steps=config["training"]["warmup_steps"],
        max_grad_norm=config["training"]["max_grad_norm"],
        # Early stopping
        early_stopping=config["training"].get("early_stopping", True),
        early_stopping_patience=config["training"].get("early_stopping_patience", 15),
        early_stopping_min_delta=config["training"].get("early_stopping_min_delta", 0.001),
        # EMA
        ema_decay=config["training"]["ema_decay"],
        ema_warmup_steps=config["training"]["ema_warmup_steps"],
        # Mixed precision
        use_amp=config["training"]["use_amp"],
        amp_dtype=config["training"]["amp_dtype"],
        # Data
        train_samples=config["training"]["train_samples"],
        augmentations_per_sample=config["training"]["augmentations_per_sample"],
        # Logging
        log_interval=config["logging"]["log_interval"],
        eval_interval=config["logging"]["eval_interval"],
        save_interval=config["logging"]["save_interval"],
        output_dir=args.output_dir or config["logging"]["output_dir"],
        # Device
        device=config["device"],
    )

    print("=" * 60)
    print("TRM Training for Sudoku-Extreme")
    print("=" * 60)
    print(f"Config: {args.config}")
    print(f"Device: {train_config.device}")
    print(f"Epochs: {train_config.epochs}")
    print(f"Batch size: {train_config.batch_size}")
    print(f"Learning rate: {train_config.learning_rate}")
    print(f"Weight decay: {train_config.weight_decay}")
    print(f"Training samples: {train_config.train_samples}")
    print(f"Augmentations per sample: {train_config.augmentations_per_sample}")
    if train_config.early_stopping:
        print(f"Early stopping: patience={train_config.early_stopping_patience}, "
              f"min_delta={train_config.early_stopping_min_delta}")
    print("=" * 60)

    # Create dataloaders
    print("\nLoading data...")
    train_loader, val_loader = create_dataloaders(
        train_samples=train_config.train_samples,
        test_samples=config["data"].get("test_samples", 1000),  # Limit test set
        augmentations_per_sample=train_config.augmentations_per_sample,
        batch_size=train_config.batch_size,
        num_workers=config["data"]["num_workers"],
        seed=config["data"]["seed"],
        dataset_name=config["data"]["dataset_name"],
    )

    # Create model
    print("\nCreating model...")
    model = TRM(
        hidden_dim=train_config.hidden_dim,
        n_latent=train_config.n_latent,
        T_deep=train_config.T_deep,
        use_act=train_config.use_act,
    )
    print(f"Model parameters: {model.count_parameters():,}")

    # Create trainer
    trainer = TRMTrainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        config=train_config,
    )

    # Resume from checkpoint if specified
    if args.resume:
        print(f"\nResuming from checkpoint: {args.resume}")
        trainer.load_checkpoint(args.resume)

    # Train
    print("\nStarting training...")
    results = trainer.train()

    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    if results.get("stopped_early"):
        print(f"Early stopping triggered at epoch {results['final_epoch']}")
    print(f"Best validation loss: {results['best_val_loss']:.4f}")
    print(f"Best validation accuracy: {results['best_val_acc']:.2%}")
    print(f"Total time: {results['total_time_minutes']:.1f} minutes")
    print(f"Checkpoints saved to: {train_config.output_dir}")


if __name__ == "__main__":
    main()
