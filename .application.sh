#!/bin/bash
sqlite3 ../khk-ssa/khk-access/db.sqlite "INSERT INTO apps (name, privilegeRequired, subdomain, icon) values (\"Mail Admin\", 2, \"tmfmat\", \"fa-envelope\");"
