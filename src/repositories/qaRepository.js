const knex = require('../knex/knex')
const tableName = 'questions'

module.exports = {
  incrementViewCounter: async ({ id, slug }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .modify((x) => {
        if (id) x.where('questions.id', id)
        else if (slug) x.where('slug', 'ilike',`%${slug}%`)
      })
      .increment('views', 1)
    return transaction ? result.transacting(transaction) : result
  },
  getQuestion: async ({ id, slug }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .leftJoin('users', 'users.id', 'questions.user_id')
      .leftJoin('users_info', 'users_info.user_id', 'users.id')
      .modify((x) => {
        if (id) x.where('questions.id', id)
        else if (slug) x.where('slug', 'ilike',`%${slug}%`)
      })
      .first(
        'questions.id',
        'title',
        'slug',
        'content',
        'votes',
        'is_answered',
        'views',
        'questions.created_at',
        'users_info.username'
      )
    return transaction ? result.transacting(transaction) : result
  },
  getQuestionsAnswers: async ({ questionId }, { transaction } = { transaction: null }) => {
    const result = knex('question_answers')
      .leftJoin('users', 'users.id', 'question_answers.author_answer_id')
      .leftJoin('users_info', 'users_info.user_id', 'users.id')
      .where('question_id', questionId)
      .select('answer_text', 'is_answer', 'question_answers.created_at', 'users_info.username')
    return transaction ? result.transacting(transaction) : result
  },
  getUserQuestions: async ({ userId, sort }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('user_id', userId)
      .modify(x => {
        if (sort === 'score') {
          x.orderBy('votes', 'desc')
        }
      })
      .select('id', 'title', 'slug','votes', 'created_at', 'is_answered', 'views')
    return transaction ? result.transacting(transaction) : result
  },
  countQuestionsAnswers: async ({ questionsIds }, { transaction } = { transaction: null }) => {
    const result = knex('question_answers')
      .whereIn('question_id', questionsIds)
      .select('question_id')
      .count('question_id as count')
      .groupBy(['question_id'])
    return transaction ? result.transacting(transaction) : result
  },
  getQuestions: async ({ by }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .leftJoin('users', 'users.id', 'questions.user_id')
      .leftJoin('users_info', 'users_info.user_id','users.id')
      .select(
        'questions.id',
        'questions.title',
        'questions.slug',
        'questions.votes',
        'questions.created_at',
        'questions.is_answered',
        'questions.views',
        'users_info.username'
      )
      .orderBy('created_at')
      .limit(10)
    return transaction ? result.transacting(transaction) : result
  },
  createQuestion: async (data, { transaction } = { transaction: null }) => {
    const result = knex(tableName).insert(data).returning('slug')
    return transaction ? result.transacting(transaction) : result
  },
  answerQuestion: async (data, { transaction } = { transaction: null }) => {
    const result = knex('question_answers').insert(data)
    return transaction ? result.transacting(transaction) : result
  }
}
