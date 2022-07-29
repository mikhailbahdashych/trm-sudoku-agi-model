require('dotenv').config();

module.exports = {

  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    },
    debug: false,
    migrations: {
      tableName: "knex_migrations",
      directory: __dirname + "/src/knex/migrations",
    },
    seeds: {
      directory: __dirname + "/src/knex/seeds",
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    },
    debug: false,
    migrations: {
      tableName: "knex_migrations",
      directory: __dirname + "/src/knex/migrations",
    },
    seeds: {
      directory: __dirname + "/src/knex/seeds",
    },
  }

};
