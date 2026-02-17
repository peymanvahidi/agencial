from pydantic import BaseModel, Field, field_validator


class UserProfileResponse(BaseModel):
    """Response schema for user profile data."""

    id: str
    email: str
    display_name: str | None = None
    image_url: str | None = None
    auth_provider: str

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    """Request schema for updating user profile."""

    display_name: str | None = Field(None, min_length=2, max_length=100)


class PreferencesResponse(BaseModel):
    """Response schema for user preferences."""

    theme: str
    default_timeframe: str
    timezone: str

    model_config = {"from_attributes": True}


VALID_THEMES = {"dark", "light"}
VALID_TIMEFRAMES = {"1m", "5m", "15m", "30m", "1H", "4H", "D", "W", "M"}


class PreferencesUpdate(BaseModel):
    """Request schema for updating user preferences (PATCH semantics)."""

    theme: str | None = None
    default_timeframe: str | None = None
    timezone: str | None = None

    @field_validator("theme")
    @classmethod
    def validate_theme(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_THEMES:
            raise ValueError(f"theme must be one of: {', '.join(sorted(VALID_THEMES))}")
        return v

    @field_validator("default_timeframe")
    @classmethod
    def validate_timeframe(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_TIMEFRAMES:
            raise ValueError(
                f"default_timeframe must be one of: {', '.join(sorted(VALID_TIMEFRAMES))}"
            )
        return v

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        # Validate IANA timezone string
        import zoneinfo

        try:
            zoneinfo.ZoneInfo(v)
        except (KeyError, zoneinfo.ZoneInfoNotFoundError):
            raise ValueError(f"Invalid IANA timezone: {v}")
        return v
