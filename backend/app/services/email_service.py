import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings


class EmailService:
    """Service class for sending emails via SMTP."""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
    
    def _create_message(self, to_email: str, subject: str, body: str) -> MIMEMultipart:
        """
        Create an email message.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body content
        
        Returns:
            MIMEMultipart message object
        """
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = self.from_email
        message["To"] = to_email
        
        text_part = MIMEText(body, "plain")
        message.attach(text_part)
        
        return message
    
    def send_email(self, to_email: str, subject: str, body: str) -> bool:
        """
        Send an email via SMTP.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body content
        
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.smtp_user or not self.smtp_password:
            # If SMTP credentials are not configured, log and return False
            print(f"SMTP not configured. Would send email to {to_email} with subject: {subject}")
            return False
        
        try:
            message = self._create_message(to_email, subject, body)
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)
            
            return True
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
    
    def send_otp_email(self, to_email: str, otp_code: str) -> bool:
        """
        Send an OTP verification email.
        
        Args:
            to_email: Recipient email address
            otp_code: The OTP code to send
        
        Returns:
            True if email sent successfully, False otherwise
        """
        subject = "Kuantra - Email Verification Code"
        otp_expire_minutes = int(getattr(settings, "OTP_EXPIRE_MINUTES", 10))
        body = f"""
Hello,

Thank you for signing up for Kuantra!

Your email verification code is: {otp_code}

This code will expire in {otp_expire_minutes} minutes.

If you didn't request this code, please ignore this email.

Best regards,
Kuantra Team
"""
        return self.send_email(to_email, subject, body)


# Create a singleton instance
email_service = EmailService()
