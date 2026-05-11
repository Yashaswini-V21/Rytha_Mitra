from pydantic import BaseModel, Field
from typing import Optional

class RecommendRequest(BaseModel):
    district: str = Field(default="Raichur", description="Karnataka district name")
    land_acres: float = Field(default=2.0, ge=0.1, le=100.0, description="Total land in acres")
    temperature: float = Field(default=31.0)
    humidity: float = Field(default=62.0)
    rainfall: float = Field(default=92.0)
    ph: float = Field(default=6.7, ge=0.0, le=14.0)
    N: int = Field(default=82)
    P: int = Field(default=42)
    K: int = Field(default=38)
    input_costs: float = Field(default=18000.0)
    last_crop: Optional[str] = Field(default="")
    gender: Optional[str] = Field(default="female")

class SimulateRequest(BaseModel):
    N: int = Field(default=82)
    P: int = Field(default=42)
    K: int = Field(default=38)
    temperature: float = Field(default=31.0)
    humidity: float = Field(default=62.0)
    ph: float = Field(default=6.7)
    rainfall: float = Field(default=92.0)
    land_acres: float = Field(default=1.0)
    district: str = Field(default="Raichur")
