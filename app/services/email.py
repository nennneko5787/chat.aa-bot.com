import os
from email.message import EmailMessage

import dotenv
from aiosmtplib import SMTP

dotenv.load_dotenv()


async def sendEMail(message: EmailMessage):
    smtp = SMTP(
        hostname=os.getenv("smtp_host"),
        port=os.getenv("smtp_port"),
        start_tls=True,
    )
    await smtp.connect()
    await smtp.login(os.getenv("smtp_user"), os.getenv("smtp_pass"))
    await smtp.send_message(message)
    await smtp.quit()
