from .db import db

class User(db.Model):
    __tablename__ = "user"

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # TODO: What if it overflows?
    user_name = db.Column(db.String(50), unique=True, nullable=False)
    user_password = db.Column(db.BINARY(32), nullable=False)
    password_salt = db.Column(db.String(16), nullable=False)
    user_email = db.Column(db.String(256), unique=True, nullable=False)  # TODO: Send an email confirmation?
    user_type = db.Column(db.String(10), nullable=False)
    last_login = db.Column(db.DateTime)

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

    author_id = db.Column(db.Integer, db.ForeignKey('author.author_id'), nullable=False)
    author = db.relationship('Author', back_populates='books')

    section_id = db.Column(db.Integer, db.ForeignKey('section.section_id'), nullable=False)
    section = db.relationship('Section', back_populates='books')

    def __init__(self, book_name, book_price, book_image, book_rating, section_id, author_id):
        self.book_name = book_name
        self.book_price = book_price
        self.book_image = book_image
        self.book_rating = book_rating
        self.author_id = author_id
        self.section_id = section_id

class Author(db.Model):
    __tablename__ = "author"

    author_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    author_name = db.Column(db.String(50), nullable=False)

    books = db.relationship('Book', back_populates='author', cascade='all, delete-orphan')

    def __init__(self, author_name):
        self.author_name = author_name

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

class BookSearch(db.Model):
    __tablename__ = "book_search"

    rowid = db.Column(db.Integer, db.ForeignKey('book.book_id'), primary_key=True)
    book_name = db.Column(db.String(50))
    book = db.relationship('Book')

class SectionSearch(db.Model):
    __tablename__ = "section_search"

    rowid = db.Column(db.Integer, db.ForeignKey('section.section_id'), primary_key=True)
    section_name = db.Column(db.String(50))
    section = db.relationship('Section')

class AuthorSearch(db.Model):
    __tablename__ = "author_search"

    rowid = db.Column(db.Integer, db.ForeignKey('author.author_id'), primary_key=True)
    author_name = db.Column(db.String(50))
    author = db.relationship('Author')

db.create_all()

# The following SQL code is to be executed to create the FTS5 virtual tables and triggers.
"""
CREATE VIRTUAL TABLE
book_search
USING fts5(book_name, content=book,content_rowid=book_id, tokenize="porter unicode61");

CREATE VIRTUAL TABLE
author_search
USING fts5(author_name, content=author,content_rowid=author_id, tokenize="porter unicode61");

CREATE VIRTUAL TABLE
section_search
USING fts5(section_name, content=section,content_rowid=section_id, tokenize="porter unicode61");

CREATE TRIGGER book_add_trigger
AFTER INSERT ON book
BEGIN
insert into book_search(book_name,rowid) values (new.book_name, new.rowid);
END;

CREATE TRIGGER book_delete_trigger
AFTER DELETE ON book
BEGIN
insert into book_search(book_search, book_name, rowid) values ('delete', old.book_name, old.rowid);
END;

CREATE TRIGGER book_update_trigger
AFTER UPDATE ON book
BEGIN
insert into book_search(book_search, book_name, rowid) values ('delete', old.book_name, old.rowid);
insert into book_search(book_name, rowid) values (new.book_name, new.rowid);
END;

CREATE TRIGGER section_add_trigger
AFTER INSERT ON section
BEGIN
insert into section_search(section_name, rowid) values (new.section_name, new.rowid);
END;

CREATE TRIGGER section_delete_trigger
AFTER DELETE ON section
BEGIN
insert into section_search(section_search, section_name, rowid) values ('delete', old.section_name, old.rowid);
END;

CREATE TRIGGER section_update_trigger
AFTER UPDATE ON section
BEGIN
insert into section_search(section_search, section_name, rowid) values ('delete', old.section_name, old.rowid);
insert into section_search(section_name, rowid) values (new.section_name, new.rowid);
END;

CREATE TRIGGER author_add_trigger
AFTER INSERT ON author
BEGIN
insert into author_search(author_name, rowid) values (new.author_name, new.rowid);
END;

CREATE TRIGGER author_delete_trigger
AFTER DELETE ON author
BEGIN
insert into author_search(author_search, author_name, rowid) values ('delete', old.author_name, old.rowid);
END;

CREATE TRIGGER author_update_trigger
AFTER UPDATE ON author
BEGIN
insert into author_search(author_search, author_name, rowid) values ('delete', old.author_name, old.rowid);
insert into author_search(author_name, rowid) values (new.author_name, new.rowid);
END;

INSERT INTO book_search(book_search) VALUES("rebuild");
INSERT INTO section_search(section_search) VALUES("rebuild");
INSERT INTO author_search(author_search) VALUES("rebuild");
"""