const dotenv = require('dotenv');
dotenv.config();

module.exports = {

  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST_DEV,
      user: process.env.DB_USER_DEV,
      password: process.env.DB_PASS_DEV,
      database: process.env.DB_NAME_DEV,
      port: process.env.DB_PORT_DEV
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
      host: process.env.DB_HOST_PROD,
      user: process.env.DB_USER_PROD,
      password: process.env.DB_PASS_PROD,
      database: process.env.DB_NAME_PROD,
      port: process.env.DB_PORT_PROD
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
