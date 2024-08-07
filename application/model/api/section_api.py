from flask_restful import Resource, marshal_with, fields, reqparse
from flask_sqlalchemy import query
from flask import make_response
from ...model.models import Section, BookRequests, BookOrders
from ...model.db import db
from .api_helpers import NotFoundError, InternalError, BadRequestError, ConflictError, AuthError
from datetime import datetime
from application.controller.helper_functions import only_admins, session_user
from base64 import b64encode, b64decode

section_json = {"section_id": fields.Integer,
                "section_name": fields.String,
                "date_of_creation": fields.DateTime,
                "section_description": fields.String}

section_req_parser = reqparse.RequestParser()
section_req_parser.add_argument("section_name", type=str, required=True)
section_req_parser.add_argument("section_description", type=str)

book_json = {"book_id": fields.Integer,
             "book_name": fields.String,
             "book_price": fields.Float,
             "book_image": fields.String,
             "book_rating": fields.Float,
             "book_author": fields.String,
             "book_owned": fields.Boolean,
             "request_status": fields.String,
             }

full_json = {"section_id": fields.Integer,
             "section_name": fields.String,
             "date_of_creation": fields.DateTime,
             "section_description": fields.String,
             "books": fields.List(fields.Nested(book_json))}


class UserSectionsApi(Resource):

    # get all the sections' details
    @marshal_with(full_json)
    def get(self):

        user = session_user()
        if user is None:
            try:
                sections = db.session.query(Section).all()
                for section in sections:
                    for book in section.books:
                        book.request_status = None
            except:
                raise InternalError()

            return sections, 200

        else:
            try:
                sections = db.session.query(Section).all()
                for section in sections:
                    for book in section.books:
                        temp = db.session.query(BookRequests).filter(BookRequests.book_id == book.book_id,
                                                                     BookRequests.user_id == user.user_id,
                                                                     (BookRequests.request_status == "Pending") | (
                                                                                 BookRequests.request_status == "Approved")).first()
                        if temp is not None:
                            book.request_status = temp.request_status
                        else:
                            book.request_status = None

                        temp = db.session.query(BookOrders).filter(BookOrders.book_id == book.book_id,
                                                                   BookOrders.user_id == user.user_id).first()
                        if temp is not None:
                            book.book_owned = True
                        else:
                            book.book_owned = False

            except Exception as e:
                print(e)
                raise InternalError()

            return sections, 200


class SectionApi(Resource):

    # Get details about a section with a given section_id
    @marshal_with(section_json)
    def get(self, section_id):
        try:
            section_info = db.session.query(Section).filter(Section.section_id == section_id).first()
        except:
            raise InternalError()

        # Since the first() call is made, an empty Query results in a None object.
        if section_info is None:
            raise NotFoundError()
        else:
            return section_info, 200

    # Update the details of a section with a given section_id
    @marshal_with(section_json)
    @only_admins
    def put(self, section_id):
        args = section_req_parser.parse_args()
        sn = args['section_name']
        sd = args['section_description']

        if sn is None:
            raise BadRequestError('SEC001', 'Section Name is required')
        else:
            try:
                sec_to_update: query.Query = db.session.query(Section).filter(Section.section_id == section_id)
            except:
                raise InternalError()

            if sec_to_update.count() == 0:
                raise NotFoundError()
            else:

                try:
                    sec_to_update.update({"section_name": sn, "section_description": sd})
                    db.session.commit()
                    return sec_to_update.first(), 200

                except Exception as e:
                    if str(e)[1:23] == 'sqlite3.IntegrityError':
                        raise ConflictError()
                    else:
                        raise InternalError()

    # Delete a section with a given section_id
    @only_admins
    def delete(self, section_id):
        try:
            sec_to_del = db.session.query(Section).get(section_id)
        except:
            raise InternalError()

        # Since the first() call is not made, the object is still a Query. The Count is thus checked.
        # The reason for maintaining the query object is that only they have a delete method.
        if not sec_to_del:
            raise NotFoundError()
        else:
            db.session.delete(sec_to_del)
            db.session.commit()
            return make_response('', 200)

    # Add a new section
    @only_admins
    def post(self):
        args = section_req_parser.parse_args()
        sn = args['section_name']
        sd = args['section_description']

        if sn is None:
            raise BadRequestError('SEC001', 'Section Name is required')
        else:
            try:
                db.session.add(Section(sn, datetime.now(), sd))
                db.session.commit()
            except Exception as e:
                if str(e)[1:23] == 'sqlite3.IntegrityError':
                    raise ConflictError()
                else:
                    raise InternalError()

        return make_response('', 201)
