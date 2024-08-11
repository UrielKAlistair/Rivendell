import re

from flask import request, session, make_response, current_app as app
from ..model.db import db
from ..model.models import User
from werkzeug.security import check_password_hash, generate_password_hash
from base64 import b64encode, b64decode
from .helper_functions import only_logged_in


def isemail(email):
    regex = r'^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$'
    return bool(re.match(regex, email))


def authenticate_login(username, password):
    user = db.session.query(User).filter_by(user_name=username).first()
    if user is None:
        user = db.session.query(User).filter_by(user_email=username.lower()).first()

    if user is None:
        return None
    elif check_password_hash(
            "pbkdf2:sha256$" + user.password_salt + "$" + str(b64encode(user.user_password))[2:-1], password):
        return user.user_id
    else:
        return False


@app.route("/validate_login", methods=["POST"])
def validate_login():
    uname = request.form["username"]
    password = request.form["password"]
    auth = authenticate_login(uname, password)
    if auth is None:
        return {"error": 'User not Found.'}
    elif not auth:
        return {"error": 'Password incorrect.'}
    else:
        session['user'] = auth
        return {}


@app.route("/register_user", methods=["POST"])
def register_user():
    uname = request.form["username"]
    email = request.form["email"]
    password = request.form["password"]
    if isemail(uname):
        return {"error": 'uname_mail'}
    if not isemail(email):
        return {"error": 'invalid_email'}
    if db.session.query(User).filter_by(user_email=email).first() is not None:
        return {"error": 'email_taken'}
    elif db.session.query(User).filter_by(user_name=uname).first() is not None:
        return {"error": 'uname_taken'}
    else:
        _, salt, pwd_hash = generate_password_hash(password, method="pbkdf2:sha256", salt_length=16).split("$")
        pwd_hash = b64decode(pwd_hash)  # Convert string hash of password into a binary string for efficient storage
        user = User(uname, pwd_hash, salt, email.lower(), "User")

        db.session.add(user)
        db.session.commit()

        return {}


@app.route('/isloggedin', methods=["POST"])
def is_logged_in():
    try:
        return make_response('', 200) if session['user'] else make_response('', 401)
    except KeyError:
        return make_response('', 401)


@app.route('/updateprofile', methods=["POST"])
@only_logged_in
def update_details():
    user = db.session.query(User).filter_by(user_id=session['user']).first()
    uname = request.form["username"]
    email = request.form["email"]
    old_password = request.form["old_password"]
    new_password = request.form["new_password"]
    if not authenticate_login(user.user_name, old_password):
        return {"error": 'incorrect_password'}
    if not isemail(email):
        return {"error": 'invalid_email'}
    if isemail(uname):
        return {"error": 'uname_mail'}
    mail_query = db.session.query(User).filter(User.user_email == email)
    if mail_query is not None:
        if mail_query.first().user_id != user.user_id or mail_query.count() > 1:
            return {"error": 'email_taken'}

    uname_query = db.session.query(User).filter(User.user_name == uname)
    if uname_query is not None:
        if uname_query.first().user_id != user.user_id or uname_query.count() > 1:
            return {"error": 'uname_taken'}

    _, salt, pwd_hash = generate_password_hash(new_password, method="pbkdf2:sha256", salt_length=16).split("$")
    pwd_hash = b64decode(pwd_hash)
    db.session.query(User).filter(User.user_id == user.user_id).update(
        {"user_name": uname, "user_email": email, "user_password": pwd_hash, "password_salt": salt})
    return {}


@app.route('/settings', methods=['POST'])
def settings_api():
    user = db.session.query(User).filter_by(user_id=session['user']).first()
    return {"username": user.user_name, "email": user.user_email}
