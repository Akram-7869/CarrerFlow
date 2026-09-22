export async function up(knex) {
  await knex.schema.createTable('tailoring_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('resume_id').notNullable().references('id').inTable('resumes').onDelete('CASCADE');
    table.uuid('job_id').notNullable().references('id').inTable('jobs').onDelete('CASCADE');
    table.uuid('job_resume_match_id').references('id').inTable('job_resume_matches').onDelete('SET NULL');
    table.string('status', 30).notNullable().defaultTo('generating');
    table.jsonb('warnings').notNullable().defaultTo('[]');
    table.string('generation_model', 100);
    table.string('generation_version', 30);
    table.text('generation_error');
    table.timestamps(true, true);

    table.index(['user_id', 'created_at']);
    table.index(['resume_id', 'job_id']);
  });

  await knex.schema.createTable('resume_change_proposals', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('tailoring_session_id').notNullable().references('id').inTable('tailoring_sessions').onDelete('CASCADE');
    table.string('proposal_type', 30).notNullable();
    table.string('section_type', 30).notNullable();
    table.integer('item_index');
    table.integer('bullet_index');
    table.text('original_text').notNullable();
    table.text('proposed_text').notNullable();
    table.text('rationale').notNullable();
    table.jsonb('evidence_refs').notNullable().defaultTo('[]');
    table.string('status', 20).notNullable().defaultTo('pending');
    table.text('edited_text');
    table.integer('display_order').notNullable().defaultTo(0);
    table.timestamps(true, true);

    table.index(['tailoring_session_id', 'display_order']);
  });

  await knex.schema.createTable('resume_versions', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('source_resume_id').notNullable().references('id').inTable('resumes').onDelete('CASCADE');
    table.uuid('job_id').references('id').inTable('jobs').onDelete('SET NULL');
    table.uuid('tailoring_session_id').unique().references('id').inTable('tailoring_sessions').onDelete('SET NULL');
    table.string('name', 180).notNullable();
    table.integer('version_number').notNullable();
    table.jsonb('content').notNullable();
    table.string('status', 20).notNullable().defaultTo('ready');
    table.timestamps(true, true);

    table.unique(['source_resume_id', 'version_number']);
    table.index(['user_id', 'created_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('resume_versions');
  await knex.schema.dropTableIfExists('resume_change_proposals');
  await knex.schema.dropTableIfExists('tailoring_sessions');
}
