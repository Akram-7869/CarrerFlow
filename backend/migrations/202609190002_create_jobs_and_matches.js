export async function up(knex) {
  await knex.schema.createTable('jobs', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('company', 180).notNullable();
    table.string('title', 180).notNullable();
    table.text('description').notNullable();
    table.string('location', 180);
    table.string('work_mode', 30).notNullable().defaultTo('unspecified');
    table.string('employment_type', 50);
    table.text('apply_url');
    table.string('source', 50).notNullable().defaultTo('manual');
    table.string('status', 30).notNullable().defaultTo('analyzing');
    table.text('analysis_error');
    table.timestamps(true, true);

    table.index(['user_id', 'created_at']);
    table.index(['user_id', 'company']);
  });

  await knex.schema.createTable('job_analyses', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('job_id').notNullable().references('id').inTable('jobs').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('analysis').notNullable();
    table.string('extraction_model', 100).notNullable();
    table.string('extraction_version', 30).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['job_id', 'created_at']);
    table.index(['user_id', 'created_at']);
  });

  await knex.schema.createTable('job_resume_matches', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('job_id').notNullable().references('id').inTable('jobs').onDelete('CASCADE');
    table.uuid('resume_id').notNullable().references('id').inTable('resumes').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('match_score').notNullable();
    table.string('recommendation', 40).notNullable();
    table.jsonb('score_breakdown').notNullable();
    table.jsonb('supported').notNullable().defaultTo('[]');
    table.jsonb('partial').notNullable().defaultTo('[]');
    table.jsonb('missing').notNullable().defaultTo('[]');
    table.jsonb('experience_match').notNullable();
    table.jsonb('responsibility_match').notNullable();
    table.jsonb('keyword_match').notNullable();
    table.string('matcher_version', 30).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['job_id', 'resume_id', 'created_at']);
    table.index(['user_id', 'created_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('job_resume_matches');
  await knex.schema.dropTableIfExists('job_analyses');
  await knex.schema.dropTableIfExists('jobs');
}
