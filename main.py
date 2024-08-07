import flask
from application.model.db import db
from flask import Flask
from os import path
from application.controller import workers

host_ip = '0.0.0.0'
port = 5050
pwd = path.abspath(path.dirname(__file__))
app = Flask(__name__, template_folder=pwd + '/application/view/templates',
            static_folder=pwd + '/application/view/static')
app.app_context().push()

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + pwd + '/application/model/database.sqlite3'
app.config["SECRET_KEY"] = "replacethislaterplease"
app.config["CELERY_BROKER_URL"] = "redis://localhost:6379/1"
app.config["CELERY_RESULT_BACKEND"] = "redis://localhost:6379/2"
db.init_app(app)

celery = workers.celery
celery.conf.update(
    broker_url=app.config["CELERY_BROKER_URL"],
    result_backend=app.config["CELERY_RESULT_BACKEND"]
)
celery.Task = workers.ContextTask

from application.controller.login_controllers import login, register
from application.controller.login_api import validate_login
from application.controller import user_controllers, admin_controllers
from application.model.api import api_helpers, section_api, book_api, book_request_api, purchase_api

# Admin
api_helpers.api.add_resource(section_api.SectionApi, '/api/addsection',
                             '/api/section/<int:section_id>')  # CRUD on Section
api_helpers.api.add_resource(book_api.BookApi, '/api/book/<int:book_id>', '/api/addbook/<int:sec_id>')  # CRUD on Book

api_helpers.api.add_resource(book_request_api.PendingReqsApi,
                             "/api/pendingreqs")  # Get all requests from all users that are waiting approval
api_helpers.api.add_resource(book_request_api.ActiveReqsApi,
                             "/api/activereqs")  # Get all requests from all users that are currently active
api_helpers.api.add_resource(book_request_api.ApproveReqApi,
                             "/api/approve/<int:time>")  # Approve a json of many requests for n days
api_helpers.api.add_resource(book_request_api.RejectReqApi, "/api/reject")  # Reject a json of many requests
api_helpers.api.add_resource(book_request_api.RevokeReqApi, "/api/revoke")  # Revoke a json of many requests

# User
api_helpers.api.add_resource(section_api.UserSectionsApi, '/api/sections')  # All books from all sections for home
api_helpers.api.add_resource(book_request_api.BookRequestApi, "/api/bookrequest/<int:book_id>")  # Request a book
api_helpers.api.add_resource(book_request_api.CancelRequestApi, "/api/cancelrequest/<int:req_id>")  # Cancel a request
api_helpers.api.add_resource(book_request_api.ReturnBookApi, "/api/returnbook/<int:req_id>")  # Return a book
api_helpers.api.add_resource(purchase_api.PurchaseApi, "/api/purchase/<int:book_id>")  # Purchase a book

api_helpers.api.add_resource(book_api.MyReqBooksApi, "/api/myreqbooks")
api_helpers.api.add_resource(book_api.OwnedBooksApi, "/api/myownedbooks")
api_helpers.api.add_resource(book_api.MyPastReqsApi, "/api/mypastreqs")

from application.controller.misc_controllers import error_404

app.register_error_handler(404, error_404)

if __name__ == '__main__':
    app.run()
