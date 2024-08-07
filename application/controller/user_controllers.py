from flask import render_template, current_app as app, redirect
from .helper_functions import session_user

@app.route('/')
def user_home():
    user = session_user()

    if user is not None:
        if user.user_type == 'Admin' or user.user_type == 'God':
            return redirect('/admin')
        else:
            return render_template("user_home.html", isLoggedIn="true", username=user.user_name, uid=user.user_id)
    else:
        return render_template("user_home.html", isLoggedIn="false", uid=-1)
