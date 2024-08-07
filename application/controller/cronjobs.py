from workers import celery
from ..model.db import db
from ..model.models import BookRequests
from datetime import datetime


@celery.task()
def check_due_dates():
    # Get all the requests that are not archived
    reqs = db.session.query(BookRequests).filter(BookRequests.request_status == "Approved").all()
    for req in reqs:
        if req.due_date < datetime.now():
            req.request_status = "Revoked"
            req.due_date = datetime.now()
    db.session.commit()
    return True
