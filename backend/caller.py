# Everything about making phone calls lives here.
# To switch to Africa's Talking later, only this file changes.

import os

from twilio.rest import Client


def place_call(to_number: str, risk_level: str) -> str:
    """Rings to_number. Returns Twilio's call id.

    The trial only accepts To, From and Url, exactly like the Twilio console.
    So the instructions (which audio to play) live in a TwiML Bin on Twilio,
    and we just send the Bin's link.
    """
    client = Client(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])

    call = client.calls.create(
        to=to_number,
        from_=os.environ["TWILIO_FROM_NUMBER"],
        url=os.environ["TWILIO_TWIML_BIN_URL"],
    )
    return call.sid
