from fastapi import APIRouter, Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.calculations.engine import calculate_scenario
from app.config import settings
from app.database import get_session
from app.models import Scenario, User
from app.schemas import ScenarioCreate, ScenarioRead

router = APIRouter()


async def get_current_user(
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        claims = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user = await session.get(User, claims.get("sub"))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user


@router.get("", response_model=list[ScenarioRead])
async def list_scenarios(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ScenarioRead]:
    rows = await session.scalars(select(Scenario).where(Scenario.user_id == user.id).order_by(Scenario.updated_at.desc()))
    return [
        ScenarioRead(
            id=row.id,
            name=row.name,
            destination_country=row.destination_country,
            tax_year=row.tax_year,
            inputs=row.inputs,
            calculation_snapshot=row.calculation_snapshot,
        )
        for row in rows
    ]


@router.post("", response_model=ScenarioRead)
async def create_scenario(
    payload: ScenarioCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ScenarioRead:
    snapshot = calculate_scenario(payload.inputs)
    scenario = Scenario(
        user_id=user.id,
        name=payload.name,
        destination_country=payload.inputs.destination_country,
        tax_year=2026,
        inputs=payload.inputs.model_dump(),
        calculation_snapshot=snapshot,
    )
    session.add(scenario)
    await session.commit()
    await session.refresh(scenario)
    return ScenarioRead(
        id=scenario.id,
        name=scenario.name,
        destination_country=scenario.destination_country,
        tax_year=scenario.tax_year,
        inputs=scenario.inputs,
        calculation_snapshot=scenario.calculation_snapshot,
    )

