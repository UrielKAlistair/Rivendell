from flask_restful import Resource, marshal_with, fields, reqparse
from ...model.models import Book, BookRequests, BookOrders
from ...model.db import db
from flask import make_response, request
from .api_helpers import NotFoundError, InternalError, AuthError, ForbiddenError
from application.controller.helper_functions import session_user, only_admins
from datetime import datetime, timedelta
import json


# "/api/bookrequest/<int:book_id>") Request a book
class BookRequestApi(Resource):
    max_book_count = 5

    # Make a request for a book with a given book_id
    def post(self, book_id):

        user = session_user()
        if user is None:
            raise AuthError()

        try:
            db.session.query(Book).filter(Book.book_id == book_id).first()
        except:
            raise NotFoundError()

        if db.session.query(BookRequests).filter(
                BookRequests.user_id == user.user_id,
                (BookRequests.request_status == "Pending") | (
                        BookRequests.request_status == "Approved")).count() >= BookRequestApi.max_book_count:
            raise ForbiddenError()

        if db.session.query(BookRequests).filter(BookRequests.user_id == user.user_id,
                                                 BookRequests.book_id == book_id,
                                                 (BookRequests.request_status == "Pending") | (
                                                         BookRequests.request_status == "Approved")).count() > 0:
            raise ForbiddenError()

        if db.session.query(BookOrders).filter(BookOrders.user_id == user.user_id,
                                               BookOrders.book_id == book_id).count() > 0:
            raise ForbiddenError()

        try:
            db.session.add(BookRequests(user_id=user.user_id, book_id=book_id, approval_status=False,
                                        date_of_request=datetime.now()))
            db.session.commit()
            return make_response('', 201)
        except:
            raise InternalError()


# "/api/cancelrequest/<int:req_id>") Cancel a request
class CancelRequestApi(Resource):

    # Cancel a request for a book with a given book_id
    def post(self, req_id):

        user = session_user()
        if user is None:
            raise AuthError()

        try:
            req = db.session.query(BookRequests).filter(BookRequests.order_id == req_id)
        except:
            raise InternalError()

        if req.count() == 0:
            raise NotFoundError()

        try:
            req.delete()
            db.session.commit()
            return make_response('', 204)
        except:
            raise InternalError()


# "/api/returnbook/<int:req_id>" Return a book
class ReturnBookApi(Resource):

    def post(self, req_id):
        try:
            req = db.session.query(BookRequests).filter(BookRequests.order_id == req_id).first()
        except:
            raise InternalError()

        if req is None:
            raise NotFoundError()

        try:
            req.request_status = "Archived"
            req.due_date = datetime.now()
            db.session.commit()
            return make_response('', 204)
        except:
            raise InternalError()


pending_reqs_json = {"user_name": fields.String,
                 "book_name": fields.String,
                 "req_id": fields.Integer,
                 "date_of_request": fields.DateTime
                 }


# "/api/pendingreqs" Get all requests from all users that are waiting approval
class PendingReqsApi(Resource):

    @marshal_with(pending_reqs_json)
    @only_admins
    def get(self):
        try:
            reqs = db.session.query(BookRequests).filter(BookRequests.request_status == "Pending").all()
            out = []
            for req in reqs:
                out.append({"user_name": req.user.user_name,
                            'book_name': req.book.book_name,
                            'req_id': req.order_id,
                            'date_of_request': req.date_of_request})
            return out, 200
        except Exception as e:
            print(e)
            raise InternalError()

active_reqs_json = {"user_name": fields.String,
                 "book_name": fields.String,
                 "req_id": fields.Integer,
                 "date_of_request": fields.DateTime,
                 "date_of_issue": fields.DateTime,
                 "due_date": fields.DateTime
                 }

# "/api/activereqs" Get all requests from all users that are currently active
class ActiveReqsApi(Resource):

    @marshal_with(active_reqs_json)
    @only_admins
    def get(self):
        try:
            reqs = db.session.query(BookRequests).filter(BookRequests.request_status == "Approved").all()
            out = []
            for req in reqs:
                out.append({"user_name": req.user.user_name,
                            'book_name': req.book.book_name,
                            'req_id': req.order_id,
                            'date_of_request': req.date_of_request,
                            'date_of_issue': req.date_of_issue,
                            'due_date': req.due_date})
            return out, 200
        except Exception as e:
            print(e)
            raise InternalError()


# "/api/approve/<int:time>"  Approve a json of many requests for n days
class ApproveReqApi(Resource):

    @only_admins
    def post(self, time):
        args = json.loads(request.get_data())
        for entry in args:
            try:
                req = db.session.query(BookRequests).filter(BookRequests.order_id == entry['req_id']).first()
            except Exception as e:
                print("fetch fail", e)
                raise InternalError()

            if req is None:
                raise NotFoundError()
            else:
                req.request_status = "Approved"
                req.date_of_issue = datetime.now()
                req.due_date = datetime.now() + timedelta(days=time)

        try:
            db.session.commit()
        except Exception as e:
            raise InternalError()

        return make_response('', 204)


# "/api/reject" Reject a json of many requests
class RejectReqApi(Resource):

    # Reject an array of requests passed as the post body
    @only_admins
    def post(self):
        args = json.loads(request.get_data())
        for entry in args:
            try:
                req = db.session.query(BookRequests).filter(BookRequests.order_id == entry['req_id']).first()
            except:
                raise InternalError()

            if req is None:
                raise NotFoundError()
            else:
                req.request_status = "Rejected"

        try:
            db.session.commit()
        except:
            raise InternalError()

        return make_response('', 204)


# "/api/revoke" Revoke a json of many requests
class RevokeReqApi(Resource):

    @only_admins
    def post(self):
        args = json.loads(request.get_data())
        for entry in args:
            try:
                req = db.session.query(BookRequests).filter(BookRequests.order_id == entry['req_id']).first()
            except:
                raise InternalError()

            if req is None:
                raise NotFoundError()
            else:
                req.request_status = "Revoked"
                req.due_date = datetime.now()

        try:
            db.session.commit()
        except:
            raise InternalError()

        return make_response('', 204)
