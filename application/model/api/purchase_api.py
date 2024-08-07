from flask_restful import Resource
from flask import make_response
from ...model.models import Book, BookOrders, BookRequests
from ...model.db import db
from .api_helpers import NotFoundError, InternalError, ConflictError, AuthError
from application.controller.helper_functions import session_user
from datetime import datetime

class PurchaseApi(Resource):

    def post(self, book_id):
        user = session_user()
        if user is None:
            raise AuthError()

        try:
            db.session.query(Book).filter(Book.book_id == book_id).first()
        except:
            raise NotFoundError()


        if db.session.query(BookOrders).filter(BookOrders.user_id == user.user_id,
                                               BookOrders.book_id == book_id).count() > 0:
            raise ConflictError()

        try:
            db.session.add(BookOrders(user_id=user.user_id, book_id=book_id))
            req = db.session.query(BookRequests).filter(BookRequests.user_id == user.user_id,
                                                             BookRequests.book_id == book_id,
                                                             BookRequests.request_status == "Pending").first()
            if req is not None:
                req.request_status = "Rejected"

            req = db.session.query(BookRequests).filter(BookRequests.user_id == user.user_id,
                                                             BookRequests.book_id == book_id,
                                                             BookRequests.request_status == "Approved").first()
            if req is not None:
                req.request_status = "Revoked"
                req.due_date = datetime.now()

            db.session.commit()
            return make_response('', 201)
        except Exception as e:
            print(e)
            raise InternalError()
