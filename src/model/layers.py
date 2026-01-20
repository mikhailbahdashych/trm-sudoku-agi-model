"""Custom layers for TRM: RMSNorm and SwiGLU."""

import torch
import torch.nn as nn
import torch.nn.functional as F


class RMSNorm(nn.Module):
    """Root Mean Square Layer Normalization.

    RMSNorm normalizes using only the root mean square, without centering.
    This is more efficient than LayerNorm and works well in transformers.
    No bias term as per the paper specification.
    """

    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        rms = torch.sqrt(torch.mean(x ** 2, dim=-1, keepdim=True) + self.eps)
        x_normed = x / rms
        return self.weight * x_normed


class SwiGLU(nn.Module):
    """SwiGLU activation function with gated linear unit.

    SwiGLU(x) = (xW1) * swish(xV) where swish(x) = x * sigmoid(x)

    This is a gated variant that provides better gradient flow than ReLU/GELU.
    The hidden dimension is expanded by a factor (typically 8/3 to maintain param count).
    """

    def __init__(self, in_features: int, hidden_features: int = None, out_features: int = None):
        super().__init__()
        out_features = out_features or in_features
        hidden_features = hidden_features or int(in_features * 8 / 3)
        # Round to multiple of 64 for efficiency
        hidden_features = ((hidden_features + 63) // 64) * 64

        self.w1 = nn.Linear(in_features, hidden_features, bias=False)
        self.w2 = nn.Linear(hidden_features, out_features, bias=False)
        self.w3 = nn.Linear(in_features, hidden_features, bias=False)  # Gate projection

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # SwiGLU: (x @ W1) * swish(x @ W3), then project back
        return self.w2(F.silu(self.w1(x)) * self.w3(x))


class MLPBlock(nn.Module):
    """MLP block with RMSNorm and SwiGLU.

    Structure: RMSNorm -> SwiGLU -> residual connection
    """

    def __init__(self, dim: int, mlp_ratio: float = 8/3):
        super().__init__()
        self.norm = RMSNorm(dim)
        hidden_dim = int(dim * mlp_ratio)
        self.mlp = SwiGLU(dim, hidden_dim, dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.mlp(self.norm(x))
