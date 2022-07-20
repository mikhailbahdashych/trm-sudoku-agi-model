exports.up = function(knex) {
  return knex.schema.createTable('question_answers', table => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid ()')).primary()

    table.uuid('question_id')
      .references('id')
      .inTable('questions')
      .notNullable()

    table.uuid('author_answer_id')
      .references('id')
      .inTable('users')
      .notNullable()

    table.text('answer_text').notNullable()
    table.boolean('is_answer').defaultTo(false)

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('question_answers')
};
