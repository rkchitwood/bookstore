process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require('../app');
const db = require('../db');

let book_isbn;

beforeEach(async () => {
    let result = await db.query(`
        INSERT INTO
            books (isbn, amazon_url, author, language, pages, publisher, title, year)
            VALUES(
                '123',
                'https://www.amazon.com/test,
                'test jones',
                'english'
                '100',
                'test people',
                'test book',
                '2024')
            RETURNING isbn`);
    book_isbn = result.rows[0];
});
  
afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
});  
  
afterAll(async function () {
    await db.end()
});

describe("POST /books", function () {
    test("creates new book", async function () {
      const response = await request(app)
          .post(`/books`)
          .send({
            isbn: '456',
            amazon_url: "https://www.amazon.com/test2",
            author: "another tester",
            language: "english",
            pages: 100,
            publisher: "tstpblshr",
            title: "another test book",
            year: 2000
          });
      expect(response.statusCode).toBe(201);
      expect(response.body.book).toHaveProperty("isbn");
});
  
    test("need title to create book", async function () {
      const response = await request(app)
          .post(`/books`)
          .send({year: 2000});
      expect(response.statusCode).toBe(400);
    });
});

describe("GET /books", function () {
    test("gets list of books", async function () {
      const response = await request(app).get(`/books`);
      const books = response.body.books;
      expect(books).toHaveLength(1);
      expect(books[0]).toHaveProperty("isbn");
      expect(books[0]).toHaveProperty("amazon_url");
    });
});

describe("GET /books/:isbn", function () {
    test("gets a book", async function () {
      const response = await request(app)
          .get(`/books/${book_isbn}`)
      expect(response.body.book).toHaveProperty("isbn");
      expect(response.body.book.isbn).toBe(book_isbn);
});
  
    test("responds w/ 404 if no book", async function () {
      const response = await request(app)
          .get(`/books/999`)
      expect(response.statusCode).toBe(404);
    });
});

describe("PUT /books/:id", function () {
    test("updates a book", async function () {
      const response = await request(app)
          .put(`/books/${book_isbn}`)
          .send({
            amazon_url: "https://www.amazon.com/test",
            author: "test jones",
            language: "english",
            pages: 100,
            publisher: "test people",
            title: "UPDATED BOOK",
            year: 2024
          });
      expect(response.body.book).toHaveProperty("isbn");
      expect(response.body.book.title).toBe("UPDATED BOOK");
});
  
    test("prevents unwanted fields", async function () {
      const response = await request(app)
          .put(`/books/${book_isbn}`)
          .send({
            isbn: "123",
            badField: "DO NOT ADD ME!",
            amazon_url: "https://www.amazon.com/test",
            author: "test jones",
            language: "english",
            pages: 100,
            publisher: "test people",
            title: "UPDATED BOOK",
            year: 2024
          });
      expect(response.statusCode).toBe(400);
});
  
    test("responds with 404 if no book", async function () {
      // delete book first
      await request(app)
          .delete(`/books/${book_isbn}`)
      const response = await request(app).delete(`/books/${book_isbn}`);
      expect(response.statusCode).toBe(404);
    });
});

describe("DELETE /books/:id", function () {
    test("deletes a book", async function () {
      const response = await request(app)
          .delete(`/books/${book_isbn}`)
      expect(response.body).toEqual({message: "Book deleted"});
    });
});
