# CollectApp

This repository is only for the frontend. This is a link to frontend https://github.com/patrickwalczak/Collection-Manager

About the application

This is a web application for personal collection management. You can create collection of books, movies, wines etc.

Logged user can:

- create and modify (edit, delete) collections,
- create and modify (edit, delete) collection items,
- leave a comment on items,
- like items,

Only admin or creator of the collections or items can manage them (edit, add, delete). Everything is accessible for viewing for everyone.

Admin has its own panel where he can block, unblock, delete users and add or remove admin.

Admin see all pages as their author (for example, admin can open collection of other user and add an item it it; so, admin is virtually owner of every collection and every item).

Application provides dark and light mode and supports two languages.

Full-text search is implemented with MongoDB (it doesn't matter if query will be found in item comment or tags or additional fields)

Main Page contains cool feature in my opinion. I am talking about tag cloud and when tag will be clicked, then we will see a list of items which contain clicked tag.

Login credentials for admin
email: test@test.com
password: qwe
