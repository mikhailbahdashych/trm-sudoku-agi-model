exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid ()')).primary()
    table.string('email').notNullable()
    table.string('password').notNullable()
    table.string('personal_id').notNullable()
    table.string('two_fa').nullable()
    table.string('phone').nullable()
    table.boolean('notify').notNullable().defaultTo(false)
    table.boolean('close_account').notNullable().defaultTo(false)

    table.string('activation_link').nullable()
    table.boolean('is_activated').notNullable().defaultTo(false)

    table.boolean('changed_email').notNullable().defaultTo(false)
    table.timestamp('changed_password_at').nullable().defaultTo(null)

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('users')
};
