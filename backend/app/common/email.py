import structlog

from app.config import settings

logger = structlog.get_logger()


def _is_dev_mode() -> bool:
    """Check if we're in development mode (no real email sending)."""
    return not settings.RESEND_API_KEY or settings.RESEND_API_KEY in (
        "placeholder",
        "re_your_api_key",
    )


async def send_verification_email(
    to: str, token: str, base_url: str
) -> None:
    """Send a verification email to the user.

    In development mode (no RESEND_API_KEY), logs the verification
    URL to console instead of sending a real email.
    """
    verification_url = f"{base_url}/verify-email?token={token}"

    if _is_dev_mode():
        logger.info(
            "verification_email_dev",
            to=to,
            token=token,
            url=verification_url,
            message="DEV MODE: Copy the URL above to verify your email",
        )
        return

    import resend

    resend.api_key = settings.RESEND_API_KEY

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #13131f; color: #e2e8f0; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #1a1a2e; border-radius: 12px; padding: 40px; border: 1px solid #2a2a42;">
            <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0; color: #e2e8f0;">Verify your email</h1>
            <p style="color: #94a3b8; margin: 0 0 32px 0; font-size: 15px;">
                Thanks for signing up for Agencial. Click the button below to verify your email address.
            </p>
            <a href="{verification_url}" style="display: inline-block; background-color: oklch(0.75 0.15 195); color: #13131f; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Verify Email
            </a>
            <p style="color: #64748b; margin: 32px 0 0 0; font-size: 13px;">
                If you didn't create an account, you can safely ignore this email.
            </p>
            <p style="color: #64748b; margin: 8px 0 0 0; font-size: 13px;">
                This link expires in 24 hours.
            </p>
        </div>
    </body>
    </html>
    """

    resend.Emails.send(
        {
            "from": settings.EMAIL_FROM,
            "to": [to],
            "subject": "Verify your Agencial account",
            "html": html_body,
        }
    )
    logger.info("verification_email_sent", to=to)


async def send_reset_email(to: str, token: str, base_url: str) -> None:
    """Send a password reset email to the user.

    In development mode (no RESEND_API_KEY), logs the reset
    URL to console instead of sending a real email.
    """
    reset_url = f"{base_url}/reset-password?token={token}"

    if _is_dev_mode():
        logger.info(
            "reset_email_dev",
            to=to,
            token=token,
            url=reset_url,
            message="DEV MODE: Copy the URL above to reset your password",
        )
        return

    import resend

    resend.api_key = settings.RESEND_API_KEY

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #13131f; color: #e2e8f0; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #1a1a2e; border-radius: 12px; padding: 40px; border: 1px solid #2a2a42;">
            <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0; color: #e2e8f0;">Reset your password</h1>
            <p style="color: #94a3b8; margin: 0 0 32px 0; font-size: 15px;">
                We received a request to reset your Agencial password. Click the button below to choose a new password.
            </p>
            <a href="{reset_url}" style="display: inline-block; background-color: oklch(0.75 0.15 195); color: #13131f; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Reset Password
            </a>
            <p style="color: #64748b; margin: 32px 0 0 0; font-size: 13px;">
                If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #64748b; margin: 8px 0 0 0; font-size: 13px;">
                This link expires in 1 hour.
            </p>
        </div>
    </body>
    </html>
    """

    resend.Emails.send(
        {
            "from": settings.EMAIL_FROM,
            "to": [to],
            "subject": "Reset your Agencial password",
            "html": html_body,
        }
    )
    logger.info("reset_email_sent", to=to)
