"""
Model factory for creating various architectures.
"""

import torch.nn as nn
from torchvision import models


def create_model(architecture: str, num_classes: int = 1000, pretrained: bool = False) -> nn.Module:
    """
    Create model based on architecture name.
    
    Args:
        architecture: Model architecture name (e.g., 'resnet50', 'efficientnet_b0')
        num_classes: Number of output classes
        pretrained: Whether to load pretrained weights
        
    Returns:
        PyTorch model
    """
    if architecture == "resnet18":
        model = models.resnet18(pretrained=pretrained)
        if num_classes != 1000:
            model.fc = nn.Linear(model.fc.in_features, num_classes)
            
    elif architecture == "resnet50":
        model = models.resnet50(pretrained=pretrained)
        if num_classes != 1000:
            model.fc = nn.Linear(model.fc.in_features, num_classes)
            
    elif architecture == "resnet101":
        model = models.resnet101(pretrained=pretrained)
        if num_classes != 1000:
            model.fc = nn.Linear(model.fc.in_features, num_classes)
            
    elif architecture == "efficientnet_b0":
        model = models.efficientnet_b0(pretrained=pretrained)
        if num_classes != 1000:
            model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
            
    elif architecture == "efficientnet_b4":
        model = models.efficientnet_b4(pretrained=pretrained)
        if num_classes != 1000:
            model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
            
    elif architecture == "vit_b_16":
        model = models.vit_b_16(pretrained=pretrained)
        if num_classes != 1000:
            model.heads.head = nn.Linear(model.heads.head.in_features, num_classes)
            
    else:
        raise ValueError(f"Unsupported architecture: {architecture}")
    
    return model


__all__ = ['create_model']
