from .workers import celery
from ..model.db import db
from ..model.models import BookRequests
from datetime import datetime
from celery.schedules import crontab
from .mail_subroutine import send_mail
from ..model.models import User
from flask import render_template
@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(crontab(hour=18, minute=30), check_due_dates.s(), name='Check due dates every day')
    # midnight IST, 6:30 PM GMT
    sender.add_periodic_task(crontab(hour=12, minute=0), daily_reminder.s(), name='Send daily reminder every evening')
    # 5:30 PM IST, 12:00 GMT
    sender.add_periodic_task(crontab(hour=19, minute=30, day_of_month=1), monthly_report.s(), name='Send monthly report every month')
@celery.task()
def check_due_dates():
    reqs = db.session.query(BookRequests).filter(BookRequests.request_status == "Approved").all()
    for req in reqs:
        if req.due_date < datetime.now():
            req.request_status = "Revoked"
            req.due_date = datetime.now()
    db.session.commit()
    return True

@celery.task()
def check_user_due_dates(user_id):
    reqs = db.session.query(BookRequests).filter(BookRequests.user_id == user_id, BookRequests.request_status == "Approved").all()
    for req in reqs:
        if req.due_date < datetime.now():
            req.request_status = "Revoked"
            req.due_date = datetime.now()
    db.session.commit()
    return True

@celery.task()
def daily_reminder():
    # send reminder to all non-admin users
    users = db.session.query(User).filter(User.user_type != "Admin").all()
    for user in users:
        login_alert = False
        if user.last_login < datetime.today():
            login_alert = True

        due_books = []
        reqs = db.session.query(BookRequests).filter(BookRequests.user_id == user.user_id, BookRequests.request_status == "Approved").all()
        for req in reqs:
            if (req.due_date - datetime.now()).days < 3:
                due_books.append([req.book.book_name, (req.due_date-datetime.now()).days, (req.due_date-datetime.now()).seconds // 3600])
        due_flag = False
        if len(due_books)>0:
            due_flag = True

        if due_flag or login_alert:
            content = render_template('daily_reminder.html', login_alert=login_alert, due_flag=due_flag, due_books=due_books, username=user.user_name)
            send_mail(user.user_email, "Daily Reminder", content)
@celery.task()
def monthly_report():
    # send report to the librarian
    librarian = db.session.query(User).filter(User.user_type == "Admin").first()
    with open('./application/view/templates/monthly_report.html', 'r') as file:
        content = file.read()
        send_mail(librarian.user_email, "Monthly Report", content)