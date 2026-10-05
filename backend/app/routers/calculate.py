from fastapi import APIRouter

from app.calculations.engine import calculate_scenario
from app.schemas import ScenarioInputs

router = APIRouter()


@router.post("")
async def calculate(payload: ScenarioInputs) -> dict:
    return calculate_scenario(payload)

