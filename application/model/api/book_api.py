from copy import deepcopy
from flask_restful import Resource, marshal_with, fields, reqparse
from flask_sqlalchemy import query
from flask import make_response, request
from ...model.models import Book, BookRequests, BookOrders, Section, Author
from ...model.db import db
from .api_helpers import NotFoundError, InternalError, BadRequestError, ConflictError, AuthError
from application.controller.helper_functions import only_admins, session_user
from ...model.cache import cache

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
                book.request_status = req.request_status
                book.date_of_request = req.date_of_request
                book.date_of_issue = req.date_of_issue
                book.due_date = req.due_date
                book.req_id = req.order_id
                book.book_author = req.book.author.author_name
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
                                                         (BookRequests.request_status != "Pending")).all()
            books = []
            for req in reqs:
                book = deepcopy(req.book)
                book.request_status = req.request_status
                book.date_of_request = req.date_of_request
                book.date_of_issue = req.date_of_issue
                book.due_date = req.due_date
                book.req_id = req.order_id
                book.book_author = req.book.author.author_name

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
                book.book_author = book.author.author_name
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
            book_info.book_author = book_info.author.author_name
        except:
            raise InternalError()

        # Since the first() call is made, an empty Query results in a None object.
        if book_info is None:
            raise NotFoundError()
        else:
            return book_info, 200

    # Update the details of a book with a given book_id
    @marshal_with(book_json)
    @only_admins
    def put(self, book_id):
        cache.clear()
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

            givensec = None
            if args["section_name"] is not None:
                givensec = db.session.query(Section).filter(Section.section_name == args["section_name"]).first()
                if givensec is None:
                    raise NotFoundError()

            old_author = prod_to_update.first().author
            author_id = old_author.author_id
            old_author_del_flag = False
            if args["book_author"] != old_author.author_name:
                try:
                    new_author = db.session.query(Author).filter(Author.author_name == args["book_author"]).first()
                except:
                    raise InternalError()
                if new_author is None:
                    db.session.add(Author(author_name=args["book_author"]))
                    db.session.commit()
                new_author = db.session.query(Author).filter(Author.author_name == args["book_author"]).first()
                author_id = new_author.author_id
                if len(old_author.books) == 1:
                    old_author_del_flag = True


            try:
                if args["book_image"] is not None:
                    prod_to_update.update({"book_name": args["book_name"], "book_price": args["book_price"],
                                           "book_rating": args["book_rating"],
                                           "author_id": author_id,
                                           "section_id": prod_to_update.first().section_id if givensec is None else givensec.section_id,
                                           "book_image": args["book_image"]})
                else:
                    prod_to_update.update({"book_name": args["book_name"], "book_price": args["book_price"],
                                           "book_rating": args["book_rating"],
                                           "author_id": author_id,
                                           "section_id": prod_to_update.first().section_id if givensec is None else givensec.section_id,})
                db.session.commit()
                if old_author_del_flag:
                    db.session.delete(old_author)
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
        cache.clear()
        try:
            book_to_del: query.Query = db.session.query(Book).filter(Book.book_id == book_id)
        except:
            raise InternalError()

        # Since the first() call is not made, the object is still a Query. The Count is thus checked.
        # The reason for maintaining the query object is that only they have a delete method.
        if book_to_del.count() == 0:
            raise NotFoundError()
        else:
            if len(book_to_del.first().author.books)== 1:
                db.session.delete(book_to_del.first().author)
            book_to_del.delete()
            db.session.commit()
            return make_response('', 200)

    # Add a book to a section with a given section_id
    @only_admins
    def post(self, sec_id):
        cache.clear()
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
            # if author dne, then make new entry, if exists, find id and use
            if db.session.query(Author).filter(Author.author_name == args["book_author"]).count() == 0:
                db.session.add(Author(author_name=args["book_author"]))
                db.session.commit()
            author_id = db.session.query(Author).filter(Author.author_name == args["book_author"]).first().author_id
            args["author_id"] = author_id
            del args["book_author"]
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
