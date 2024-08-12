from flask import render_template, abort, current_app as app, redirect
from .helper_functions import session_user
from .cronjobs import check_user_due_dates, daily_reminder
from datetime import datetime
from ..model.db import db


@app.route('/')
def user_home():
    user = session_user()
    if user is not None:
        if user.user_type == 'Admin':
            return redirect('/admin')
        else:
            user.last_login = datetime.now()
            db.session.commit()
            check_user_due_dates(user.user_id)
            return render_template("user_home.html", isLoggedIn="true", username=user.user_name)
    else:
        return render_template("user_home.html", isLoggedIn="false")


@app.route('/readbook/<int:book_id>')
def read_book(book_id):
    user = session_user()
    if user is None:
        return abort(404, description="Resource not found")

    my_reqs = user.my_requests
    for req in my_reqs:
        if req.request_status == "Approved" and req.book_id == book_id:
            return render_template("read_book.html", book_id=book_id)

    my_books = user.my_owned_books
    for book in my_books:
        if book.book_id == book_id:
            return render_template("read_book.html", book_id=book_id)

    if user.user_type == 'Admin':
        return render_template("read_book.html", book_id=book_id)

    return abort(404, description="Resource not found")