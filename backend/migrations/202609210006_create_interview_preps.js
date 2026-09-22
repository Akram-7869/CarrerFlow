export async function up(knex) {
  await knex.schema.createTable('interview_preps', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('application_id').notNullable().references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('question_set').notNullable();
    table.jsonb('answer_notes').notNullable().defaultTo(JSON.stringify({}));
    table.jsonb('completed_questions').notNullable().defaultTo(JSON.stringify([]));
    table.jsonb('warnings').notNullable().defaultTo(JSON.stringify([]));
    table.string('model', 120);
    table.string('generation_version', 30).notNullable();
    table.timestamps(true, true);

    table.unique(['application_id']);
    table.index(['user_id', 'updated_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('interview_preps');
}
