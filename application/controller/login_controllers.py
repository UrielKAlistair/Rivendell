from flask import current_app as app, render_template, session, redirect
from .helper_functions import session_user

@app.route('/register')
def register():
    return render_template("register.html")


@app.route('/login')
def login():
    if session_user():
        return redirect("/", code=302)

    return render_template("login.html")


@app.route('/logout')
def logout():
    try:
        del session['user']
    except KeyError:
        pass
    return redirect("/", code=302)