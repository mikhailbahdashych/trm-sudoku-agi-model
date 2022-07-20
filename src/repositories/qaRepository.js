const knex = require('../knex/knex')
const tableName = 'questions'

module.exports = {
  getQuestion: async ({ id, slug }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .leftJoin('users', 'users.id', 'questions.author_id')
      .leftJoin('users_info', 'users_info.user_id', 'users.id')
      .modify((x) => {
        if (id) x.where('id', id)
        else if (slug) x.where('slug', 'ilike',`%${slug}%`)
      })
      .first(
        'questions.id',
        'title',
        'slug',
        'content',
        'votes',
        'is_answered',
        'users_info.username'
      )
    return transaction ? result.transacting(transaction) : result
  },
  getQuestionsAnswers: async ({ questionId }, { transaction } = { transaction: null }) => {
    const result = knex('question_answers')
      .leftJoin('users', 'users.id', 'question_answers.author_answer_id')
      .leftJoin('users_info', 'users_info.user_id', 'users.id')
      .where('question_id', questionId)
      .select(
        'answer_text',
        'is_answer',
        'users_info.username'
      )
    return transaction ? result.transacting(transaction) : result
  },
  getQuestionsBySortType: async ({ by }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .leftJoin('users', 'users.id', 'questions.author_id')
      .leftJoin('users_info', 'users_info.user_id','users.id')
      .select(
        'questions.id',
        'questions.title',
        'questions.slug',
        'questions.votes',
        'questions.created_at',
        'questions.is_answered',
        'users_info.username'
      )
      .orderBy('created_at')
      .limit(10)
    return transaction ? result.transacting(transaction) : result
  },
  createQuestion: async (data, { transaction } = { transaction: null }) => {
    const result = knex(tableName).insert(data).returning('slug')
    return transaction ? result.transacting(transaction) : result
  }
}
