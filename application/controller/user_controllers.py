from flask import render_template, current_app as app, redirect
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
