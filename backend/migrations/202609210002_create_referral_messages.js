export async function up(knex) {
  await knex.schema.createTable('referral_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('job_id').notNullable().references('id').inTable('jobs').onDelete('CASCADE');
    table.uuid('candidate_id').notNullable().references('id').inTable('referral_candidates').onDelete('CASCADE');
    table.uuid('resume_id').notNullable().references('id').inTable('resumes').onDelete('CASCADE');
    table.text('generated_message').notNullable();
    table.text('message').notNullable();
    table.string('tone', 30).notNullable();
    table.jsonb('evidence_refs').notNullable().defaultTo('[]');
    table.jsonb('warnings').notNullable().defaultTo('[]');
    table.boolean('is_edited').notNullable().defaultTo(false);
    table.string('generation_model', 100).notNullable();
    table.string('generation_version', 30).notNullable();
    table.timestamps(true, true);

    table.index(['user_id', 'candidate_id', 'created_at']);
    table.index(['user_id', 'job_id', 'created_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('referral_messages');
}
