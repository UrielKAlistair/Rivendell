from copy import deepcopy
from flask_restful import Resource, marshal_with, fields, reqparse
from flask_sqlalchemy import query
from flask import make_response, request
from ...model.models import Book, BookRequests, BookOrders, Section
from ...model.db import db
from .api_helpers import NotFoundError, InternalError, BadRequestError, ConflictError, AuthError
from base64 import b64encode, b64decode
from application.controller.helper_functions import only_admins, session_user

book_json = {"book_id": fields.Integer,
             "book_name": fields.String,
             "book_price": fields.Float,
             "book_image": fields.String,
             "book_rating": fields.Float,
             "book_author": fields.String}

book_req_parser = reqparse.RequestParser()
book_req_parser.add_argument("book_name", type=str)
book_req_parser.add_argument("book_price", type=float)
book_req_parser.add_argument("book_image", type=str)
book_req_parser.add_argument("book_rating", type=float)
book_req_parser.add_argument("book_author", type=str)

book_edit_req_parser = reqparse.RequestParser()
book_edit_req_parser.add_argument("book_name", type=str)
book_edit_req_parser.add_argument("book_price", type=float)
book_edit_req_parser.add_argument("book_rating", type=float)
book_edit_req_parser.add_argument("book_author", type=str)
book_edit_req_parser.add_argument("book_image", type=str)
book_edit_req_parser.add_argument("section_name", type=str)

my_book_json = {"book_id": fields.Integer,
                "book_name": fields.String,
                "book_price": fields.Float,
                "book_image": fields.String,
                "book_rating": fields.Float,
                "book_author": fields.String,
                "request_status": fields.String,
                "date_of_request": fields.DateTime,
                "date_of_issue": fields.DateTime,
                "due_date": fields.DateTime,
                "req_id": fields.Integer
                }


class MyReqBooksApi(Resource):

    @marshal_with(my_book_json)
    def get(self):
        user = session_user()
        if user is None:
            raise AuthError()

        try:
            reqs = db.session.query(BookRequests).filter(BookRequests.user_id == user.user_id,
                                                         (BookRequests.request_status == "Pending") | (
                                                                 BookRequests.request_status == "Approved")).all()
            books = []
            for req in reqs:
                book = req.book
                try:
                    book.book_image = b64encode(b64decode(book.book_image)).decode('utf-8')
                except:
                    pass
                book.request_status = req.request_status
                book.date_of_request = req.date_of_request
                book.date_of_issue = req.date_of_issue
                book.due_date = req.due_date
                book.req_id = req.order_id
                books.append(book)
        except Exception as e:
            print(e)
            raise InternalError()
        return books, 200


class MyPastReqsApi(Resource):

    @marshal_with(my_book_json)
    def get(self):
        user = session_user()
        if user is None:
            raise AuthError()

        try:
            reqs = db.session.query(BookRequests).filter(BookRequests.user_id == user.user_id,
                                                         (BookRequests.request_status == "Archived") | (
                                                                 BookRequests.request_status == "Rejected") | (
                                                                 BookRequests.request_status == "Revoked")).all()
            books = []
            for req in reqs:
                book = deepcopy(req.book)
                book.request_status = req.request_status
                book.date_of_request = req.date_of_request
                book.date_of_issue = req.date_of_issue
                book.due_date = req.due_date
                book.req_id = req.order_id

                books.append(book)
        except Exception as e:
            print(e)
            raise InternalError()
        return books, 200


class OwnedBooksApi(Resource):

    @marshal_with(book_json)
    def get(self):
        user = session_user()
        if user is None:
            raise AuthError()

        try:
            reqs = db.session.query(BookOrders).filter(BookOrders.user_id == user.user_id).all()
            books = []
            for req in reqs:
                book = req.book
                try:
                    book.book_image = b64encode(b64decode(book.book_image)).decode('utf-8')
                except:
                    pass
                books.append(book)
        except Exception as e:
            print(e)
            raise InternalError()
        return books, 200


class BookApi(Resource):

    # Get details about a book with a given book_id
    @marshal_with(book_json)
    def get(self, book_id):
        try:
            book_info = db.session.query(Book).filter(Book.book_id == book_id).first()
        except:
            raise InternalError()

        # Since the first() call is made, an empty Query results in a None object.
        if book_info is None:
            raise NotFoundError()
        else:
            book_info.book_image = b64encode(b64decode(book_info.book_image)).decode('utf-8')
            return book_info, 200

    # Update the details of a book with a given book_id
    @marshal_with(book_json)
    @only_admins
    def put(self, book_id):
        args = book_edit_req_parser.parse_args()

        if args["book_name"] is None:
            raise BadRequestError('PDT001', 'Book Name is required')
        elif args["book_price"] is None:
            raise BadRequestError('PDT002', 'Book Price is required')
        elif args["book_rating"] is None:
            raise BadRequestError('PDT003', 'Book Rating is required')
        elif args["book_author"] is None:
            raise BadRequestError('PDT004', 'Book Author is required')
        else:
            try:
                prod_to_update: query.Query = db.session.query(Book).filter(Book.book_id == book_id)
            except:
                raise InternalError()

            if prod_to_update.count() == 0:
                raise NotFoundError()

            if args["section_name"] is not None:
                givensec = db.session.query(Section).filter(Section.section_name == args["section_name"]).first()
                if givensec is None:
                    raise NotFoundError()

                if args["book_image"] is not None:
                    prod_to_update.update({"book_name": args["book_name"], "book_price": args["book_price"],
                                           "book_rating": args["book_rating"], "book_author": args["book_author"],
                                           "section_id": givensec.section_id, "book_image": args["book_image"]})
                else:
                    prod_to_update.update({"book_name": args["book_name"], "book_price": args["book_price"],
                                           "book_rating": args["book_rating"], "book_author": args["book_author"],
                                           "section_id": givensec.section_id})

            try:
                if args["book_image"] is not None:
                    prod_to_update.update({"book_name": args["book_name"], "book_price": args["book_price"],
                                           "book_rating": args["book_rating"], "book_author": args["book_author"],
                                           "book_image": args["book_image"]})
                else:
                    prod_to_update.update({"book_name": args["book_name"], "book_price": args["book_price"],
                                           "book_rating": args["book_rating"], "book_author": args["book_author"]})
                db.session.commit()
                x = prod_to_update.first()
                return x, 200

            except Exception as e:
                if str(e)[1:23] == 'sqlite3.IntegrityError':
                    raise ConflictError()
                else:
                    print(e)
                    raise InternalError()

    # Delete a book with a given book_id
    @only_admins
    def delete(self, book_id):
        try:
            book_to_del: query.Query = db.session.query(Book).filter(Book.book_id == book_id)
        except:
            raise InternalError()

        # Since the first() call is not made, the object is still a Query. The Count is thus checked.
        # The reason for maintaining the query object is that only they have a delete method.
        if book_to_del.count() == 0:
            raise NotFoundError()
        else:
            book_to_del.delete()
            db.session.commit()
            return make_response('', 200)

    # Add a book to a section with a given section_id
    @only_admins
    def post(self, sec_id):
        args = book_req_parser.parse_args()

        if args["book_name"] is None:
            raise BadRequestError('PDT001', 'Book Name is required')
        elif args["book_price"] is None:
            raise BadRequestError('PDT002', 'Book Price is required')
        elif args["book_author"] is None:
            raise BadRequestError('PDT003', 'Book Author is required')
        elif args["book_rating"] is None:
            raise BadRequestError('PDT004', 'Book Rating is required')
        else:
            try:
                db.session.add(Book(**args, section_id=sec_id))
                db.session.commit()
            except Exception as e:
                if str(e)[1:23] == 'sqlite3.IntegrityError':
                    raise ConflictError()
                else:
                    print(e)
                    raise InternalError()

        return make_response('', 201)
