from flask_restful import Resource, reqparse, marshal_with, fields, request
from ...model.models import Section, Book, SectionSearch, BookSearch, AuthorSearch
from ...model.db import db

book_json = {"book_id": fields.Integer,
             "book_name": fields.String,
             "book_price": fields.Float,
             "book_image": fields.String,
             "book_rating": fields.Float,
             "book_author": fields.String}
#
class Search(Resource):
    @marshal_with(book_json)
    def post(self):

        args = request.get_json(force=True)
        search_query = args['q']
        section_filter = args['section_filter']
        rating_filter = args['rating_filter']
        price_filter = args['price_filter']
        results = []

        for bs_obj in BookSearch.query.filter(BookSearch.book_name.op("MATCH")(search_query)).all():
            results.append(bs_obj.book)

        for section_search_obj in SectionSearch.query.filter(SectionSearch.section_name.op("MATCH")(search_query)).all():
            for book in section_search_obj.section.books:
                if book not in results:
                    results.append(book)

        for author_search_obj in AuthorSearch.query.filter(AuthorSearch.author_name.op("MATCH")(search_query)).all():
            for book in author_search_obj.author.books:
                if book not in results:
                    results.append(book)

        if section_filter is not None:
            for result in results:
                if result.section.section_name not in section_filter:
                    results.remove(result)

        if price_filter is not None:
            for result in results:
                if result.product_price < price_filter[0] or result.product_price > price_filter[1]:
                    results.remove(result)

        if rating_filter is not None:
            for result in results:
                if result.product_rating < rating_filter:
                    results.remove(result)

        for result in results:
            result.book_author = result.author.author_name
        return results, 200
