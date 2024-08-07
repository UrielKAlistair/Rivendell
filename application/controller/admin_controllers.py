from flask import render_template, current_app as app
from .helper_functions import only_admins, session_user


@app.route("/admin")
@only_admins
def admin_home():
    return render_template("admin_home.html", username=session_user().user_name)
