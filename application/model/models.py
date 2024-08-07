from .db import db


class User(db.Model):
    __tablename__ = "user"

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # TODO: What if it overflows?
    user_name = db.Column(db.String(50), unique=True, nullable=False)
    user_password = db.Column(db.BINARY(32), nullable=False)
    password_salt = db.Column(db.String(16), nullable=False)
    user_email = db.Column(db.String(256), unique=True, nullable=False)  # TODO: Send an email confirmation?
    user_type = db.Column(db.String(10), nullable=False)

    my_owned_books = db.relationship('BookOrders', back_populates='user')
    my_requests = db.relationship('BookRequests', back_populates='user')

    def __init__(self, user_name, user_password, password_salt, user_email, user_type):
        self.user_name = user_name
        self.user_password = user_password
        self.password_salt = password_salt
        self.user_email = user_email
        self.user_type = user_type


class Section(db.Model):
    __tablename__ = "section"

    section_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    section_name = db.Column(db.String(50), unique=True, nullable=False)
    date_of_creation = db.Column(db.DateTime, nullable=False)
    section_description = db.Column(db.String(256), nullable=False)

    books = db.relationship('Book', back_populates='section', cascade='all, delete-orphan')

    # section_search = db.relationship('SectionSearch', back_populates='section')

    def __init__(self, section_name, date_of_creation, section_description):
        self.section_name = section_name
        self.date_of_creation = date_of_creation
        self.section_description = section_description


class Book(db.Model):
    __tablename__ = "book"

    book_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    book_name = db.Column(db.String(50), nullable=False)
    book_price = db.Column(db.Float, nullable=False)
    book_image = db.Column(db.String(256))
    book_rating = db.Column(db.Float, nullable=False)
    book_author = db.Column(db.String(50), nullable=False)

    section_id = db.Column(db.Integer, db.ForeignKey('section.section_id'), nullable=False)
    section = db.relationship('Section', back_populates='books')

    # book_search = db.relationship('BookSearch', back_populates='book')

    def __init__(self, book_name, book_price, book_image, book_rating, section_id, book_author):
        self.book_name = book_name
        self.book_price = book_price
        self.book_image = book_image
        self.book_rating = book_rating
        self.book_author = book_author
        self.section_id = section_id


class BookRequests(db.Model):
    __tablename__ = "bookrequests"
    # One entry in this table corresponds to one user requesting one book.

    order_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False, index=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.book_id'), nullable=False, index=True)

    date_of_request = db.Column(db.DateTime, nullable=False)
    date_of_issue = db.Column(db.DateTime)
    due_date = db.Column(db.DateTime)

    request_status = db.Column(db.String, nullable=False) # Pending, Approved, Rejected, Archived

    user = db.relationship('User', back_populates='my_requests')
    book = db.relationship('Book')

    def __init__(self, user_id, book_id, date_of_request, approval_status, request_status="Pending"):
        self.user_id = user_id
        self.book_id = book_id
        self.date_of_request = date_of_request
        self.approval_status = approval_status
        self.request_status = request_status


class BookOrders(db.Model):
    __tablename__ = "bookorders"
    # One entry in this table corresponds to one user owning one book.

    order_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False, index=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.book_id'), nullable=False, index=True)

    user = db.relationship('User', back_populates='my_owned_books')
    book = db.relationship('Book')

    def __init__(self, user_id, book_id):
        self.user_id = user_id
        self.book_id = book_id

# class ProductSearch(db.Model):
#     __tablename__ = "product_search"
#
#     rowid = db.Column(db.Integer, db.ForeignKey('product.product_id'), primary_key=True)
#     product_name = db.Column(db.String(50))
#     product = db.relationship('Product')
#
# class CatSearch(db.Model):
#     __tablename__ = "cat_search"
#
#     rowid = db.Column(db.Integer, db.ForeignKey('category.category_id'), primary_key=True)
#     category_name = db.Column(db.String(50))
#     category = db.relationship('Category')


db.create_all()

# x=db.session.query(User).filter(User.user_name == 'morgan freeman')
# print(f"Updating {x} in models.py", x.first().user_type)
# x.update({'user_type': 'God'})
# print(x.first().user_type)
# db.session.commit()

# CREATE VIRTUAL TABLE
# product_search
# USING fts5(product_name, content=product,content_rowid=product_id, tokenize="porter unicode61")

# CREATE TRIGGER product_add_trigger
# AFTER INSERT ON product
# BEGIN
# insert into product_search(product_name,rowid) values (new.product_name, new.rowid);
# END
#
# CREATE TRIGGER product_delete_trigger
# AFTER DELETE ON product
# BEGIN
# insert into product_search(product_search, product_name, rowid) values ('delete', old.product_name, old.rowid);
# END
#
# CREATE TRIGGER product_update_trigger
# AFTER UPDATE ON product
# BEGIN
# insert into product_search(product_search, product_name, rowid) values ('delete', old.product_name, old.rowid);
# insert into product_search(product_name, rowid) values (new.product_name, new.rowid);
# END

# CREATE VIRTUAL TABLE
# cat_search
# USING fts5(category_name, content=category,content_rowid=category_id, tokenize="porter unicode61")

# CREATE TRIGGER category_add_trigger
# AFTER INSERT ON category
# BEGIN
# insert into cat_search(category_name, rowid) values (new.category_name, new.rowid);
# END;
#
# CREATE TRIGGER category_delete_trigger
# AFTER DELETE ON category
# BEGIN
# insert into cat_search(cat_search, category_name, rowid) values ('delete', old.category_name, old.rowid);
# END;
#
# CREATE TRIGGER category_update_trigger
# AFTER UPDATE ON category
# BEGIN
# insert into cat_search(cat_search, category_name, rowid) values ('delete', old.category_name, old.rowid);
# insert into cat_search(category_name, rowid) values (new.category_name, new.rowid);
# END;
