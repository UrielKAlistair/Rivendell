import re

from flask import request, session, current_app as app
from ..model.db import db
from ..model.models import User
from werkzeug.security import check_password_hash, generate_password_hash
from base64 import b64encode,b64decode


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
