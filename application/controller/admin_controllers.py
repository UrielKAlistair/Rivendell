from flask import render_template, request, current_app as app
from .helper_functions import only_admins, session_user
from ..model.db import db
from ..model.models import User, BookRequests, Book, Section
import datetime as dt


@app.route("/admin")
@only_admins
def admin_home():
    return render_template("admin_home.html", username=session_user().user_name)


@app.route("/adminstats", methods=["POST"])
@only_admins
def admin_stats():
    # find number of active users ( last login less than 7 days ago) and total no of non admin users
    # also show no of active requests (status is approved)
    # make a pie chart of genres of books borrowed (from bookrequests table, from last x days; keep x as a parameter)

    active_user_count = db.session.query(User).filter(
        User.last_login > (dt.datetime.now() - dt.timedelta(days=7))).count()
    total_user_count = db.session.query(User).filter(User.user_type != "Admin").count()
    active_req_count = db.session.query(BookRequests).filter(BookRequests.request_status == "Approved").count()

    pie_days = request.form.get("pie_days")
    if pie_days is None:
        pie_days = 30
    last_x_day_requests = db.session.query(BookRequests).filter(
        BookRequests.date_of_request > (dt.datetime.now() - dt.timedelta(days=pie_days))).all()
    genre_counts = {}
    for req in last_x_day_requests:
        if req.book.section.section_name in genre_counts:
            genre_counts[req.book.section.section_name] += 1
        else:
            genre_counts[req.book.section.section_name] = 1

    repacked_data = {'labels': [],
                     'datasets': [{
                         "label": "Books Borrowed",
                         "data": [],
                         "hoverOffset": 4
                     }]}
    for i in genre_counts:
        repacked_data["labels"].append(i)
        repacked_data["datasets"][0]["data"].append(genre_counts[i])

    return {"active_user_count": active_user_count, "total_user_count": total_user_count,
            "active_req_count": active_req_count, "genre_counts": repacked_data}


@app.route("/getgenrestats", methods=["POST"])
@only_admins
def get_genre_stats():
    # get the number of books borrowed in the genre sent by the post request in the past x days, also specified by the request.
    genre = request.form["genre"]
    days = request.form["days"]
    data = []
    today = dt.datetime(dt.datetime.today().year, dt.datetime.today().month, dt.datetime.today().day)
    for day in range(int(days) - 1, -1, -1):
        date = today - dt.timedelta(days=day)
        count = db.session.query(BookRequests).join(Book).join(Section).filter(BookRequests.date_of_request >= date,
                                                                               BookRequests.date_of_request < date + dt.timedelta(days=1),
                                                                               Section.section_name == genre).count()
        data.append(count)
    return data
